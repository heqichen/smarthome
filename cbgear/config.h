#ifndef __CONFIG_H__
#define __CONFIG_H__

#include <stdint.h>

struct Config {
  char essid[16];
  char password[16];
  int type;
  uint16_t crc;
};

#define EEPROM_SIZE sizeof(Config)

enum Mode : uint8_t {
  AP,
  STA,
};

void writeEepromConfig();
void hardwareSetup();

extern Config g_config;
extern Mode g_mode;
extern uint32_t g_chipId;
extern char g_wifiName[20];
extern char g_hostname[12];
extern char g_idStr[8];
extern uint8_t g_mac[6];

#endif
