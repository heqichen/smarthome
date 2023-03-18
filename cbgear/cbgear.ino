
#include "portal.h"
#include "config.h"
#include "sta.h"




Portal portal;
Sta sta;


void setup() {
  // put your setup code here, to run once:

  // Hardwrare initialize
  hardwareSetup();
  if (g_mode == Mode::AP) {
    portal.setup();
  } else {
    sta.setup();
  }
}

static int keyStatus = 0;

void loop() {
  // put your main code here, to run repeatedly:
  // Serial.println(EEPROM_SIZE);
  // delay(10);
  if (g_mode == Mode::AP) {
    portal.loop();
  } else {
    sta.loop();
    int currentStatus = digitalRead(12);
    if (keyStatus != currentStatus) {
      keyStatus = currentStatus;
      Serial.print("key changed ");
      Serial.println(currentStatus);
      digitalWrite(13, keyStatus);
    }
  }
}
