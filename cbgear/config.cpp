#include "config.h"
#include <Arduino_BuiltIn.h>
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <stdint.h>


Config g_config;
Mode g_mode;
uint32_t g_chipId;
uint8_t g_mac[6];
char g_wifiName[20];
char g_hostname[12];
char g_idStr[8];


uint16_t calculateCrc(uint8_t* dataPtr, size_t len) {
  int i = 0;
  uint16_t crc = 0;
  for (size_t i = 0U; i < len; ++i) {
    uint16_t data = *(dataPtr + i);
    crc ^= data;
    if (crc & 0x01) {
      crc = (crc << 1) ^ 0xA001;
    } else {
      crc = (crc << 1);
    }
  }
  return crc;
}


bool readEepromConfig() {
  uint8_t* baseAddr = (uint8_t*)(&g_config);
  for (size_t i = 0U; i < EEPROM_SIZE; ++i) {
    *(baseAddr + i) = EEPROM.read(i);
  }
  uint16_t readoutCrc = g_config.crc;
  g_config.crc = 0;

  uint16_t expectCrc = calculateCrc(baseAddr, EEPROM_SIZE);

  if (expectCrc == readoutCrc) {
    Serial.print("CRC true, crc = ");
    Serial.println(expectCrc);
  } else {
    Serial.print("CRC error, expect = ");
    Serial.print(expectCrc);
    Serial.print(" readout = ");
    Serial.println(readoutCrc);
  }

  // TODO: check essid > 0 ? and type != 0 ?
  if (expectCrc == readoutCrc) {
    return g_config.type != 0;
  }
  return false;
  
}

void writeEepromConfig() {
  g_config.crc = 0;
  uint8_t* baseAddr = (uint8_t*)(&g_config);
  uint16_t expectCrc = calculateCrc(baseAddr, EEPROM_SIZE);
  g_config.crc = expectCrc;
  for (size_t i = 0U; i < EEPROM_SIZE; ++i) {
    EEPROM.write(i, baseAddr[i]);
  }
  EEPROM.commit();
  
}

void readMacAddress() {
  g_chipId = ESP.getChipId();
  g_mac[0] = 0x81;
  g_mac[1] = 0x73;
  g_mac[2] = (g_chipId >> 24) & 0x00FF;
  g_mac[3] = (g_chipId >> 16) & 0x00FF;
  g_mac[4] = (g_chipId >> 8) & 0x00FF;
  g_mac[5] = g_chipId & 0x00FF;
}

static char CHARMAP[36] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' };

void makeName() {
  g_wifiName[0] = 'C';
  g_wifiName[1] = 'o';
  g_wifiName[2] = 'o';
  g_wifiName[3] = 'b';
  g_wifiName[4] = 'o';
  g_wifiName[5] = 'c';
  g_wifiName[6] = 'S';
  g_wifiName[7] = 'm';
  g_wifiName[8] = 'a';
  g_wifiName[9] = 'r';
  g_wifiName[10] = 't';
  g_wifiName[11] = '_';

  g_hostname[0] = 'C';
  g_hostname[1] = 'S';
  g_hostname[2] = 'G';
  g_hostname[3] = '-';
  uint32_t chipId = g_chipId;
  for (int i = 0; i < 7; ++i) {
    g_idStr[i] = CHARMAP[chipId % 36];
    g_wifiName[12 + i] = g_idStr[i];
    g_hostname[4+i] = g_idStr[i];
    chipId /= 36;
  }
  g_wifiName[19] = '\0';
  g_hostname[11] = '\0';
  Serial.print("name: ");
  Serial.println(g_wifiName);
}

void hardwareSetup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  Serial.println("\n");

  g_mode = readEepromConfig() ? Mode::STA : Mode::AP;
  readMacAddress();
  makeName();

  
}