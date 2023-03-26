import * as Utils from "./utils";

export enum PacketType {
    AUTH = 0x0203,
    HEARTBEAT = 0x0631,
};




const PACKET_LENGTH: number = 16;
const PACKET_TIMEOUT_THRESHOLD: number = 400;
const PACKET_HEADER: number = 0xA5;




class GearProtocol {
    private packetId: number = 0;
    private makePacketId(): number {
        return this.packetId++;
    }

    /**
     *     0   1   2      3  4        5   6       ...      13   14 15
        ┌────┬────┬─────────┬───────────┬──────────┬──────────┬──────┐
        │0xA5│ATTR│PackID(2)│PackType(2)│PayloadLen│Payload(7)│CRC(2)│
        └────┴────┴─────────┴───────────┴──────────┴──────────┴──────┘
    **/


    buildServerAuthenticationRequest(): Buffer {
        const buf: Buffer = Buffer.alloc(PACKET_LENGTH);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = PACKET_HEADER; // head
        buf[1] = 0x00; // packet attribute
        buf.writeUint16BE(packetId, 2);
        buf.writeUint16BE(PacketType.AUTH, 4);
        // buf[6] = 0;
        // ...
        const crc: number = Utils.calculateCrc(buf);

        buf.writeUint16BE(crc, 14);
        return buf;
    }

    buildHeartbeatRequest(): Buffer {
        const buf: Buffer = Buffer.alloc(PACKET_LENGTH);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = PACKET_HEADER; // head
        buf[1] = 0x00; // packet attribute
        buf.writeUint16BE(packetId, 2);
        buf.writeUint16BE(PacketType.HEARTBEAT, 4);
        // buf[6] = 0;
        // ...
        const crc: number = Utils.calculateCrc(buf);

        buf.writeUint16BE(crc, 14);
        return buf;
    }
};

export const gearProtocol = new GearProtocol();



export default class PacketParser {
    private lastCommMillis_: number = 0;
    private packetOffset_: number = 0;
    private packetBuffer_: Buffer = Buffer.alloc(PACKET_LENGTH);
    private onPacketCallback_: ((buffer: Buffer) => void) | undefined = undefined;

    private millis(): number {
        const time: [number, number] = process.hrtime();
        return time[0] * 1000 + time[1] / 1000;
    }

    onPacket(callback: ((buffer: Buffer) => void)) {
        this.onPacketCallback_ = callback;
    }

    parse: (data: Buffer) => void = (data: Buffer): void => {
        const currentMillis: number = this.millis();
        if ((currentMillis - this.lastCommMillis_) > PACKET_TIMEOUT_THRESHOLD) {
            this.packetOffset_ = 0;
        }
        this.lastCommMillis_ = currentMillis;

        for (let i = 0; i < data.length; ++i) {
            const byte: number = data[i];
            if (this.packetOffset_ == 0) {
                // Search for packet header
                if (byte === PACKET_HEADER) {
                    this.packetBuffer_[0] = byte;
                    this.packetOffset_++;
                }
            } else {
                this.packetBuffer_[this.packetOffset_] = byte;
                this.packetOffset_++;
                if (this.packetOffset_ == PACKET_LENGTH) {
                    this.packetOffset_ = 0;
                    this.decodePacket();
                }
            }
        }
    }

    private decodePacket() {
        let actualCrc: number = this.packetBuffer_.readUint16BE(14);
        this.packetBuffer_.writeUint16BE(0, 14);
        const expectCrc: number = Utils.calculateCrc(this.packetBuffer_);
        if (actualCrc === expectCrc) {
            if (this.onPacketCallback_) this.onPacketCallback_(this.packetBuffer_);
        }
    }

    constructor() { }
};


