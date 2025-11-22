/**
 * Arduino Sensor API Server
 * 
 * This server:
 * 1. Reads real-time sensor data from Arduino via serial port (COM7)
 * 2. Parses JSON sensor readings: {light, sound, temperature, timestamp}
 * 3. Stores latest reading and maintains history (max 100 entries)
 * 4. Exposes REST API for other services to consume sensor data
 * 
 * API Endpoints:
 * - GET /api/sensors/latest - Returns most recent sensor reading
 * - GET /api/sensors/stats - Returns aggregated statistics (mean, min, max)
 */

import express from 'express';
import cors from 'cors';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const PORT = 4002; // API server port
const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM7'; // Default Arduino COM port
const BAUD = 9600; // Serial communication baud rate

const app = express();
app.use(cors()); // Enable CORS for cross-origin requests from frontend/backend

// In-memory storage for sensor data
let latestSensorData = {
  light: null,        // Photoresistor reading (0-1023 analog value)
  sound: null,        // Microphone reading (0-1023 analog value)
  temperature: null,  // TMP36 temperature in Celsius
  heart_rate: null,   // Removed from hardware but kept for compatibility
  timestamp: null     // Arduino millis() timestamp
};

// Rolling history buffer for statistical calculations
let sensorHistory = [];
const MAX_HISTORY = 100; // Keep last 100 readings for averaging

// Serial port connection objects
let serialPort;
let parser;

/**
 * Auto-detect Arduino COM port by scanning available serial ports
 * Looks for Arduino, FTDI, or matches ARDUINO_PORT environment variable
 */
async function findArduinoPort() {
  const { SerialPort: SP } = await import('serialport');
  const ports = await SP.list();
  
  console.log('Available ports:');
  ports.forEach(port => {
    console.log(`  ${port.path} - ${port.manufacturer || 'Unknown'}`);
  });
  
  // Try to find Arduino by manufacturer or use default port
  const arduinoPort = ports.find(port => 
    port.manufacturer?.includes('Arduino') ||
    port.manufacturer?.includes('FTDI') ||
    port.path === ARDUINO_PORT
  );
  
  return arduinoPort?.path || ARDUINO_PORT;
}

/**
 * Initialize serial port connection to Arduino
 * Sets up readline parser to handle JSON data from Arduino
 */
async function initializeSerialPort() {
  try {
    const portPath = await findArduinoPort();
    console.log(`Attempting to connect to: ${portPath}`);
    
    serialPort = new SerialPort({ path: portPath, baudRate: BAUD });
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    // Parse incoming JSON data from Arduino
    parser.on('data', (line) => {
      try {
        const data = JSON.parse(line);
        latestSensorData = {
          light: data.light,
          sound: data.sound,
          temperature: data.temperature,
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
      console.log('💡 Tip: Make sure Arduino is connected and check the COM port');
      console.log('💡 Available COM ports listed above');
    });
    
    console.log(`✓ Connected to Arduino on ${portPath}`);
  } catch (err) {
    console.error(`Failed to connect to Arduino: ${err.message}`);
    console.log('⚠️  Sensor API will run without real sensor data');
    console.log('💡 To fix: Connect Arduino and restart with: node sensors.js');
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
