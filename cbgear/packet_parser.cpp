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
    processPacket();
  }
}

void PacketParser::processPacket() {
  const uint8_t packetAttr = packetBuffer_[1];
  const uint16_t packetId = (packetBuffer_[2] << 8) | packetBuffer_[3];
  const PacketType packetType = static_cast<PacketType>((packetBuffer_[4] << 8) | packetBuffer_[5]);
  if (packetAttr == 0x00) {  // Need ack
    handleSpecificPacket(packetId, packetAttr, packetType);
    packetBuffer_[1] = packetAttr | 0x01;
    // Clear CRC bit
    packetBuffer_[14] = 0U;
    packetBuffer_[15] = 0U;
    const uint16_t crc = calculateCrc(packetBuffer_, PACKET_LENGTH);
    packetBuffer_[14] = (crc >> 8) & 0x00FF;
    packetBuffer_[15] = crc & 0x00FF;
    if (client_ != nullptr) {
      client_->write((const char *)packetBuffer_, PACKET_LENGTH);
      Serial.print("already return packet  : 0x");
      Serial.println((unsigned int)(packetType), 16);
    }
  } else {
    handleSpecificPacket(packetId, packetAttr, packetType);
  }
}

void PacketParser::handleSpecificPacket(const uint16_t packetId, const uint8_t packetAttr, const PacketType packetType) {
  switch (packetType) {
    case (PacketType::AUTH):
      {
        // response it immediately
        
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
        packetBuffer_[6] = 0x00;  // status ok
        const uint8_t *payload = g_gears.getStatusBuffer();
        for (int i = 0; i < PAYLOAD_LENGTH; ++i) {
          packetBuffer_[7 + i] = payload[i];
        }
        break;
      }
    case (PacketType::SINGLE_VALUE):
      {
        uint8_t portIdx = packetBuffer_[6];
        uint8_t value = packetBuffer_[7];
        Serial.print("set [");
        Serial.print((int)portIdx);
        Serial.print("] to ");
        Serial.println((int)(value));

        g_gears.setOutputValue(portIdx, value);
        break;
      }
    default:
      {
        // Unknown packet
        Serial.print("unknown packet type : 0x");
        Serial.println(static_cast<unsigned int>(packetType), 16);
        break;
      }
  }
}


/////////////////////////////////////////////// Encoder ///////////////////////////////////


uint8_t *PacketEncoder::EncodeUserAction(const uint8_t *payload) {
  const uint16_t packetType = static_cast<uint16_t>(PacketType::USER_ACTION);
  packetId_++;

  packetBuffer_[0] = PACKET_HEADER;
  packetBuffer_[1] = 0x00;  // request
  packetBuffer_[2] = (packetId_ >> 8) & 0x00FF;
  packetBuffer_[3] = packetId_ & 0x00FF;
  packetBuffer_[4] = (packetType >> 8) & 0x00FF;
  packetBuffer_[5] = packetType & 0x00FF;
  packetBuffer_[6] = 0x00;  // status ok
  for (int i = 0; i < PAYLOAD_LENGTH; ++i) {
    packetBuffer_[7 + i] = payload[i];
  }
  packetBuffer_[14] = 0U;
  packetBuffer_[15] = 0U;
  const uint16_t crc = calculateCrc(packetBuffer_, PACKET_LENGTH);
  packetBuffer_[14] = (crc >> 8) & 0x00FF;
  packetBuffer_[15] = crc & 0x00FF;
  return packetBuffer_;
}