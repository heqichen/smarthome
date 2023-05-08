import CoobocGearEncoder from "./cooboc_gear_encoder";
import { CoobocGearSignatureType } from "./def";
import net from "net";
import Config from "../../config";

export type GearDisconnectedCallbackType = (id: string, reason: string) => void;

export default class CoobocGear {
    private readonly _signature;
    private readonly _conn: net.Socket;
    private readonly _heartbeatInterval: NodeJS.Timeout;
    private _isGood: boolean = true;
    private readonly _gearDisconnectedCallback: GearDisconnectedCallbackType;
    constructor(signature: CoobocGearSignatureType, conn: net.Socket, disconnectedCallback: GearDisconnectedCallbackType) {
        this._signature = signature;
        this._conn = conn;
        this._gearDisconnectedCallback = disconnectedCallback;

        this.exterminate = this.exterminate.bind(this);
        this.sendRequestAckPacket = this.sendRequestAckPacket.bind(this);
        this.isGood = this.isGood.bind(this);
        this.getId = this.getId.bind(this);

        this._heartbeatInterval = setInterval(() => {
            console.log("heartbeat");
            this.sendRequestAckPacket();
            const packet: Buffer = CoobocGearEncoder.buildHeartbeatPacket();
            this._conn.write(packet);
        }, Config.COOBOC_GEAR_HEARTBEAT_INTERVAL);
        console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW");
        console.log(Config.COOBOC_GEAR_HEARTBEAT_INTERVAL);

        this._conn.setTimeout(Config.COOBOC_GEAR_CONN_DATA_TIMEOUT);


        // this._conn.on("data", this.onConnectionDataCallback);
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

    private readonly sendRequestAckPacket = (): void => {

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