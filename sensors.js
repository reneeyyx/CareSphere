import express from 'express';
import cors from 'cors';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const PORT = 4002; // Backend API port
const ARDUINO_PORT = 'COM10'; // Change as needed
const BAUD = 9600;

const app = express();
app.use(cors());

// Store latest sensor readings
let latestSensorData = {
  light: null,
  sound: null,
  temperature: null,
  heart_rate: null,
  timestamp: null
};

let sensorHistory = [];
const MAX_HISTORY = 100;

// Initialize serial port connection
let serialPort;
let parser;

function initializeSerialPort() {
  try {
    serialPort = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD });
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    parser.on('data', (line) => {
      try {
        const data = JSON.parse(line);
        latestSensorData = {
          light: data.light,
          sound: data.sound,
          temperature: data.temperature,
          heart_rate: data.heart_rate,
          timestamp: data.timestamp || Date.now()
        };
        
        // Add to history
        sensorHistory.push({ ...latestSensorData, received_at: Date.now() });
        if (sensorHistory.length > MAX_HISTORY) {
          sensorHistory.shift();
        }
        
        console.log('Received sensor data:', latestSensorData);
      } catch (err) {
        console.error('Error parsing sensor data:', err.message);
      }
    });
    
    serialPort.on('error', (err) => {
      console.error('Serial port error:', err.message);
    });
    
    console.log(`Connected to Arduino on ${ARDUINO_PORT}`);
  } catch (err) {
    console.error(`Failed to connect to Arduino: ${err.message}`);
  }
}

// Initialize on startup
initializeSerialPort();

// API Endpoints

// Get latest sensor reading
app.get('/api/sensors/latest', (req, res) => {
  if (!latestSensorData.timestamp) {
    return res.status(404).json({ error: 'No sensor data available yet' });
  }
  res.json(latestSensorData);
});

// Get all sensor history
app.get('/api/sensors/history', (req, res) => {
  res.json({ 
    count: sensorHistory.length, 
    data: sensorHistory 
  });
});

// Get aggregated statistics
app.get('/api/sensors/stats', (req, res) => {
  if (sensorHistory.length === 0) {
    return res.status(404).json({ error: 'No sensor data available' });
  }
  
  const stats = {
    light_mean: average(sensorHistory.map(s => s.light)),
    sound_mean: average(sensorHistory.map(s => s.sound)),
    temp_mean: average(sensorHistory.map(s => s.temperature)),
    hr_mean: average(sensorHistory.map(s => s.heart_rate)),
    sample_count: sensorHistory.length,
    time_range: {
      first: sensorHistory[0].received_at,
      last: sensorHistory[sensorHistory.length - 1].received_at
    }
  };
  
  res.json(stats);
});

// Legacy temperature endpoint (for backward compatibility)
app.get('/api/temperature', (req, res) => {
  if (!latestSensorData.temperature) {
    return res.status(404).json({ error: 'No temperature data available' });
  }
  res.json({ temperature: latestSensorData.temperature });
});

// Helper function
function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

app.listen(PORT, () => {
  console.log(`Sensor API server running on http://localhost:${PORT}`);
});
