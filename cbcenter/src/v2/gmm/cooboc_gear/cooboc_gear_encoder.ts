import { PacketAttr, PACKET_HEADER, PACKET_LENGTH, PacketType, calculateCrc } from "./def";






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
        buf.writeUint16BE(packetId, 2);
        buf.writeUint16BE(PacketType.AUTH, 4);

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