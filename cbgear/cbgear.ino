
#include "portal.h"
#include "config.h"
#include "sta.h"


static Portal portal;
static Sta sta;

void setup() {
  // put your setup code here, to run once:

  // Hardwrare initialize
  hardwareSetup();
  g_gears.setup();
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
    portal.loop();  // Standalone mode for configuration
  } else {
    sta.loop();  // Working mode
  }
  g_gears.loop();
  if (g_gears.isDirty()) {
    Serial.println("gear dirty");
    const uint8_t *payload = g_gears.getStatusBuffer();
    if (g_mode == Mode::AP) {
      // TOOD
    } else {
      sta.sendUserAction(payload);
    }
  }
}
