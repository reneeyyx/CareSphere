"""
Arduino Serial Reader Service
Reads sensor data from Arduino via serial port and stores it for the FastAPI service
"""
import serial
import json
import time
from collections import deque
from threading import Thread, Lock
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ArduinoDataStore:
    """Thread-safe storage for Arduino sensor data"""
    
    def __init__(self, max_samples=100):
        self.data_lock = Lock()
        self.samples = deque(maxlen=max_samples)
        self.latest = None
        
    def add_sample(self, sample):
        with self.data_lock:
            self.samples.append(sample)
            self.latest = sample
            
    def get_latest(self):
        with self.data_lock:
            return self.latest
            
    def get_aggregated_stats(self, minutes=5):
        """Get aggregated statistics for the last N minutes"""
        with self.data_lock:
            if not self.samples:
                return None
                
            # Calculate means
            light_values = [s['light'] for s in self.samples]
            sound_values = [s['sound'] for s in self.samples]
            temp_values = [s['temperature'] for s in self.samples]
            hr_values = [s['heart_rate'] for s in self.samples]
            
            return {
                'light_mean': sum(light_values) / len(light_values),
                'sound_mean': sum(sound_values) / len(sound_values),
                'temp_mean': sum(temp_values) / len(temp_values),
                'hr_mean': sum(hr_values) / len(hr_values),
                'sample_count': len(self.samples)
            }


class ArduinoReader:
    """Read sensor data from Arduino serial port"""
    
    def __init__(self, port='COM10', baudrate=9600, data_store=None):
        self.port = port
        self.baudrate = baudrate
        self.data_store = data_store or ArduinoDataStore()
        self.serial_conn = None
        self.running = False
        self.thread = None
        
    def start(self):
        """Start reading from Arduino in background thread"""
        if self.running:
            logger.warning("Arduino reader already running")
            return
            
        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
            time.sleep(2)  # Wait for Arduino to reset
            self.running = True
            self.thread = Thread(target=self._read_loop, daemon=True)
            self.thread.start()
            logger.info(f"Arduino reader started on {self.port}")
        except serial.SerialException as e:
            logger.error(f"Failed to open serial port {self.port}: {e}")
            raise
            
    def stop(self):
        """Stop reading from Arduino"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
        logger.info("Arduino reader stopped")
        
    def _read_loop(self):
        """Main reading loop (runs in background thread)"""
        while self.running:
            try:
                if self.serial_conn.in_waiting > 0:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    if line:
                        try:
                            data = json.loads(line)
                            self.data_store.add_sample(data)
                            logger.debug(f"Received: {data}")
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse JSON: {line} - {e}")
                else:
                    time.sleep(0.1)
            except Exception as e:
                logger.error(f"Error in read loop: {e}")
                time.sleep(1)


# Global data store instance
arduino_data = ArduinoDataStore()

# Start reader when module is imported (or start it from main app)
def start_arduino_reader(port='COM10', baudrate=9600):
    """Start the Arduino reader service"""
    reader = ArduinoReader(port=port, baudrate=baudrate, data_store=arduino_data)
    reader.start()
    return reader


if __name__ == "__main__":
    # Test the reader standalone
    reader = start_arduino_reader()
    try:
        while True:
            time.sleep(5)
            latest = arduino_data.get_latest()
            stats = arduino_data.get_aggregated_stats()
            print(f"Latest: {latest}")
            print(f"Stats: {stats}")
    except KeyboardInterrupt:
        reader.stop()
