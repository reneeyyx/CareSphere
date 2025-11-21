import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Path to the patients data file
const PATIENTS_FILE = path.join(__dirname, 'data', 'patients.json')

// FastAPI service URL
const FASTAPI_URL = 'http://localhost:8001'

// Designated Arduino patient ID
const ARDUINO_PATIENT_ID = 'P001' // The patient getting real-time monitoring

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(PATIENTS_FILE)
  } catch {
    // Copy from frontend if exists, otherwise create empty
    const defaultData = {
      patients: []
    }
    await fs.writeFile(PATIENTS_FILE, JSON.stringify(defaultData, null, 2))
  }
}

// GET all patients (with live Arduino data for designated patient)
app.get('/api/patients', async (req, res) => {
  try {
    const data = await fs.readFile(PATIENTS_FILE, 'utf-8')
    const patientsData = JSON.parse(data)
    let patients = patientsData.patients
    
    // Try to update the Arduino patient with live prediction
    try {
      const arduinoPatient = patients.find(p => p.id === ARDUINO_PATIENT_ID)
      if (arduinoPatient) {
        const response = await fetch(`${FASTAPI_URL}/predict-delirium/from-arduino?age=${arduinoPatient.age}`)
        if (response.ok) {
          const prediction = await response.json()
          
          // Update patient with live data
          const patientIndex = patients.findIndex(p => p.id === ARDUINO_PATIENT_ID)
          patients[patientIndex] = {
            ...arduinoPatient,
            riskScore: Math.round(prediction.risk_score * 100),
            riskLevel: prediction.risk_level.toLowerCase(),
            riskFactors: prediction.top_features,
            isLiveMonitored: true,
            lastPrediction: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.log('FastAPI not available, using static data')
    }
    
    res.json(patients)
  } catch (error) {
    console.error('Error reading patients:', error)
    res.status(500).json({ error: 'Failed to read patients data' })
  }
})

// GET single patient (with live Arduino data if applicable)
app.get('/api/patients/:id', async (req, res) => {
  try {
    const data = await fs.readFile(PATIENTS_FILE, 'utf-8')
    const patientsData = JSON.parse(data)
    let patient = patientsData.patients.find(p => p.id === req.params.id)
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    
    // If this is the Arduino patient, get live prediction
    if (req.params.id === ARDUINO_PATIENT_ID) {
      try {
        const response = await fetch(`${FASTAPI_URL}/predict-delirium/from-arduino?age=${patient.age}`)
        if (response.ok) {
          const prediction = await response.json()
          
          patient = {
            ...patient,
            riskScore: Math.round(prediction.risk_score * 100),
            riskLevel: prediction.risk_level.toLowerCase(),
            riskFactors: prediction.top_features,
            isLiveMonitored: true,
            lastPrediction: new Date().toISOString()
          }
        }
      } catch (error) {
        console.log('FastAPI not available for patient:', error.message)
      }
    }
    
    res.json(patient)
  } catch (error) {
    console.error('Error reading patient:', error)
    res.status(500).json({ error: 'Failed to read patient data' })
  }
})

// PUT update patient (for check-ins)
app.put('/api/patients/:id', async (req, res) => {
  try {
    const data = await fs.readFile(PATIENTS_FILE, 'utf-8')
    const patientsData = JSON.parse(data)
    
    const patientIndex = patientsData.patients.findIndex(p => p.id === req.params.id)
    
    if (patientIndex === -1) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    
    // Update patient data
    patientsData.patients[patientIndex] = {
      ...patientsData.patients[patientIndex],
      ...req.body
    }
    
    // Write back to file
    await fs.writeFile(PATIENTS_FILE, JSON.stringify(patientsData, null, 2))
    
    res.json(patientsData.patients[patientIndex])
  } catch (error) {
    console.error('Error updating patient:', error)
    res.status(500).json({ error: 'Failed to update patient data' })
  }
})

// POST check-in for a patient
app.post('/api/patients/:id/checkin', async (req, res) => {
  try {
    const data = await fs.readFile(PATIENTS_FILE, 'utf-8')
    const patientsData = JSON.parse(data)
    
    const patientIndex = patientsData.patients.findIndex(p => p.id === req.params.id)
    
    if (patientIndex === -1) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
    const dateString = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
    
    // Update patient check-in time
    patientsData.patients[patientIndex].lastCheck = `${dateString} at ${timeString}`
    patientsData.patients[patientIndex].lastCheckTimestamp = now.getTime()
    
    // Write back to file
    await fs.writeFile(PATIENTS_FILE, JSON.stringify(patientsData, null, 2))
    
    res.json(patientsData.patients[patientIndex])
  } catch (error) {
    console.error('Error checking in patient:', error)
    res.status(500).json({ error: 'Failed to check in patient' })
  }
})

// GET live sensor data for Arduino patient
app.get('/api/patients/:id/sensor-data', async (req, res) => {
  if (req.params.id !== ARDUINO_PATIENT_ID) {
    return res.status(400).json({ error: 'Sensor data only available for live monitored patient' })
  }
  
  try {
    const response = await fetch(`${FASTAPI_URL}/sensor-data/latest`)
    if (!response.ok) {
      throw new Error('Sensor data not available')
    }
    const sensorData = await response.json()
    res.json(sensorData)
  } catch (error) {
    res.status(503).json({ error: 'Sensor data unavailable', message: error.message })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
async function startServer() {
  await ensureDataDir()
  await initializeDataFile()
  
  app.listen(PORT, () => {
    console.log(`CareSphere Backend API running on http://localhost:${PORT}`)
    console.log(`Data file: ${PATIENTS_FILE}`)
  })
}

startServer().catch(console.error)
