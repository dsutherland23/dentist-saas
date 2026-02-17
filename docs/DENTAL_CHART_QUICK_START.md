# Dental Chart Quick Start Guide

## For Developers

### 1. Apply the Migration

Run the migration to create the `dental_charts` table:

```bash
npm run db:migrate
```

Or manually apply the migration file in Supabase SQL Editor:
- File: `supabase/migrations/20260223000001_dental_charts.sql`

### 2. Verify the Migration

Run the verification script in Supabase SQL Editor:
- File: `scripts/verify-dental-charts.sql`

This will check:
- Table exists
- All columns are present
- Constraints are set up correctly
- RLS policies are active
- Indexes are created

### 3. Test the Feature

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to a patient profile:
   ```
   http://localhost:3000/patients/[patient-id]
   ```

3. Scroll down to the "Dental Chart" section (appears after Medical Images)

4. The chart will auto-create on first load with 32 healthy teeth

### 4. Code Structure

```
lib/types/
  dental-chart.ts               # TypeScript types and helpers

app/api/patients/[id]/chart/
  route.ts                       # GET and PATCH endpoints

components/dental-chart/
  interactive-dental-chart.tsx   # Main chart component with SVG map
  tooth-detail-panel.tsx         # Side panel for editing tooth details

supabase/migrations/
  20260223000001_dental_charts.sql  # Database schema

docs/
  DENTAL_NUMBERING_SYSTEMS.md    # Reference guide for numbering systems

DENTAL_CHART_IMPLEMENTATION.md   # Full implementation documentation
```

---

## For Users (Dentists/Hygienists/Staff)

### Accessing a Patient's Dental Chart

1. **Open a patient profile**
   - Click "Patients" in the sidebar
   - Select a patient from the list
   - Scroll to "Dental Chart" section

2. **First-time setup**
   - The chart automatically creates with 32 healthy teeth
   - No manual setup required

### Using the Dental Chart

#### Viewing the Chart

- **Upper arch**: Teeth 1-16 (right to left)
- **Lower arch**: Teeth 17-32 (left to right)
- **Color coding**:
  - 🟢 Green = Healthy
  - 🔵 Blue = Treated
  - 🔴 Red = Problem
  - 🟡 Yellow = Planned treatment
  - ⚪ Gray = Missing/Extracted
  - 🟠 Orange = Impacted
  - 🟣 Purple = Implant

#### Changing Numbering System

Click the dropdown at the top right to switch between:
- **Universal** (1-32) - Used in USA
- **FDI** (11-48) - International standard
- **Palmer** (1⎤-8⎤, etc.) - Used in UK

The chart updates immediately.

#### Editing a Tooth

1. **Click any tooth** in the diagram
2. The detail panel opens on the right
3. Edit the following:
   - **Status**: Current condition (healthy, problem, etc.)
   - **Notes**: Clinical observations
   - **Surfaces**: Status for each surface (M, D, O, I, B, L, F)
   - **Diagnoses**: Add diagnosis codes with severity

4. **Click "Save Changes"** when done

#### Adding a Diagnosis

1. Select a tooth
2. In the detail panel, click **"+ Add"** under Diagnoses
3. Fill in:
   - Diagnosis code (e.g., "K02.51")
   - Description (e.g., "Dental caries on pit and fissure surface")
   - Severity: Mild, Moderate, or Severe
4. Click **"Save Changes"**

#### Updating Surface Status

1. Select a tooth
2. In the "Surfaces" section, change status for any surface:
   - **M** (Mesial) - Side toward midline
   - **D** (Distal) - Side away from midline  
   - **O** (Occlusal) - Chewing surface
   - **I** (Incisal) - Cutting edge
   - **B** (Buccal) - Cheek side
   - **L** (Lingual) - Tongue side
   - **F** (Facial) - Front/lip side
3. Click **"Save Changes"**

#### Locking the Chart

To prevent other users from editing while you work:

1. Click **"Lock"** button at top right
2. Chart becomes locked to your user account
3. Other users will see "Locked by [Your Name]" and cannot edit
4. Click **"Unlock"** when finished

**Note**: Only lock when actively working. Unlock when done to allow others to edit.

### Chart Version History

- Every save increments the version number
- Version badge shows current version (e.g., "Version 3")
- All changes are logged in the audit trail (not visible in UI yet)

---

## Common Workflows

### Recording a Routine Exam

1. Open patient's dental chart
2. Click **"Lock"** to prevent interruptions
3. For each tooth:
   - Click the tooth
   - Update status if changed
   - Add notes if needed
   - Update surface conditions
   - Add any new diagnoses
   - Click "Save Changes"
4. Click **"Unlock"** when finished

### Marking Treatment as Complete

1. Find the tooth that was treated
2. Click the tooth
3. Change status from "problem" or "planned" to "treated"
4. Update affected surfaces (e.g., "O" from "decay" to "filled")
5. Add notes about the procedure
6. Click "Save Changes"

### Planning Treatment

1. Click tooth requiring treatment
2. Set status to "planned"
3. Add diagnosis with treatment code
4. Add notes describing planned procedure
5. Click "Save Changes"

### Recording a Missing Tooth

1. Click the missing tooth
2. Change status to "missing" or "extracted"
3. Add notes with date and reason (if known)
4. Click "Save Changes"

---

## Troubleshooting

### Chart won't load
- Check internet connection
- Refresh the page
- Verify patient exists and you have access

### Can't edit chart
- Check if someone else has it locked
- Verify you have permission (dentist, hygienist, or admin role)
- Try refreshing the page

### Changes not saving
- Check for error messages
- Verify internet connection
- Make sure you clicked "Save Changes"
- Check if chart is locked by another user

### Numbering looks wrong
- Check the numbering system dropdown (Universal/FDI/Palmer)
- Switch to the system you're familiar with

---

## Tips & Best Practices

1. **Lock before editing**: Prevent conflicts with other users
2. **Save frequently**: Changes only persist when you click Save
3. **Use consistent numbering**: Pick one system and stick with it
4. **Add detailed notes**: Future you (or colleagues) will thank you
5. **Record severity**: Always set severity for diagnoses
6. **Update surfaces**: Be specific about which surfaces are affected
7. **Unlock when done**: Don't leave charts locked indefinitely

---

## Keyboard Shortcuts (Coming Soon)

Future versions may include:
- Arrow keys to navigate teeth
- Tab to move between fields
- Ctrl+S to save
- Esc to close detail panel

---

## Support

For technical issues or feature requests, contact your system administrator or development team.

For clinical questions about charting standards, consult your practice's clinical director or quality assurance manager.
