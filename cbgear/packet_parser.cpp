#include "packet_parser.h"
#include "config.h"


void PacketParser::parse(void *data, size_t len, AsyncClient *client) {
  if (client_ != client) {
    packetOffset_ = 0U;
  }
  client_ = client;

  uint64_t currentMillis = millis();
  if ((currentMillis - lastDataMillis_) > PACKET_TIMEOUT_THRESHOLD) {
    packetOffset_ = 0U;
  }
  for (int32_t i = 0; i < len; ++i) {
    const uint8_t b = ((uint8_t *)(data))[i];
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
void PacketParser::decodePacket() {
  const uint16_t readoutCrc = (packetBuffer_[14] << 8) | packetBuffer_[15];
  packetBuffer_[14] = 0U;
  packetBuffer_[15] = 0U;
  const uint16_t expectCrc = calculateCrc(packetBuffer_, PACKET_LENGTH);
  if (readoutCrc == expectCrc) {
    handlePacket();
  }
}

void PacketParser::handlePacket() {
  const uint8_t packetAttr = packetBuffer_[1];
  const uint16_t packetId = (packetBuffer_[2] << 8) | packetBuffer_[3];
  const PacketType packetType = static_cast<PacketType>((packetBuffer_[4] << 8) | packetBuffer_[5]);

  switch (packetType) {
  case (PacketType::AUTH):
      {
        // response it immediately
        packetBuffer_[1] = packetAttr | 0x01;
        packetBuffer_[6] = g_config.type;
        for (int i = 0; i < 7; ++i) {
          packetBuffer_[7 + i] = g_idStr[i];
        }
        break;
      }
    case (PacketType::HEARTBEAT):
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
  if (client_ != nullptr) {
    client_->write((const char *)packetBuffer_, PACKET_LENGTH);
    Serial.println("already return packet");
  }
}


/////////////////////////////////////////////// Encoder ///////////////////////////////////


uint8_t *PacketEncoder::EncodeUserAction(const uint8_t *payload) {
  const uint16_t packetType =static_cast<uint16_t>(PacketType::USER_ACTION);
  packetId_++;

  packetBuffer_[0] = PACKET_HEADER;
  packetBuffer_[1] = 0x00;  // request
  packetBuffer_[2] = (packetId_ >> 8) & 0x00FF;
  packetBuffer_[3] = packetId_ & 0x00FF;
  packetBuffer_[4] = (packetType >> 8) & 0x00FF;
  packetBuffer_[5] = packetType & 0x00FF;
  for (int i = 0; i < 8; ++i) {
    packetBuffer_[6 + i] = payload[i];
  }
  packetBuffer_[14] = 0U;
  packetBuffer_[15] = 0U;
  const uint16_t crc = calculateCrc(packetBuffer_, PACKET_LENGTH);
  packetBuffer_[14] = (crc >> 8) & 0x00FF;
  packetBuffer_[15] = crc & 0x00FF;
  return packetBuffer_;
}