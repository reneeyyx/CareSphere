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

// GET all patients
app.get('/api/patients', async (req, res) => {
  try {
    const data = await fs.readFile(PATIENTS_FILE, 'utf-8')
    const patientsData = JSON.parse(data)
    res.json(patientsData.patients)
  } catch (error) {
    console.error('Error reading patients:', error)
    res.status(500).json({ error: 'Failed to read patients data' })
  }
})

// GET single patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const data = await fs.readFile(PATIENTS_FILE, 'utf-8')
    const patientsData = JSON.parse(data)
    const patient = patientsData.patients.find(p => p.id === req.params.id)
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
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
