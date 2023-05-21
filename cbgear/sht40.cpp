#include "sht40.h"

#include <Wire.h>
#include <Arduino.h>


#define SDA_PIN 4
#define SCL_PIN 5

const int16_t I2C_MASTER = 0x42;  // dummy id
const int16_t I2C_SLAVE = 0x44;

constexpr uint32_t SAMPLING_INTERVAL{ 1800ULL };
constexpr uint32_t REQUEST_INTERVAL{ 25ULL };

void Sht40::setup() {
  Wire.begin(SDA_PIN, SCL_PIN, I2C_MASTER);  // join i2c bus (address optional for master)
}

void Sht40::loop() {
  const uint32_t currentTime = millis();
  if ((currentTime - _lastSamplingTime) > SAMPLING_INTERVAL) {
    // Restore time
    _lastSamplingTime = currentTime;
    _isDataRequestSent = false;

    // send request
    sendRequestCommand();
  } else {
    if (((currentTime - _lastSamplingTime) > REQUEST_INTERVAL) && !_isDataRequestSent) {
      sendRequestData();
      _isDataRequestSent = true;
    }
  }
}



void Sht40::sendRequestCommand() {
  Wire.beginTransmission(I2C_SLAVE);  // transmit to device #8
  Wire.write(0xFD);                   // send command
  Wire.endTransmission();
}


void Sht40::sendRequestData() {
  uint8_t data[6];
  int len = Wire.requestFrom(I2C_SLAVE, 6);  // request 6 bytes from slave device #8
  if (len != 6) {
    _data.lastError = 1;  // length not correct
    _data.isGood = false;
    return;
  }

  for (int i = 0; i < 6; ++i) {
    data[i] = Wire.read();
  }
  Wire.flush();

  const uint8_t crcT = crc8(data, 2);
  const uint8_t crcH = crc8(data + 3, 2);


  if ((crcT != data[2]) || crcH != data[5]) {
    _data.lastError = 2;  // CRC error
    _data.isGood = false;
    // Serial.print(crcT, HEX);
    // Serial.print(" ");
    // Serial.print(data[2], HEX);
    // Serial.print(" ");
    // Serial.print(crcH, HEX);
    // Serial.print(" ");
    // Serial.println(data[5], HEX);
    return;
  }

  int16_t temp = data[0];
  temp <<= 8;
  temp |= data[1];
  _data.temp = temp;

  int16_t humidity = data[3];
  humidity <<= 8;
  humidity |= data[4];
  _data.humidity = humidity;

  _data.lastError = 0;
  _data.isGood = true;
  _data.samplingTime = millis();
}



uint8_t Sht40::crc8(const uint8_t *data, uint8_t len) {
  // adapted from SHT21 sample code from
  // http://www.sensirion.com/en/products/humidity-temperature/download-center/

  uint8_t crc = 0xff;
  uint8_t byteCtr;
  for (byteCtr = 0; byteCtr < len; ++byteCtr) {
    crc ^= data[byteCtr];
    for (uint8_t bit = 8; bit > 0; --bit) {
      if (crc & 0x80) {
        crc = (crc << 1) ^ 0x31;
      } else {
        crc = (crc << 1);
      }
    }
  }
  return crc;
}
