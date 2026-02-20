/**
 * Client-side document OCR and parsing (Tesseract.js). No API key.
 * Used to extract ID/passport and insurance card fields from captured or uploaded images.
 */

export interface IdFields {
  firstName: string
  lastName: string
  dateOfBirth: string
  documentNumber: string
  nationality: string
  address: string
  phone: string
  email: string
}

export interface InsuranceFields {
  insuranceProvider: string
  policyOrMemberId: string
}

const EMPTY_ID: IdFields = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  documentNumber: "",
  nationality: "",
  address: "",
  phone: "",
  email: "",
}

const EMPTY_INSURANCE: InsuranceFields = {
  insuranceProvider: "",
  policyOrMemberId: "",
}

/** MRZ line 2 format: positions 0-9 document number, 10-13 nationality, 14-19 DOB (YYMMDD), etc. */
function parseMRZLine2(line: string): Partial<IdFields> {
  const out: Partial<IdFields> = {}
  const clean = line.replace(/\s/g, "").trim()
  if (clean.length < 20) return out
  const docNum = clean.slice(0, 9).replace(/</g, "").trim()
  if (docNum) out.documentNumber = docNum
  const nat = clean.slice(10, 13).replace(/</g, "").trim()
  if (nat) out.nationality = nat
  const dob = clean.slice(13, 19)
  if (dob && /^\d{6}$/.test(dob)) {
    const yy = parseInt(dob.slice(0, 2), 10)
    const year = yy >= 30 ? 1900 + yy : 2000 + yy
    out.dateOfBirth = `${year}-${dob.slice(2, 4)}-${dob.slice(4, 6)}`
  }
  return out
}

/** MRZ line 1 (or second line of TD3): name is last<<first. */
function parseMRZLine1ForName(line: string): Partial<IdFields> {
  const clean = line.replace(/\s/g, "").trim()
  const idx = clean.indexOf("<<")
  if (idx === -1) return {}
  const last = clean.slice(0, idx).replace(/</g, " ").trim()
  const first = clean.slice(idx + 2).replace(/</g, " ").trim()
  return { lastName: last, firstName: first }
}

/** Detect and parse MRZ (2 lines of 44 chars or similar). Returns merged IdFields from MRZ or empty. */
function tryParseMRZ(rawText: string): Partial<IdFields> | null {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const mrzLines = lines.filter((l) => /^[A-Z0-9<]+$/.test(l.replace(/\s/g, "")) && l.replace(/\s/g, "").length >= 30)
  if (mrzLines.length < 2) return null
  const line1 = mrzLines[mrzLines.length - 2].replace(/\s/g, "")
  const line2 = mrzLines[mrzLines.length - 1].replace(/\s/g, "")
  if (line1.length < 30 || line2.length < 20) return null
  const namePart = parseMRZLine1ForName(line1)
  const rest = parseMRZLine2(line2)
  return { ...namePart, ...rest }
}

/** Common date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY, etc. */
function extractDateOfBirth(text: string): string {
  const iso = text.match(/\b(19|20)\d{2}[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/)
  if (iso) return iso[0].replace(/\//g, "-")
  const dmy = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](19|20)\d{2}\b/)
  if (dmy) return `${dmy[3]}${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
  const mdy = text.match(/\b(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/](19|20)\d{2}\b/)
  if (mdy) return `${mdy[3]}${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`
  return ""
}

/** Heuristic: lines that look like "Surname" or "First Name" / "Given Name". */
function extractNamesFromLines(lines: string[]): { firstName: string; lastName: string } {
  let first = ""
  let last = ""
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()
    if (/\b(first|given)\s*name\s*[:.]?\s*(.+)/i.test(line)) {
      const m = line.match(/\b(first|given)\s*name\s*[:.]?\s*(.+)/i)
      if (m && m[2]) first = m[2].trim()
    }
    if (/\b(last|family|surname)\s*name\s*[:.]?\s*(.+)/i.test(line)) {
      const m = line.match(/\b(last|family|surname)\s*name\s*[:.]?\s*(.+)/i)
      if (m && m[2]) last = m[2].trim()
    }
    if (/^[A-Za-z][a-z]+\s+[A-Za-z][a-z]+(\s+[A-Za-z][a-z]+)*$/.test(line) && line.length < 60 && !first && !last) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 2) {
        last = parts[0]
        first = parts.slice(1).join(" ")
      }
    }
  }
  return { firstName: first, lastName: last }
}

/** Extract phone (E.164-ish or with spaces/dashes). */
function extractPhone(text: string): string {
  const m = text.match(/(\+?\d[\d\s\-().]{8,20}\d)/)
  return m ? m[1].replace(/\s/g, "").trim() : ""
}

/** Extract email. */
function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return m ? m[0] : ""
}

/** Extract address (heuristic: long line with digits and letters). */
function extractAddress(lines: string[]): string {
  for (const line of lines) {
    const t = line.trim()
    if (t.length >= 10 && t.length <= 80 && /\d/.test(t) && /[A-Za-z]/.test(t) && !t.includes("http")) return t
  }
  return ""
}

/** Run Tesseract OCR on an image (File or Blob). Returns raw text. */
export async function runOcr(image: File | Blob, lang: string = "eng"): Promise<string> {
  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker(lang, 1, {
    logger: () => {},
  })
  try {
    const blob = image instanceof File ? image : image
    const { data } = await worker.recognize(blob as Blob)
    return data.text || ""
  } finally {
    await worker.terminate()
  }
}

/** Parse raw OCR text into structured ID/passport fields. Uses MRZ if present, else heuristics. */
export function parseIdFields(rawText: string): IdFields {
  const merged: IdFields = { ...EMPTY_ID }
  const mrz = tryParseMRZ(rawText)
  if (mrz) {
    if (mrz.firstName) merged.firstName = mrz.firstName
    if (mrz.lastName) merged.lastName = mrz.lastName
    if (mrz.dateOfBirth) merged.dateOfBirth = mrz.dateOfBirth
    if (mrz.documentNumber) merged.documentNumber = mrz.documentNumber
    if (mrz.nationality) merged.nationality = mrz.nationality
  }
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const { firstName: f, lastName: l } = extractNamesFromLines(lines)
  if (f && !merged.firstName) merged.firstName = f
  if (l && !merged.lastName) merged.lastName = l
  if (!merged.dateOfBirth) merged.dateOfBirth = extractDateOfBirth(rawText)
  merged.phone = extractPhone(rawText)
  merged.email = extractEmail(rawText)
  merged.address = extractAddress(lines)
  return merged
}

/** Parse raw OCR text into insurance card fields. */
export function parseInsuranceFields(rawText: string): InsuranceFields {
  const out: InsuranceFields = { ...EMPTY_INSURANCE }
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const knownInsurers = ["blue cross", "delta dental", "aetna", "cigna", "humana", "united", "metlife", "guardian", "anthem", "wellpoint"]
  for (const line of lines) {
    if (line.length > 4 && line.length < 80 && !/^\d+$/.test(line)) {
      const lineLower = line.toLowerCase()
      for (const name of knownInsurers) {
        if (lineLower.includes(name)) {
          out.insuranceProvider = line.trim()
          break
        }
      }
    }
  }
  const policyMatch = rawText.match(/(?:policy|member\s*id|id\s*#?|subscriber\s*id)\s*[:.]?\s*([A-Za-z0-9\-]+)/i)
  if (policyMatch && policyMatch[1]) out.policyOrMemberId = policyMatch[1].trim()
  const numOnly = rawText.match(/\b(\d{6,15})\b/)
  if (!out.policyOrMemberId && numOnly) out.policyOrMemberId = numOnly[1]
  if (!out.insuranceProvider && lines.length > 0) out.insuranceProvider = lines[0].trim().slice(0, 80)
  return out
}
