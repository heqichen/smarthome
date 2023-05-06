

// private decodePacket() {
//     let actualCrc: number = this.packetBuffer_.readUint16BE(14);
//     this.packetBuffer_.writeUint16BE(0, 14);
//     const expectCrc: number = Utils.calculateCrc(this.packetBuffer_);
//     if (actualCrc === expectCrc) {
//         if (this.onPacketCallback_) this.onPacketCallback_(this.packetBuffer_);
//     }
// }


