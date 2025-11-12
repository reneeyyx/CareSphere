import express from 'express';
import cors from 'cors';
import { SerialPort } from 'serialport';

const PORT = 4002; // Backend API port
const ARDUINO_PORT = 'COM10'; // Change as needed
const BAUD = 9600;

const app = express();
app.use(cors());

app.get('/api/temperature', async (req, res) => {
  const port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD, autoOpen: false });
  port.open((err) => {
    if (err) {
      res.status(500).json({ error: `Failed to open port: ${err.message}` });
      return;
    }
      setTimeout(() => {
      let buffer = Buffer.alloc(0);
      const onData = (data) => {
        buffer = Buffer.concat([buffer, data]);
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex).toString().trim();
          port.off('data', onData);
          port.close();
          if (!line) {
            res.status(500).json({ error: 'No data received from Arduino (timeout).' });
            return;
          }
          const value = Number(line);
          if (isNaN(value)) {
            res.status(500).json({ error: `Could not parse temperature from line: ${line}` });
          } else {
            res.json({ temperature: value });
          }
        }
      };
      port.on('data', onData);
      }, 12000); // 12 seconds
  });
});

app.listen(PORT, () => {
  console.log(`Temperature API server running on http://localhost:${PORT}`);
});
