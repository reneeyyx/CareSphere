import { SerialPort } from 'serialport';

console.log('Scanning for available serial ports...\n');

SerialPort.list().then(ports => {
  if (ports.length === 0) {
    console.log('❌ No serial ports found!');
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Arduino is connected via USB');
    console.log('2. Check Device Manager > Ports (COM & LPT)');
    console.log('3. Install Arduino drivers if needed');
    return;
  }

  console.log(`✓ Found ${ports.length} serial port(s):\n`);
  
  ports.forEach((port, index) => {
    console.log(`${index + 1}. ${port.path}`);
    console.log(`   Manufacturer: ${port.manufacturer || 'Unknown'}`);
    console.log(`   Serial Number: ${port.serialNumber || 'N/A'}`);
    console.log(`   Product ID: ${port.productId || 'N/A'}`);
    console.log(`   Vendor ID: ${port.vendorId || 'N/A'}`);
    
    // Detect likely Arduino
    const isArduino = port.manufacturer?.toLowerCase().includes('arduino') ||
                     port.manufacturer?.toLowerCase().includes('ftdi') ||
                     port.manufacturer?.toLowerCase().includes('ch340') ||
                     port.productId === '0043' || // Arduino Uno
                     port.productId === '7523';   // CH340 chip
    
    if (isArduino) {
      console.log(`   🎯 LIKELY ARDUINO - Use: ${port.path}`);
    }
    console.log('');
  });
  
  console.log('\nTo use the detected port, update sensors.js:');
  console.log('const ARDUINO_PORT = \'COM<number>\';');
}).catch(err => {
  console.error('Error listing ports:', err);
});
