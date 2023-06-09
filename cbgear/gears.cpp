#include "gears.h"
#include "sht40.h"

static Sht40 sht40;

// ['None','0-Test','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor', 'SHT40'];

enum class InputMode : uint8_t {
  PUSH_LOW,   // Default is high, push become low
  PUSH_HIGH,  // Default is low, push become high
};

enum class OutputMode : uint8_t {
  ACTIVATE_HIGH,
  ACTIVATE_LOW,
};

enum class LinkMode : uint8_t {
  GO_THROUGH,
  REVERSE_THROUGH,
  ACTIVATED_TOGGLE,
  DEACTIVATED_TOGGLE,
};

struct Input {
  int port;
  int hwConfig;
  InputMode mode;
};

struct Output {
  int port;
  OutputMode mode;
};

struct Link {
  int inIdx;
  int outIdx;
  LinkMode mode;
};


const std::vector<std::vector<Input>>
  GEAR_INPUT_LIST{
    // 0 None
    {},
    // 1 Test, ESP-01
    { { 2, INPUT_PULLUP, InputMode::PUSH_LOW } },
    // 2
    {},
    // 3
    {},
    // 4
    {},
    // 5
    {},
    // 6 SLOT
    { { 12, INPUT_PULLUP, InputMode::PUSH_LOW } },
    // 7
    {},
    // 8
    {},
  };

const std::vector<std::vector<Output>> GEAR_OUTPUT_LIST{
  // 0 None
  {},
  // 1 Test, ESP-01
  {},
  // 2
  {},
  // 3
  {},
  // 4
  {},
  // 5
  {},
  // 6 SLOT
  { { 13, OutputMode::ACTIVATE_HIGH }, { 4, OutputMode::ACTIVATE_HIGH } },
  // 7
  {},
  // 8
  {},
};


const std::vector<std::vector<Link>> GEAR_LINK_LIST{
  // 0 None
  {},
  // 1 Test, ESP-01
  {},
  // 2
  {},
  // 3
  {},
  // 4
  {},
  // 5
  {},
  // 6 SLOT
  { { 0, 0, LinkMode::GO_THROUGH }, { 0, 1, LinkMode::ACTIVATED_TOGGLE } },
  // 7
  {},
  // 8
  {},
};



namespace {

bool getInputActivation(int read, InputMode inputMode) {
  return (read && inputMode == InputMode::PUSH_HIGH) || (!read && inputMode == InputMode::PUSH_LOW);
}

int getOutputLevel(bool isActivated, OutputMode outputMode) {
  return ((isActivated && outputMode == OutputMode::ACTIVATE_HIGH) || (!isActivated && outputMode == OutputMode::ACTIVATE_LOW)) ? HIGH : LOW;
}

bool getOutputActivation(bool isInputActivated, LinkMode linkMode, bool outputStatus) {
  bool isOutputActivated = false;
  switch (linkMode) {
    case (LinkMode::GO_THROUGH):
      {
        isOutputActivated = isInputActivated;
        break;
      }
    case (LinkMode::REVERSE_THROUGH):
      {
        isOutputActivated = !isInputActivated;
        break;
      }

    case (LinkMode::ACTIVATED_TOGGLE):
      {
        isOutputActivated = !!(outputStatus) != isInputActivated;
        break;
      }
    case (LinkMode::DEACTIVATED_TOGGLE):
      {
        isOutputActivated = !(outputStatus) != isInputActivated;
        break;
      }
    default:
      {
        break;
      }
  }
  return isOutputActivated;
}
}

void defaultPinSetup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(4, INPUT_PULLUP);
  pinMode(5, INPUT_PULLUP);
  pinMode(12, INPUT_PULLUP);
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
  pinMode(15, INPUT_PULLUP);
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
    inputRead_[i] = 0;
    lastInputChangedTime_[i] = 0;
    outputStatus_[i] = false;
  }

  for (int i = 0; i < PAYLOAD_LENGTH; ++i) {
    gearStatusPayloadBuffer_[i] = 0;
  }
}


void Gears::setupDevicePin() {
  if (type_ > 0) {
    switch (type_) {
      case (GEAR_TYPE_SHT40):
        {
          sht40.setup();
          break;
        }
      default:
        {
          // general IO gear
          // Initialize Input
          const std::vector<Input> &inputList{ GEAR_INPUT_LIST[type_] };
          for (int i = 0; i < inputList.size(); ++i) {
            const Input &in{ inputList[i] };
            pinMode(in.port, in.hwConfig);
            inputRead_[i] = digitalRead(inputList[i].port);
            latestInputRead_[i] = inputRead_[i];
            inputStatus_[i] = getInputActivation(inputRead_[i], in.mode);
          }

          // Initialize Output
          const std::vector<Output> &outputList{ GEAR_OUTPUT_LIST[type_] };
          for (int i = 0; i < outputList.size(); ++i) {
            const Output &out{ outputList[i] };
            pinMode(out.port, OUTPUT);
            outputStatus_[i] = false;
            if (out.mode == OutputMode::ACTIVATE_HIGH) {
              digitalWrite(out.port, LOW);
            } else {
              digitalWrite(out.port, HIGH);
            }
          }
          break;
        }
    }
  }
}



void Gears::loop() {
  if (type_ > 0) {
    switch (type_) {
      case (GEAR_TYPE_SHT40):
        {
          sht40.loop();
          break;
        }
      default:
        {
          const std::vector<Input> &inputList{ GEAR_INPUT_LIST[type_] };
          const uint64_t currentTime = millis();
          for (int i = 0; i < inputList.size(); ++i) {
            const Input &in{ inputList[i] };
            const int cur = digitalRead(inputList[i].port);
            if (cur != latestInputRead_[i]) {
              lastInputChangedTime_[i] = currentTime;
              latestInputRead_[i] = cur;
            }
            if ((latestInputRead_[i] != inputRead_[i]) && ((currentTime - lastInputChangedTime_[i]) > 20)) {
              inputRead_[i] = latestInputRead_[i];
              inputStatus_[i] = getInputActivation(inputRead_[i], in.mode);
              isDirty_ = true;
              onButtonChanged(i);

              Serial.print("input changed ");
              Serial.println(inputStatus_[i]);
            }
          }
          break;
        }
    }
  }
}

uint8_t *Gears::getStatusBuffer() {
  uint8_t by = 0U;
  if (type_ > 0) {
    switch (type_) {
      case (GEAR_TYPE_SHT40):
        {
          ShtData data = sht40.getData();
          if (data.isGood) {
            gearStatusPayloadBuffer_[0] = 0;
            gearStatusPayloadBuffer_[1] = data.temp >> 8;
            gearStatusPayloadBuffer_[2] = data.temp |= 0x00FF;
            gearStatusPayloadBuffer_[3] = data.humidity >> 8;
            gearStatusPayloadBuffer_[4] = data.humidity |= 0x00FF;
          } else {
            gearStatusPayloadBuffer_[0] = data.lastError;
            gearStatusPayloadBuffer_[1] = 0;
            gearStatusPayloadBuffer_[2] = 0;
            gearStatusPayloadBuffer_[3] = 0;
            gearStatusPayloadBuffer_[4] = 0;
          }
          break;
        }
      default:
        {
          const std::vector<Input> &inputList{ GEAR_INPUT_LIST[type_] };
          for (int i = 0; i < inputList.size(); ++i) {
            by <<= 1;
            if (inputStatus_[i]) by |= 0x01;
          }
          gearStatusPayloadBuffer_[0] = by;

          by = 0U;
          const std::vector<Output> &outputList{ GEAR_OUTPUT_LIST[type_] };
          for (int i = 0; i < outputList.size(); ++i) {
            by <<= 1;
            if (outputStatus_[i]) by |= 0x01;
          }
          gearStatusPayloadBuffer_[1] = by;
          break;
        }
    }
  }
  isDirty_ = false;
  return gearStatusPayloadBuffer_;
}

void Gears::setOutputValue(uint8_t portIdx, uint8_t value) {
  if (type_ > 0) {
    if (type_ < GEAR_OUTPUT_LIST.size()) {
      const std::vector<Output> &outputList{ GEAR_OUTPUT_LIST[type_] };
      if (value < outputList.size()) {
        const Output &output{ outputList[portIdx] };
        outputStatus_[portIdx] = !!(value);
        digitalWrite(output.port, getOutputLevel(outputStatus_[portIdx], output.mode));
      }
    } else {
      // not general IO
    }
  }
}

void Gears::onButtonChanged(int inIdx) {
  // Get Input configuration
  const Input &input{ GEAR_INPUT_LIST[type_][inIdx] };
  const int currentStatus{ inputRead_[inIdx] };
  const InputMode &inputMode{ input.mode };


  const std::vector<Link> &linkList{ GEAR_LINK_LIST[type_] };
  for (int i = 0; i < linkList.size(); ++i) {
    const Link &link{ linkList[i] };
    if (link.inIdx == inIdx) {
      const Output &output{ GEAR_OUTPUT_LIST[type_][link.outIdx] };

      outputStatus_[link.outIdx] = getOutputActivation(inputStatus_[inIdx], link.mode, outputStatus_[link.outIdx]);
      digitalWrite(output.port, getOutputLevel(outputStatus_[link.outIdx], output.mode));
    }
  }
}
