#include "gears.h"

// ['None','0-Test','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor'];

enum class InputType : uint8_t {
  HIGH_PUSH,
  LOW_PUSH,
};

enum class OutputType : uint8_t {
  HIGH_RELAY,
  LOW_RELAY,
};

enum class LinkType : uint8_t {
  GO_THROUGH,
  REVERSE_THROUGH,
  TOGGLE
};

struct Input {
  int port;
  int hwConfig;
  InputType type;
};
const std::vector<Input> inputList{ { 2, INPUT_PULLUP, InputType::HIGH_PUSH } };



void defaultPinSetup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(4, INPUT_PULLUP);
  pinMode(5, INPUT_PULLUP);
  pinMode(12, INPUT_PULLUP);
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
  pinMode(15, INPUT_PULLUP);
}

void devicePinSetup() {
  // ['None','0-Test','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor'];
  Serial.print("config to gear type: ");
  Serial.println(g_config.type);
  switch (g_config.type) {
    case (1):
      {  // For test
        pinMode(2, INPUT_PULLUP);
        break;
      }
    case (5):
      {  // SLOT
        // Relay
        pinMode(4, OUTPUT);
        digitalWrite(4, LOW);
        // Key, push to ground
        pinMode(12, INPUT_PULLUP);
        // LED, high to light
        pinMode(13, OUTPUT);
        digitalWrite(13, LOW);
        break;
      }
    default:
      {
        Serial.println("Gear type not configured! \n TODO: Need invalidate the configuration.");
        break;
      }
  }
}


void Gears::setup() {
  defaultPinSetup();

  if (g_mode == Mode::AP) {
    type_ = -1;
  } else {
    type_ = g_config.type;
    setupDevicePin();
  }

  for (int i = 0; i < MAX_HARDWARE_PORT_NUMBER; ++i) {
    inputStatus_[i] = 0;
    lastInputChangedTime_[i] = 0;
  }

  for (int i=0; i<8; ++i) {
    gearStatusPayloadBuffer_[i] = 0;
  }
}

void Gears::setupDevicePin() {
  if (type_ > 0) {
    const std::vector<Input> &il{ inputList };
    for (int i = 0; i < il.size(); ++i) {
      const Input &in{ il[i] };
      pinMode(in.port, in.hwConfig);
      inputStatus_[i] = digitalRead(il[i].port);
      lastInputRead_[i] = inputStatus_[i];

      Serial.print("init read for port[");
      Serial.print(i);
      Serial.print(",P");
      Serial.print(il[i].port);
      Serial.print("] = ");
      Serial.println(inputStatus_[i]);
    }
  }
}

void Gears::loop() {
  if (type_ > 0) {
    const std::vector<Input> &il{ inputList };
    const uint64_t currentTime = millis();
    for (int i = 0; i < il.size(); ++i) {
      const Input &in{ il[i] };
      const int cur = digitalRead(il[i].port);
      if (cur != lastInputRead_[i]) {
        lastInputChangedTime_[i] = currentTime;
        lastInputRead_[i] = cur;
      }
      if ((lastInputRead_[i] != inputStatus_[i]) && ((currentTime - lastInputChangedTime_[i]) > 20)) {
        Serial.print("input changed ");
        Serial.println(lastInputRead_[i]);
        inputStatus_[i] = lastInputRead_[i];
        isDirty_ = true;
      }
    }
  }
}

uint8_t *  Gears::getStatusBuffer() {
  uint8_t by = 0U;
  if (type_ > 0) {
    const std::vector<Input> &il{ inputList };
    for (int i = 0; i < il.size(); ++i) {
      by <<= 1;
        if (inputStatus_[i]) by |= 0x01;
    }  
    gearStatusPayloadBuffer_[0] = by;
  }
  isDirty_ = false;
  return gearStatusPayloadBuffer_;
}
  