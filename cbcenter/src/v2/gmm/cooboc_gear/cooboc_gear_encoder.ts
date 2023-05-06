
export enum PacketType {
    AUTH = 0x0203,
    HEARTBEAT = 0x0631,


    USER_ACTION = 0x0707,

    SINGLE_VALUE = 0x0801,
};


const PACKET_LENGTH: number = 16;
const PACKET_HEADER: number = 0xA5;
const PACKET_ATTR_REQUEST_ACK: number = 0x00;
const PACKET_ATTR_REQUEST_WITHOUT_ACK: number = 0x02;

/**
 *     0   1   2      3  4        5   6       ...      13   14 15
    ┌────┬────┬─────────┬───────────┬──────────┬──────────┬──────┐
    │0xA5│ATTR│PackID(2)│PackType(2)│PayloadLen│Payload(7)│CRC(2)│
    └────┴────┴─────────┴───────────┴──────────┴──────────┴──────┘
**/



export function calculateCrc(buf: Buffer): number {
    let crc: number = 0;
    for (let i = 0; i < buf.length; ++i) {
        const byte: number = buf[i];
        crc ^= byte;
        if (crc & 0x01) {
            crc = (crc << 1) ^ 0xA001;
        } else {
            crc = (crc << 1);
        }
        crc = crc & 0x00FFFF;
    }
    return crc;
}

class CoobocGearProtocol_ {
    private _packetIncId: number = 0;
    constructor() {
        this.buildAuthenticatePacket = this.buildAuthenticatePacket.bind(this);
    };

    readonly buildAuthenticatePacket = (): Buffer => {
        const buf: Buffer = Buffer.alloc(PACKET_LENGTH);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = PACKET_HEADER; // head
        buf[1] = PACKET_ATTR_REQUEST_ACK; // auth need ack
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

const CoobocGearProtocol: CoobocGearProtocol_ = new CoobocGearProtocol_();
export default CoobocGearProtocol;