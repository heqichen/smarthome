#include "cs_client.h"
#include "config.h"
#include <ESP8266WiFi.h>

static WiFiClient client;
constexpr uint64_t RECONECT_TIMEOUT = 2000U;  // reconnect after lost connection, this value is to avoid high frequency reconnect
constexpr uint64_t PACKET_TIMEOUT_THRESHOLD = 400U;

constexpr uint32_t PACKET_LENGTH{ 16U };
constexpr uint8_t PACKET_HEADER{ 0xA5 };
constexpr uint16_t PACKET_TYPE_AUTH{ 0x0203 };
constexpr uint16_t PACKET_TYPE_HEARTBEAT{ 0x0631 };

class PacketParser {
public:
  void parse() {
    uint64_t currentMillis = millis();
    if ((currentMillis - lastDataMillis_) > PACKET_TIMEOUT_THRESHOLD) {
      packetOffset_ = 0U;
    }
    while (client.available()) {
      uint8_t b = client.read();
      if (packetOffset_ == 0U) {  // Search for packet header
        if (b == PACKET_HEADER) {
          packetBuffer_[0] = PACKET_HEADER;
          packetOffset_++;
        }
      } else {
        packetBuffer_[packetOffset_] = b;
        packetOffset_++;
        if (packetOffset_ == PACKET_LENGTH) {
          packetOffset_ = 0U;
          decodePacket();
        }
      }
    }
  }
private:
  uint8_t packetBuffer_[PACKET_LENGTH];
  uint32_t packetOffset_{ 0U };
  uint64_t lastDataMillis_{ 0U };

  void decodePacket() {
    const uint16_t readoutCrc = (packetBuffer_[14] << 8) | packetBuffer_[15];
    packetBuffer_[14] = 0U;
    packetBuffer_[15] = 0U;
    const uint16_t expectCrc = calculateCrc(packetBuffer_, PACKET_LENGTH);
    if (readoutCrc == expectCrc) {
      handlePacket();
    }
  }

  void handlePacket() {
    const uint8_t packetAttr = packetBuffer_[1];
    const uint16_t packetId = (packetBuffer_[2] << 8) | packetBuffer_[3];
    const uint16_t packetType = (packetBuffer_[4] << 8) | packetBuffer_[5];

    switch (packetType) {
      case (PACKET_TYPE_AUTH):
        {
          // response it immediately
          packetBuffer_[1] = packetAttr | 0x01;
          packetBuffer_[6] = g_config.type;
          for (int i = 0; i < 7; ++i) {
            packetBuffer_[7 + i] = g_idStr[i];
          }
          break;
        }
      case (PACKET_TYPE_HEARTBEAT):
        {
          // response it immediately
          Serial.print("heart beat");
          Serial.println(packetId);
          packetBuffer_[1] = packetAttr | 0x01;
          break;
        }
      default:
        {
          // Unknown packet
          return;
        }
    }
    // Clear CRC bit
    packetBuffer_[14] = 0U;
    packetBuffer_[15] = 0U;
    const uint16_t crc = calculateCrc(packetBuffer_, PACKET_LENGTH);
    packetBuffer_[14] = (crc >> 8) & 0x00FF;
    packetBuffer_[15] = crc & 0x00FF;
    client.write(packetBuffer_, PACKET_LENGTH);
    Serial.println("already return packet");
  }
};

static PacketParser packetParser;

void CsClient::setup() {
  connect();
}
void CsClient::loop() {
  if (client.status() == tcp_state::ESTABLISHED) {
    lastConnectedTime = millis();
    packetParser.parse();
  }
  if ((millis() - lastConnectedTime) > RECONECT_TIMEOUT) {
    client.stop();
    connect();
  }
}

void CsClient::connect() {
  lastConnectedTime = millis();
  if (client.connect("10.99.1.3", 8113)) {
    onConnected();
    client.setTimeout(RECONECT_TIMEOUT);
  }
}

void CsClient::onConnected() {
}
