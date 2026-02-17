// API Test Script for Dental Chart Endpoints
// This documents how to test the dental chart API

/**
 * Test Plan for Dental Chart API
 * 
 * Prerequisites:
 * 1. Have a valid auth token
 * 2. Have a patient ID that belongs to your clinic
 * 3. Server running on localhost:3000 (or adjust BASE_URL)
 */

const BASE_URL = 'http://localhost:3000'
const PATIENT_ID = 'YOUR_PATIENT_ID_HERE' // Replace with actual patient ID

/**
 * Test 1: GET /api/patients/[id]/chart
 * Expected: Returns existing chart or creates new one with 32 default teeth
 */
async function testGetChart() {
  console.log('\n🧪 Test 1: GET Chart')
  
  try {
    const response = await fetch(`${BASE_URL}/api/patients/${PATIENT_ID}/chart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth header here if needed
      }
    })
    
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    // Assertions
    if (response.status === 200) {
      console.log('✓ Chart retrieved successfully')
      
      if (data.teeth && data.teeth.length === 32) {
        console.log('✓ Chart has 32 teeth')
      } else {
        console.log('✗ Chart should have 32 teeth, found:', data.teeth?.length)
      }
      
      if (data.numbering_system) {
        console.log('✓ Numbering system:', data.numbering_system)
      }
      
      if (data.version) {
        console.log('✓ Version:', data.version)
      }
    } else {
      console.log('✗ Failed to get chart:', data.error)
    }
    
    return data
  } catch (error) {
    console.error('✗ Error:', error.message)
    return null
  }
}

/**
 * Test 2: PATCH /api/patients/[id]/chart
 * Expected: Updates chart and increments version
 */
async function testUpdateChart(existingChart) {
  console.log('\n🧪 Test 2: PATCH Chart (Update tooth status)')
  
  if (!existingChart) {
    console.log('⊘ Skipping - no existing chart')
    return
  }
  
  try {
    // Modify first tooth to "problem"
    const updatedTeeth = [...existingChart.teeth]
    updatedTeeth[0] = {
      ...updatedTeeth[0],
      status: 'problem',
      notes: 'Test note from API test'
    }
    
    const response = await fetch(`${BASE_URL}/api/patients/${PATIENT_ID}/chart`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teeth: updatedTeeth,
        audit_action: 'test_update',
        audit_entity_type: 'tooth',
        audit_entity_id: '1'
      })
    })
    
    const data = await response.json()
    
    console.log('Status:', response.status)
    
    if (response.status === 200) {
      console.log('✓ Chart updated successfully')
      
      if (data.version > existingChart.version) {
        console.log('✓ Version incremented:', existingChart.version, '→', data.version)
      } else {
        console.log('✗ Version should increment')
      }
      
      if (data.teeth[0].status === 'problem') {
        console.log('✓ Tooth status updated correctly')
      } else {
        console.log('✗ Tooth status not updated')
      }
      
      if (data.audit_log && data.audit_log.length > existingChart.audit_log?.length) {
        console.log('✓ Audit log updated')
      }
    } else {
      console.log('✗ Failed to update chart:', data.error)
    }
    
    return data
  } catch (error) {
    console.error('✗ Error:', error.message)
    return null
  }
}

/**
 * Test 3: PATCH Chart - Lock/Unlock
 */
async function testChartLocking() {
  console.log('\n🧪 Test 3: Lock/Unlock Chart')
  
  try {
    // Lock the chart
    const lockResponse = await fetch(`${BASE_URL}/api/patients/${PATIENT_ID}/chart`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_locked: true,
        audit_action: 'chart_locked'
      })
    })
    
    const lockedData = await lockResponse.json()
    
    if (lockResponse.status === 200 && lockedData.is_locked) {
      console.log('✓ Chart locked successfully')
    } else {
      console.log('✗ Failed to lock chart')
    }
    
    // Try to unlock
    const unlockResponse = await fetch(`${BASE_URL}/api/patients/${PATIENT_ID}/chart`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_locked: false,
        audit_action: 'chart_unlocked'
      })
    })
    
    const unlockedData = await unlockResponse.json()
    
    if (unlockResponse.status === 200 && !unlockedData.is_locked) {
      console.log('✓ Chart unlocked successfully')
    } else {
      console.log('✗ Failed to unlock chart')
    }
    
    return unlockedData
  } catch (error) {
    console.error('✗ Error:', error.message)
    return null
  }
}

/**
 * Test 4: Update Tooth Surfaces
 */
async function testSurfaceUpdate(existingChart) {
  console.log('\n🧪 Test 4: Update Tooth Surfaces')
  
  if (!existingChart) {
    console.log('⊘ Skipping - no existing chart')
    return
  }
  
  try {
    const updatedTeeth = [...existingChart.teeth]
    
    // Update surfaces on tooth #1
    updatedTeeth[0] = {
      ...updatedTeeth[0],
      surfaces: [
        { surface_code: 'M', status: 'filled' },
        { surface_code: 'D', status: 'decay' },
        { surface_code: 'O', status: 'healthy' },
        { surface_code: 'I', status: 'healthy' },
        { surface_code: 'B', status: 'healthy' },
        { surface_code: 'L', status: 'healthy' }
      ]
    }
    
    const response = await fetch(`${BASE_URL}/api/patients/${PATIENT_ID}/chart`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teeth: updatedTeeth,
        audit_action: 'surfaces_updated',
        audit_entity_type: 'tooth',
        audit_entity_id: '1'
      })
    })
    
    const data = await response.json()
    
    if (response.status === 200) {
      console.log('✓ Surfaces updated successfully')
      
      const tooth = data.teeth[0]
      const messialSurface = tooth.surfaces.find(s => s.surface_code === 'M')
      
      if (messialSurface?.status === 'filled') {
        console.log('✓ Mesial surface status correct')
      } else {
        console.log('✗ Surface status not saved correctly')
      }
    } else {
      console.log('✗ Failed to update surfaces:', data.error)
    }
    
    return data
  } catch (error) {
    console.error('✗ Error:', error.message)
    return null
  }
}

/**
 * Test 5: Add Diagnosis
 */
async function testAddDiagnosis(existingChart) {
  console.log('\n🧪 Test 5: Add Tooth Diagnosis')
  
  if (!existingChart) {
    console.log('⊘ Skipping - no existing chart')
    return
  }
  
  try {
    const updatedTeeth = [...existingChart.teeth]
    
    // Add diagnosis to tooth #1
    updatedTeeth[0] = {
      ...updatedTeeth[0],
      diagnoses: [
        {
          diagnosis_code: 'K02.51',
          description: 'Dental caries on pit and fissure surface',
          severity: 'moderate',
          created_at: new Date().toISOString()
        }
      ]
    }
    
    const response = await fetch(`${BASE_URL}/api/patients/${PATIENT_ID}/chart`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teeth: updatedTeeth,
        audit_action: 'diagnosis_added',
        audit_entity_type: 'diagnosis'
      })
    })
    
    const data = await response.json()
    
    if (response.status === 200) {
      console.log('✓ Diagnosis added successfully')
      
      const tooth = data.teeth[0]
      if (tooth.diagnoses && tooth.diagnoses.length > 0) {
        console.log('✓ Diagnosis saved:', tooth.diagnoses[0].diagnosis_code)
      } else {
        console.log('✗ Diagnosis not saved')
      }
    } else {
      console.log('✗ Failed to add diagnosis:', data.error)
    }
    
    return data
  } catch (error) {
    console.error('✗ Error:', error.message)
    return null
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('==================================')
  console.log('  DENTAL CHART API TEST SUITE')
  console.log('==================================')
  console.log('Patient ID:', PATIENT_ID)
  console.log('Base URL:', BASE_URL)
  
  // Test 1: Get or create chart
  let chart = await testGetChart()
  
  if (!chart) {
    console.log('\n❌ Cannot proceed - failed to get chart')
    return
  }
  
  // Test 2: Update chart
  chart = await testUpdateChart(chart)
  
  // Test 3: Lock/unlock
  chart = await testChartLocking()
  
  // Test 4: Update surfaces
  chart = await testSurfaceUpdate(chart)
  
  // Test 5: Add diagnosis
  chart = await testAddDiagnosis(chart)
  
  console.log('\n==================================')
  console.log('  TEST SUITE COMPLETE')
  console.log('==================================')
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testGetChart,
    testUpdateChart,
    testChartLocking,
    testSurfaceUpdate,
    testAddDiagnosis,
    runAllTests
  }
}

// Instructions for running these tests:
console.log(`
To run these tests:

1. In Browser Console:
   - Navigate to your app
   - Open DevTools Console
   - Copy/paste this entire file
   - Update PATIENT_ID with a real patient ID
   - Run: runAllTests()

2. In Node.js (with fetch polyfill):
   - npm install node-fetch
   - Add: const fetch = require('node-fetch')
   - Update PATIENT_ID
   - Run: node api-test.js

3. In Postman/Insomnia:
   - Import the requests manually
   - Set auth headers
   - Run each test sequentially
`)
