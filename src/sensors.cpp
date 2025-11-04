#include <Arduino.h>

const int pinLight = A1;
const int pinSound = A0;

// Defines the light-sensor threshold value below which the LED will turn on.
// Decrease this value to make the device more sensitive to ambient light, or vice-versa.
int lightThresholdValue = 700;
int soundThresholdValue = 500;

const int pinTemp = A0;

// Define the B-value of the thermistor.
// This value is a property of the thermistor used in the Grove - Temperature Sensor,
// and used to convert from the analog value it measures and a temperature value.
const int B = 3975;

void setup()
{
    // Configure the button's pin for input signals.
    Serial.begin(9600);

}

void loop()
{
    int lightSensorValue = analogRead(pinLight);

    // Turn the LED on if the sensor value is below the threshold.
    if(lightSensorValue < lightThresholdValue) {
        Serial.println("Too bright!");
        Serial.println(lightSensorValue);
    }

    // Get the (raw) value of the temperature sensor.
    int val = analogRead(pinTemp);

    // Determine the current resistance of the thermistor based on the sensor value.
    float resistance = (float)(1023-val)*10000/val;

    // Calculate the temperature based on the resistance value.
    float temperature = 1/(log(resistance/10000)/B+1/298.15)-273.15;

    // Print the temperature to the serial console.
    if (temperature > 28) {
      Serial.println("Sensor touched!");
    }

        int soundSensorValue = analogRead(pinSound);

    // If the measured sound level is above the threshold, print the message
    if(soundSensorValue > soundThresholdValue)
    {
        Serial.println("Too loud!");
        Serial.println(soundSensorValue);
    }

    delay(100);
}
