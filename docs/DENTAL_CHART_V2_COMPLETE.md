# Dental Chart V2 - Complete Implementation Guide

## Overview

The Dental Chart V2 system is a comprehensive dental charting solution built from the ground up with:

- **FDI Numbering System** (11-48) as the primary standard
- **Surface-level tracking** for detailed condition recording
- **Periodontal charting** with 6-point probing depths
- **Diagnosis management** with ICD-10/ADA codes
- **Treatment planning** with CDT codes and cost estimation
- **Clinical notes** and file attachments
- **Complete audit trail** for all changes

## Architecture

### Database Schema (9 Tables)

1. **dental_charts_v2** - Root chart documents
2. **chart_teeth** - Individual tooth records (32 teeth per chart)
3. **tooth_surfaces** - Surface-level conditions (5 surfaces per tooth)
4. **periodontal_records** - Gum health measurements
5. **chart_diagnoses** - Clinical diagnoses
6. **chart_treatment_plans** - Planned procedures
7. **chart_attachments** - Files, x-rays, photos
8. **chart_clinical_notes** - Progress notes
9. **chart_audit_log** - Complete change history

### API Endpoints

#### Core Endpoints
- `GET /api/v2/patients/[id]/chart` - Fetch complete chart (lazy-initializes if missing)
- `PATCH /api/v2/patients/[id]/chart` - Update chart metadata
- `PATCH /api/v2/patients/[id]/chart/surfaces/[surfaceId]` - Update surface condition

#### Extended Endpoints
- `GET/POST /api/v2/patients/[id]/chart/periodontal` - Periodontal records
- `GET/POST /api/v2/patients/[id]/chart/diagnoses` - Diagnoses
- `GET/POST /api/v2/patients/[id]/chart/treatments` - Treatment plans
- `GET/POST /api/v2/patients/[id]/chart/notes` - Clinical notes

### Frontend Components

1. **DentalChartV2Container** - Main container with tabs
2. **InteractiveChartV2** - SVG chart with FDI layout and realistic tooth shapes
3. **ToothDetailPanelV2** - Surface editing with materials and severity
4. **PeriodontalChartPanel** - 6-point probing interface
5. **DiagnosisManager** - Diagnosis tracking
6. **TreatmentPlanBuilder** - Treatment planning
7. **ClinicalNotesPanel** - Progress notes
8. **AttachmentsPanel** - File uploads

## Key Features

### 1. FDI Numbering System

**FDI Format**: Two-digit notation where:
- First digit = Quadrant (1-4)
- Second digit = Position (1-8)

**Quadrants**:
- Quadrant 1: Upper right (11-18)
- Quadrant 2: Upper left (21-28)
- Quadrant 3: Lower left (31-38)
- Quadrant 4: Lower right (41-48)

**Tooth Types by Position**:
- 1-2: Incisors (have "incisal" surface)
- 3: Canine (has "incisal" surface)
- 4-5: Premolars (have "occlusal" surface)
- 6-8: Molars (have "occlusal" surface)

### 2. Surface-Level Tracking

**5 Surfaces per Tooth**:
- **Mesial**: Toward the midline (front)
- **Distal**: Away from midline (back)
- **Buccal**: Cheek side (facial surface)
- **Lingual**: Tongue side
- **Occlusal/Incisal**: Biting surface

**Condition Types**:
- Healthy (green #4CAF50)
- Decay (red #F44336)
- Restoration (blue #2196F3)
- Crown (purple #9C27B0)
- Fracture (orange #FF9800)
- Wear, Abrasion, Erosion, Stain

**Material Types** (for restorations):
- Amalgam, Composite, Ceramic, Gold, Porcelain, Resin, Glass Ionomer

### 3. Periodontal Charting

**6-Point Probing Depths per Tooth**:
- MB (Mesio-buccal)
- B (Buccal)
- DB (Disto-buccal)
- ML (Mesio-lingual)
- L (Lingual)
- DL (Disto-lingual)

**Health Status**:
- <3mm: Healthy (green)
- 3-5mm: Moderate concern (amber)
- >5mm: Severe periodontitis (red)

**Additional Measurements**:
- Bleeding on probing
- Gingival margin position
- Recession measurement
- Attachment loss calculation
- Plaque index (0-3)
- Calculus presence

### 4. Diagnosis Management

**Features**:
- ICD-10 or ADA diagnosis codes
- Severity tracking (mild, moderate, severe)
- Status tracking (active, resolved, monitoring)
- Link to specific tooth/surface
- Searchable by code or description

**Common Codes**:
- K02.9: Dental caries
- K05.3: Chronic periodontitis
- K05.1: Gingivitis
- S02.5: Fractured tooth

### 5. Treatment Planning

**Features**:
- CDT procedure codes
- Priority levels (urgent, high, medium, low)
- Cost estimation
- Insurance code tracking
- Link to diagnosis
- Status workflow: Planned → In Progress → Completed
- Scheduled and completion dates

**Common Procedure Codes**:
- D2140-D2160: Amalgam restorations
- D2330-D2332: Composite restorations
- D2740: Porcelain/ceramic crown
- D3310-D3330: Root canal therapy
- D7140: Simple extraction
- D4341: Scaling and root planing

### 6. Audit Trail

**All changes are logged**:
- User who made the change
- Timestamp
- Action type
- Entity affected
- Before/after states (JSONB)
- IP address

## Usage Guide

### For Dentists

#### Viewing a Patient's Chart

1. Navigate to patient profile
2. Click on "Treatments & Charts" tab
3. The chart loads automatically (lazy-initialized on first view)

#### Editing Surface Conditions

1. Click on any tooth to select it
2. Detail panel opens on the right
3. For each surface, select:
   - Condition type
   - Material (if restoration/crown)
   - Severity (if decay/fracture)
   - Notes
4. Click "Save Changes"

#### Recording Periodontal Measurements

1. Go to "Periodontal" tab
2. Click "Record New Measurements"
3. Select tooth number
4. Enter probing depths for all 6 sites (mm)
5. Mark bleeding points
6. Save record

#### Adding Diagnoses

1. Go to "Diagnoses" tab
2. Click "Add Diagnosis"
3. Enter diagnosis code (e.g., K02.9)
4. Write description
5. Select severity
6. Link to specific tooth/surface if applicable
7. Save

#### Planning Treatments

1. Go to "Treatments" tab
2. Click "Add Treatment"
3. Enter CDT code (e.g., D2392)
4. Describe procedure
5. Set priority
6. Estimate cost
7. Link to diagnosis (optional)
8. Schedule date
9. Save treatment plan

### For Developers

#### Creating a New Chart

```typescript
// Chart is auto-created on first GET request
const response = await fetch(`/api/v2/patients/${patientId}/chart`)
const chart = await response.json()
// Returns fully initialized chart with 32 teeth and 160 surfaces
```

#### Updating a Surface

```typescript
await fetch(`/api/v2/patients/${patientId}/chart/surfaces/${surfaceId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    condition_type: 'restoration',
    material_type: 'composite',
    color_code: '#2196F3',
    severity: null,
    notes: 'Class II composite restoration, occlusal-mesial'
  })
})
```

#### Adding Periodontal Record

```typescript
await fetch(`/api/v2/patients/${patientId}/chart/periodontal`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tooth_number: '16',
    probing_depths_mm: { mb: 2, b: 3, db: 2, ml: 2, l: 2, dl: 3 },
    bleeding_points: ['b', 'dl'],
    gingival_margin_mm: { mb: 0, b: 0, db: 0, ml: 0, l: 0, dl: 0 },
    recession_mm: 0,
    calculus_present: false
  })
})
```

## Utility Functions

### FDI Numbering
```typescript
import { 
  fdiToUniversal, 
  universalToFDI, 
  getToothType, 
  getArch,
  getToothDisplayName 
} from '@/lib/utils/fdi-numbering'

getToothType('16') // 'molar'
getArch('16') // 'upper'
getToothDisplayName('16') // 'Upper Right First Molar'
```

### Colors
```typescript
import { getConditionColor, CONDITION_COLORS } from '@/lib/utils/dental-colors'

getConditionColor('decay') // '#F44336'
```

### Periodontal Calculations
```typescript
import { 
  calculatePocketDepthAverage,
  getPocketHealthStatus,
  getPeriodontalDiagnosis
} from '@/lib/utils/periodontal-calculations'

const avg = calculatePocketDepthAverage(probingDepths)
const status = getPocketHealthStatus(5) // 'moderate'
```

## Migration from V1

The V2 system coexists with the old `dental_charts` table. No migration needed - fresh start.

To access old charts (if needed):
```sql
SELECT * FROM dental_charts WHERE patient_id = 'xxx'
```

New charts:
```sql
SELECT * FROM dental_charts_v2 WHERE patient_id = 'xxx'
```

## Security & RLS

All tables have Row Level Security (RLS) enabled:
- Users can only access charts from their clinic
- Enforced at database level via `practice_id` check
- Automatic through `user_profiles.clinic_id` lookup

## Performance Optimizations

1. **Lazy Initialization**: Charts created on first access
2. **Nested Queries**: Database function `get_chart_with_full_details()` returns everything in one call
3. **Indexes**: All foreign keys and frequently queried columns indexed
4. **Versioning**: Incremental version numbers avoid full chart locks

## Testing

### Database Migration
```bash
# Run migration
psql -h your-db-host -d your-db-name -f supabase/migrations/20260217000003_dental_charts_v2.sql

# Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'chart_%';
```

### API Testing
```bash
# Get chart
curl http://localhost:3000/api/v2/patients/{patient-id}/chart

# Update surface
curl -X PATCH http://localhost:3000/api/v2/patients/{patient-id}/chart/surfaces/{surface-id} \
  -H "Content-Type: application/json" \
  -d '{"condition_type": "decay", "severity": "moderate"}'
```

## Troubleshooting

### Chart not loading
- Check browser console for API errors
- Verify patient exists and belongs to user's clinic
- Check RLS policies in Supabase

### Surface updates not saving
- Confirm surface_id is valid
- Check user has write permission to clinic
- Verify request body matches schema

### Periodontal records not appearing
- Ensure `chart_id` is correct
- Check tooth_number format (FDI)
- Verify probing depths are valid (0-12mm)

## Future Enhancements

Potential additions:
- [ ] Tooth images/x-ray overlays
- [ ] Charting templates for common conditions
- [ ] Print/export to PDF
- [ ] Historical comparison views
- [ ] Treatment outcome tracking
- [ ] Insurance claim integration
- [ ] Multi-provider annotations
- [ ] Mobile-optimized charting

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint comments in code
3. Inspect browser console for errors
4. Check database logs in Supabase dashboard

---

**Version**: 2.0.0  
**Last Updated**: February 17, 2026  
**Database Schema Version**: 20260217000003
