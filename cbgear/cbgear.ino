
#include "portal.h"
#include "config.h"





Portal portal;


void setup() {
  // put your setup code here, to run once:

  // Hardwrare initialize
  hardwareSetup();
    if (g_mode == Mode::AP) {
    portal.setup();
  } else {
  }
}

void loop() {
  // put your main code here, to run repeatedly:
  // Serial.println(EEPROM_SIZE);
  // delay(10);
  if (g_mode == Mode::AP) {
    portal.loop();
  } else {
  }
}
