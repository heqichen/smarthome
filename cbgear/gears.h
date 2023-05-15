#ifndef __GERAS_H__
#define __GERAS_H__

#include <vector>
#include <stdint.h>
#include "config.h"

#define MAX_HARDWARE_PORT_NUMBER 8
#define PAYLOAD_LENGTH 7U


class Gears {
public:
  void setup();
  void loop();
  bool isDirty() const {
    return isDirty_;
  }
  uint8_t* getStatusBuffer();
  void setOutputValue(uint8_t portIdx, uint8_t value);

private:
  void setupDevicePin();
  void onButtonChanged(int inIdx);

  int type_{ -1 };

  int inputRead_[MAX_HARDWARE_PORT_NUMBER];
  int latestInputRead_[MAX_HARDWARE_PORT_NUMBER];

  bool inputStatus_[MAX_HARDWARE_PORT_NUMBER];   // is activated
  bool outputStatus_[MAX_HARDWARE_PORT_NUMBER];  // is activated
  

  uint64_t lastInputChangedTime_[MAX_HARDWARE_PORT_NUMBER];

  bool isDirty_{ false };
  uint8_t gearStatusPayloadBuffer_[PAYLOAD_LENGTH];
};

#endif
