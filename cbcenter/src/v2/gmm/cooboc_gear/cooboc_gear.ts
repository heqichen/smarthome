import CoobocGearEncoder from "./cooboc_gear_encoder";
import { CoobocGearSignatureType, PACKET_OFFSET_ID, PacketAttr, PacketType, millis } from "./def";
import net from "net";
import Config from "../../config";
import CoobocGearDecoder, { CoobocGearPacketType, DecoderCallbackType } from "./cooboc_gear_decoder";
import { ifError } from "assert";

export type GearDisconnectedCallbackType = (id: string, reason: string) => void;

export default class CoobocGear {
    private readonly _signature;
    private readonly _conn: net.Socket;
    private readonly _heartbeatInterval: NodeJS.Timeout;
    private readonly _decoder: CoobocGearDecoder = new CoobocGearDecoder();
    private _isGood: boolean = true;

    // For health check
    private _heartbeatRequestId: number = -1;
    private _heartbeatRequestTime: number = -1;
    private _badHeartbeatCount: number = 0;
    private _pingpongTime: number = -1;

    private readonly _gearDisconnectedCallback: GearDisconnectedCallbackType;
    constructor(signature: CoobocGearSignatureType, conn: net.Socket, disconnectedCallback: GearDisconnectedCallbackType) {
        this._signature = signature;
        this._conn = conn;
        this._gearDisconnectedCallback = disconnectedCallback;
        this.onPacket = this.onPacket.bind(this);
        this.exterminate = this.exterminate.bind(this);
        this.isGood = this.isGood.bind(this);
        this.getId = this.getId.bind(this);


        this._heartbeatInterval = setInterval(() => {
            const packet: Buffer = CoobocGearEncoder.buildHeartbeatPacket();
            if (this._heartbeatRequestId >= 0) {
                this._badHeartbeatCount++;
                console.log("bad heartbeat: ", this._badHeartbeatCount);
                if (this._badHeartbeatCount >= Config.COOBOC_GEAR_HEARTBEAT_BROWNOUT_COUNT) {
                    this._conn.destroy();
                }
            }
            this._heartbeatRequestId = packet.readUint16BE(PACKET_OFFSET_ID);
            this._heartbeatRequestTime = millis();
            this._conn.write(packet);
        }, Config.COOBOC_GEAR_HEARTBEAT_INTERVAL);

        this._conn.setTimeout(Config.COOBOC_GEAR_CONN_DATA_TIMEOUT);


        this._conn.on("data", (buffer: Buffer) => {
            this._decoder.decode(buffer, this.onPacket)
        });
        this._conn.on("close", this.exterminate("conn closed"));
        this._conn.on("end", this.exterminate("conn end"));
        this._conn.on("timeout", this.exterminate("conn timeout"));
    }

    private readonly exterminate = (reason: string): () => void => {
        return (): void => {
            if (this._isGood) {
                console.log("conn stopped :", reason);
                clearInterval(this._heartbeatInterval);
                this._isGood = false;
                this._conn.destroy();
                this._gearDisconnectedCallback(this._signature.id, reason);
            }
        };
    }

    private readonly onPacket: DecoderCallbackType = (packet: CoobocGearPacketType): void => {
        if (packet.type === PacketType.HEARTBEAT) {
            this.checkHeartbeatEcho(packet);
            this._badHeartbeatCount = 0;
        }

    }

    private readonly checkHeartbeatEcho = (packet: CoobocGearPacketType): void => {
        const isPacketAttrCorrect: boolean = packet.attr === PacketAttr.RESPONSE;
        if (isPacketAttrCorrect) {
            if (this._heartbeatRequestTime >= 0) {
                this._pingpongTime = (this._heartbeatRequestId === packet.id) ? (millis() - this._heartbeatRequestTime) : -1;
            }

            this._heartbeatRequestId = -1;
            this._heartbeatRequestTime = -1;
        }
        console.log(packet);
        console.log("ping: ", this._pingpongTime.toFixed(0), "ms");

    }
    readonly isGood = (): boolean => {
        return this._isGood;
    }

    readonly getId = (): string => {
        return this._signature.id;
    }

    readonly end = (): void => {
        clearInterval(this._heartbeatInterval);
        this._isGood = false;
        this._conn.destroy();
    }



};