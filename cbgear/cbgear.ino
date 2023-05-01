
#include "portal.h"
#include "config.h"
#include "sta.h"
#include "gears.h"


static Portal portal;
static Sta sta;
static Gears gears;

void setup() {
  // put your setup code here, to run once:

  // Hardwrare initialize
  hardwareSetup();
  gears.setup();
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
  gears.loop();
  if (gears.isDirty()) {
    Serial.println("gear dirty");
    uint8_t *payload = gears.getStatusBuffer();
    if (g_mode == Mode::AP) {
      // TOOD
    } else {
      sta.sendUserAction(payload);
    }
  }
}
