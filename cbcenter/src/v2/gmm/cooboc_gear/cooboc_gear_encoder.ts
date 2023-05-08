import { PacketAttr, PACKET_HEADER, PACKET_LENGTH, PacketType, calculateCrc, PACKET_OFFSET_TYPE, PACKET_OFFSET_ID } from "./def";






class CoobocGearEncoder_ {
    private _packetIncId: number = 0;
    constructor() {
        this.buildAuthenticatePacket = this.buildAuthenticatePacket.bind(this);
    };

    readonly buildAuthenticatePacket = (): Buffer => {
        const buf: Buffer = Buffer.alloc(PACKET_LENGTH);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = PACKET_HEADER; // head
        buf[1] = PacketAttr.REQUEST_ACK; // auth need ack
        buf.writeUint16BE(packetId, PACKET_OFFSET_ID);
        buf.writeUint16BE(PacketType.AUTH, PACKET_OFFSET_TYPE);

        const crc: number = calculateCrc(buf);

        buf.writeUint16BE(crc, 14);
        return buf;
    }

    readonly buildHeartbeatPacket = (): Buffer => {
        const buf: Buffer = Buffer.alloc(PACKET_LENGTH);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = PACKET_HEADER; // head
        buf[1] = PacketAttr.REQUEST_ACK; // auth need ack
        buf.writeUint16BE(packetId, PACKET_OFFSET_ID);
        buf.writeUint16BE(PacketType.HEARTBEAT, PACKET_OFFSET_TYPE);

        const crc: number = calculateCrc(buf);

        buf.writeUint16BE(crc, 14);
        return buf;
    }

    private readonly makePacketId = (): number => {
        this._packetIncId++;
        return this._packetIncId;
    }
};

const CoobocGearEncoder: CoobocGearEncoder_ = new CoobocGearEncoder_();
export default CoobocGearEncoder;