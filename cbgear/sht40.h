#ifndef __SHT40_H__
#define __SHT40_H__

#include <Arduino.h>

struct ShtData {
  bool isGood {false};
  int lastError {0};
  uint16_t temp {0U};
  uint16_t humidity {0U};
  uint32_t samplingTime {0ULL};
};

class Sht40 {
public:
  void setup();
  void loop();
  ShtData getData() const {return _data;};
private:
  uint32_t _lastSamplingTime{ 0ULL };
  bool _isDataRequestSent {false};
  ShtData _data;
  int32_t _lastError {0};

  void sendRequestCommand();
  void sendRequestData();
  uint8_t crc8(const uint8_t *data, uint8_t len);
};

#endif
