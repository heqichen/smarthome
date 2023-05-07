
import { PACKET_HEADER, PACKET_LENGTH, PACKET_OFFSET_ATTR, PACKET_OFFSET_CRC, PACKET_OFFSET_ID, PACKET_OFFSET_PAYLOAD, PACKET_OFFSET_PAYLOAD_END, PACKET_OFFSET_TYPE, PacketAttr, PacketType, calculateCrc } from "./def";

export type CoobocGearPacketType = {
    attr: number,
    id: number,
    type: number,
    payload: Buffer,
};

export type DecoderCallbackType = (packet: CoobocGearPacketType) => void;
export default class CoobocGearDecoder {
    private readonly PACKET_TIMEOUT_THRESHOLD: number = process.env.COOBOC_GEAR_PACKET_TIMEOUT_THRESHOLD ? parseInt(process.env.COOBOC_GEAR_PACKET_TIMEOUT_THRESHOLD) : 400;

    private _lastCommMillis: number = 0;
    private _packetOffset: number = 0;
    private _packetBuffer: Buffer = Buffer.alloc(PACKET_LENGTH);

    constructor() {
        this.millis = this.millis.bind(this);
        this.decode = this.decode.bind(this);
        this.splitPacket = this.splitPacket.bind(this);
        this.validatePacket = this.validatePacket.bind(this);
        this.decodePacket = this.decodePacket.bind(this);
    }
    private readonly millis = (): number => {
        const time: [number, number] = process.hrtime();
        return time[0] * 1000 + time[1] / 1000;
    }

    private readonly splitPacket = (buffer: Buffer, callback: DecoderCallbackType): void => {
        for (let i = 0; i < buffer.length; ++i) {
            const byte: number = buffer[i];
            if (this._packetOffset == 0) {
                // Search for packet header
                if (byte === PACKET_HEADER) {
                    this._packetBuffer[0] = byte;
                    this._packetOffset++;
                }
            } else {
                this._packetBuffer[this._packetOffset] = byte;
                this._packetOffset++;
                if (this._packetOffset == PACKET_LENGTH) {
                    this._packetOffset = 0;
                    this.validatePacket(callback);
                }
            }
        }
    };

    private readonly validatePacket = (callback: DecoderCallbackType): void => {
        let actualCrc: number = this._packetBuffer.readUint16BE(PACKET_OFFSET_CRC);
        this._packetBuffer.writeUint16BE(0, PACKET_OFFSET_CRC);
        const expectCrc: number = calculateCrc(this._packetBuffer);
        if (actualCrc === expectCrc) {
            this.decodePacket(callback);
        }
    }

    private readonly decodePacket = (callback: DecoderCallbackType): void => {
        callback({
            attr: this._packetBuffer.readUInt8(PACKET_OFFSET_ATTR) as PacketAttr,
            id: this._packetBuffer.readUint16BE(PACKET_OFFSET_ID),
            type: this._packetBuffer.readUint16BE(PACKET_OFFSET_TYPE) as PacketType,
            payload: this._packetBuffer.subarray(PACKET_OFFSET_PAYLOAD, PACKET_OFFSET_PAYLOAD_END)
        });
    }

    readonly decode = (buffer: Buffer, callback: DecoderCallbackType): void => {
        const currentMillis: number = this.millis();
        if ((currentMillis - this._lastCommMillis) > this.PACKET_TIMEOUT_THRESHOLD) {
            this._packetOffset = 0;
        }
        this._lastCommMillis = currentMillis;

        this.splitPacket(buffer, callback);
    };
};

