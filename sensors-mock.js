import express from 'express';
import cors from 'cors';

const PORT = 4002;
const app = express();
app.use(cors());

// Mock sensor data storage
let latestSensorData = {
  light: 650,
  sound: 450,
  temperature: 26.5,
  heart_rate: 78,
  timestamp: Date.now()
};

let sensorHistory = [];
const MAX_HISTORY = 100;

// Function to generate realistic varying sensor data
function generateMockSensorData() {
  // Simulate realistic variations
  const baseLight = 600 + Math.random() * 200; // 600-800 (higher = quieter/darker hospital)
  const baseSound = 400 + Math.random() * 300; // 400-700 (higher = louder)
  const baseTemp = 25 + Math.random() * 4; // 25-29°C
  const baseHR = 70 + Math.random() * 30; // 70-100 bpm
  
  latestSensorData = {
    light: Math.round(baseLight),
    sound: Math.round(baseSound),
    temperature: Math.round(baseTemp * 100) / 100,
    heart_rate: Math.round(baseHR * 10) / 10,
    timestamp: Date.now()
  };
  
  // Add to history
  sensorHistory.push({ ...latestSensorData, received_at: Date.now() });
  if (sensorHistory.length > MAX_HISTORY) {
    sensorHistory.shift();
  }
  
  console.log('Mock sensor reading:', latestSensorData);
}

// Generate initial data
generateMockSensorData();

// Update sensor data every 5 seconds
setInterval(generateMockSensorData, 5000);

// API Endpoints
app.get('/api/sensors/latest', (req, res) => {
  if (!latestSensorData.timestamp) {
    return res.status(404).json({ error: 'No sensor data available yet' });
  }
  res.json(latestSensorData);
});

app.get('/api/sensors/history', (req, res) => {
  res.json({ 
    count: sensorHistory.length, 
    data: sensorHistory 
  });
});

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

app.get('/api/temperature', (req, res) => {
  if (!latestSensorData.temperature) {
    return res.status(404).json({ error: 'No temperature data available' });
  }
  res.json({ temperature: latestSensorData.temperature });
});

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

app.listen(PORT, () => {
  console.log(`🎭 MOCK Sensor API server running on http://localhost:${PORT}`);
  console.log(`Generating simulated sensor data every 5 seconds...`);
  console.log(`This will allow testing without Arduino connected.`);
  console.log(`To use real Arduino: connect to COM port and run sensors.js instead`);
});
