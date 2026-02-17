# Dental Numbering Systems Reference

This document explains the three major tooth numbering systems supported by the interactive dental chart.

---

## Universal Numbering System (USA)

**Used in**: United States, Canada

**Adult Permanent Teeth**: Numbers 1-32

### Layout:
```
Upper Right    Upper Left
8 7 6 5 4 3 2 1 | 9 10 11 12 13 14 15 16

Lower Right    Lower Left
25 24 23 22 21 20 19 18 | 17 16 15 14 13 12 11 10
```

### Quadrants:
- **Quadrant 1** (Upper Right): 1-8
- **Quadrant 2** (Upper Left): 9-16
- **Quadrant 3** (Lower Left): 17-24
- **Quadrant 4** (Lower Right): 25-32

### Examples:
- **1** = Upper right third molar (wisdom tooth)
- **8** = Upper right central incisor
- **9** = Upper left central incisor
- **16** = Upper left third molar
- **17** = Lower left third molar
- **24** = Lower left central incisor
- **25** = Lower right central incisor
- **32** = Lower right third molar

---

## FDI (Fédération Dentaire Internationale)

**Used in**: Most countries worldwide, ISO standard

**Adult Permanent Teeth**: Two-digit numbers 11-48

### Format:
- **First digit** = Quadrant (1-4)
- **Second digit** = Tooth position (1-8)

### Layout:
```
Quadrant 1 (Upper Right)      Quadrant 2 (Upper Left)
18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28

Quadrant 4 (Lower Right)      Quadrant 3 (Lower Left)
48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
```

### Quadrants:
- **Quadrant 1** (Upper Right): 11-18
- **Quadrant 2** (Upper Left): 21-28
- **Quadrant 3** (Lower Left): 31-38
- **Quadrant 4** (Lower Right): 41-48

### Examples:
- **11** = Upper right central incisor
- **18** = Upper right third molar
- **21** = Upper left central incisor
- **28** = Upper left third molar
- **31** = Lower left central incisor
- **38** = Lower left third molar
- **41** = Lower right central incisor
- **48** = Lower right third molar

---

## Palmer Notation

**Used in**: United Kingdom, some Commonwealth countries

**Adult Permanent Teeth**: Numbers 1-8 with quadrant symbols

### Format:
- **Number** (1-8) = Position from midline
- **Symbol** = Quadrant indicator

### Quadrant Symbols:
```
⎤ = Upper Right (UR)
⎡ = Upper Left (UL)
⎣ = Lower Left (LL)
⎦ = Lower Right (LR)
```

### Layout:
```
8⎤ 7⎤ 6⎤ 5⎤ 4⎤ 3⎤ 2⎤ 1⎤ | ⎡1 ⎡2 ⎡3 ⎡4 ⎡5 ⎡6 ⎡7 ⎡8
Upper Right              Upper Left

8⎦ 7⎦ 6⎦ 5⎦ 4⎦ 3⎦ 2⎦ 1⎦ | ⎣1 ⎣2 ⎣3 ⎣4 ⎣5 ⎣6 ⎣7 ⎣8
Lower Right              Lower Left
```

### Examples:
- **1⎤** = Upper right central incisor
- **8⎤** = Upper right third molar
- **⎡1** = Upper left central incisor
- **⎡8** = Upper left third molar
- **⎣1** = Lower left central incisor
- **⎣8** = Lower left third molar
- **1⎦** = Lower right central incisor
- **8⎦** = Lower right third molar

---

## Conversion Table

| Universal | FDI | Palmer | Tooth Name |
|-----------|-----|--------|------------|
| 1 | 18 | 8⎤ | Upper Right 3rd Molar (Wisdom) |
| 2 | 17 | 7⎤ | Upper Right 2nd Molar |
| 3 | 16 | 6⎤ | Upper Right 1st Molar |
| 4 | 15 | 5⎤ | Upper Right 2nd Premolar |
| 5 | 14 | 4⎤ | Upper Right 1st Premolar |
| 6 | 13 | 3⎤ | Upper Right Canine |
| 7 | 12 | 2⎤ | Upper Right Lateral Incisor |
| 8 | 11 | 1⎤ | Upper Right Central Incisor |
| 9 | 21 | ⎡1 | Upper Left Central Incisor |
| 10 | 22 | ⎡2 | Upper Left Lateral Incisor |
| 11 | 23 | ⎡3 | Upper Left Canine |
| 12 | 24 | ⎡4 | Upper Left 1st Premolar |
| 13 | 25 | ⎡5 | Upper Left 2nd Premolar |
| 14 | 26 | ⎡6 | Upper Left 1st Molar |
| 15 | 27 | ⎡7 | Upper Left 2nd Molar |
| 16 | 28 | ⎡8 | Upper Left 3rd Molar (Wisdom) |
| 17 | 38 | ⎣8 | Lower Left 3rd Molar (Wisdom) |
| 18 | 37 | ⎣7 | Lower Left 2nd Molar |
| 19 | 36 | ⎣6 | Lower Left 1st Molar |
| 20 | 35 | ⎣5 | Lower Left 2nd Premolar |
| 21 | 34 | ⎣4 | Lower Left 1st Premolar |
| 22 | 33 | ⎣3 | Lower Left Canine |
| 23 | 32 | ⎣2 | Lower Left Lateral Incisor |
| 24 | 31 | ⎣1 | Lower Left Central Incisor |
| 25 | 41 | 1⎦ | Lower Right Central Incisor |
| 26 | 42 | 2⎦ | Lower Right Lateral Incisor |
| 27 | 43 | 3⎦ | Lower Right Canine |
| 28 | 44 | 4⎦ | Lower Right 1st Premolar |
| 29 | 45 | 5⎦ | Lower Right 2nd Premolar |
| 30 | 46 | 6⎦ | Lower Right 1st Molar |
| 31 | 47 | 7⎦ | Lower Right 2nd Molar |
| 32 | 48 | 8⎦ | Lower Right 3rd Molar (Wisdom) |

---

## Implementation in Code

The chart stores teeth internally using **Universal numbering (1-32)** and converts to FDI or Palmer only for display.

### Conversion Functions

```typescript
// Convert Universal (1-32) to FDI
function universalToFDI(universal: number): string {
  if (universal >= 1 && universal <= 8) return `1${9 - universal}`
  if (universal >= 9 && universal <= 16) return `2${universal - 8}`
  if (universal >= 17 && universal <= 24) return `3${universal - 16}`
  if (universal >= 25 && universal <= 32) return `4${33 - universal}`
  return String(universal)
}

// Convert Universal (1-32) to Palmer
function universalToPalmer(universal: number): string {
  if (universal >= 1 && universal <= 8) return `${9 - universal}⎤`
  if (universal >= 9 && universal <= 16) return `⎡${universal - 8}`
  if (universal >= 17 && universal <= 24) return `⎣${universal - 16}`
  if (universal >= 25 && universal <= 32) return `${33 - universal}⎦`
  return String(universal)
}
```

---

## Primary (Deciduous) Teeth Numbering

**Note**: The current implementation focuses on adult permanent teeth (32 teeth). Future versions may support primary dentition.

### Universal (Primary)
- **Letters A-T**
- Upper: A-J (right to left)
- Lower: K-T (left to right)

### FDI (Primary)
- **51-85**
- Quadrant 5 (Upper Right): 51-55
- Quadrant 6 (Upper Left): 61-65
- Quadrant 7 (Lower Left): 71-75
- Quadrant 8 (Lower Right): 81-85

### Palmer (Primary)
- **Letters A-E with quadrant symbols**
- Same quadrant symbols as permanent teeth

---

## Surface Notation

Tooth surfaces use standardized abbreviations:

| Code | Name | Location |
|------|------|----------|
| **M** | Mesial | Toward midline |
| **D** | Distal | Away from midline |
| **O** | Occlusal | Chewing surface (posterior) |
| **I** | Incisal | Cutting edge (anterior) |
| **B** | Buccal | Cheek side |
| **L** | Lingual | Tongue side |
| **F** | Facial | Front/lip side (alternative to B) |

**Common combinations**: MOD, DO, MO, MOBL, etc.

---

## References

- American Dental Association (ADA): Universal Numbering System
- Fédération Dentaire Internationale (FDI): World Dental Federation
- Palmer, Corydon (1870): Original Palmer notation system
- ISO 3950:2016: Dentistry — Designation system for teeth and areas of the oral cavity
