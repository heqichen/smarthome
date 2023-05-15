#ifndef __CONFIG_H__
#define __CONFIG_H__

#include <ESP8266WiFi.h>
#include <stdint.h>
#include "gears.h"

#define APPLICATION_VERSION 8U

#define GEAR_TYPE_DHT11 11

class Gears;

struct Config {
  char essid[16];
  char password[16];
  int type;
  uint16_t appVersion;
  char host[16];
  uint16_t crc;
};

#define EEPROM_SIZE sizeof(Config)

enum Mode : uint8_t {
  AP,
  STA,
};

extern Config g_config;
extern Mode g_mode;
extern Gears g_gears;
extern uint32_t g_chipId;
extern char g_wifiName[20];
extern char g_hostname[12];
extern char g_idStr[8];
extern uint8_t g_mac[6];


uint16_t calculateCrc(uint8_t* dataPtr, size_t len);
void writeEepromConfig();
void hardwareSetup();



#endif

