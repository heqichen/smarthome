#ifndef __PACKET_PARSER_H__
#define __PACKET_PARSER_H__


#include <stdint.h>
#include <ESPAsyncTCP.h>

constexpr uint64_t PACKET_TIMEOUT_THRESHOLD{ 400U };

constexpr uint32_t PACKET_LENGTH{ 16U };
constexpr uint8_t PACKET_HEADER{ 0xA5 };

enum class PacketType : uint16_t {
  AUTH = 0x0203,
  HEARTBEAT = 0x0631,
  USER_ACTION = 0x0707
};


class PacketParser {
public:
  void parse(void *data, size_t len, AsyncClient *client);
private:

  uint8_t packetBuffer_[PACKET_LENGTH];
  uint32_t packetOffset_{ 0U };
  uint64_t lastDataMillis_{ 0U };
  AsyncClient *client_{ nullptr };

  void decodePacket();
  void handlePacket();
};


class PacketEncoder {
public:
  uint8_t *EncodeUserAction(const uint8_t *payload);
private:
  uint8_t packetBuffer_[PACKET_LENGTH];
  uint16_t packetId_ {1U};
};


#endif
