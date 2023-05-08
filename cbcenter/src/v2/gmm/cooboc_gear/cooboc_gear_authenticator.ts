import net from "net";
import CoobocGearEncoder from "./cooboc_gear_encoder";
import CoobocGearDecoder, { CoobocGearPacketType, DecoderCallbackType } from "./cooboc_gear_decoder";
import { CoobocGearSignatureType, CoobocGearTypeType, PACKET_OFFSET_ID, PacketAttr, PacketType, extractCoobocGearType } from "./def";
import Config from "../../config";


export default class CoobocGearAuthenticator {
    private readonly _conn: net.Socket;
    private _authTimeout: NodeJS.Timeout | undefined = undefined;
    private _requestId: number = -139412349; // a random picked number, which is not exist in uint8

    private _resolve: (gear: CoobocGearSignatureType) => void = () => { };
    private _reject: (reason: string) => void = () => { };
    private readonly _decoder: CoobocGearDecoder = new CoobocGearDecoder();


    constructor(conn: net.Socket) {
        this._conn = conn;

        this.authenticate = this.authenticate.bind(this);
        this.onConnectionDataCallback = this.onConnectionDataCallback.bind(this);
        this.rejectAuthenticate = this.rejectAuthenticate.bind(this);
    }

    private readonly onDataCallback: DecoderCallbackType = (packet: CoobocGearPacketType) => {
        // validate the packet
        if (this._authTimeout === undefined) {
            this.rejectAuthenticate("authenticating not start yet, a hacking detected");
            return;
        }
        if (packet.id !== this._requestId) {
            this.rejectAuthenticate("request id not matches");
            return;
        }
        if (packet.attr !== PacketAttr.RESPONSE) {
            this.rejectAuthenticate("response attribute is invalid");
            return;
        }
        if (packet.type !== PacketType.AUTH) {
            this.rejectAuthenticate("response packet type is invalid");
            return;
        }
        const gearType: CoobocGearTypeType = extractCoobocGearType(packet.payload.readUint8(0));
        if (gearType === CoobocGearTypeType.INVALID) {
            this.rejectAuthenticate("response packet type is invalid");
            return;
        }

        const gearId = packet.payload.toString("utf-8", 1);
        const gear: CoobocGearSignatureType = {
            "id": gearId,
            "type": gearType
        }
        this.acceptAuthenticate(gear);



    };



    private readonly rejectAuthenticate = (reason: string): (() => void) => {
        return () => {
            clearTimeout(this._authTimeout);
            this._requestId = -139412349;
            this._conn.destroy();
            this._reject(reason);
        };
    }

    private readonly acceptAuthenticate = (gear: CoobocGearSignatureType): void => {
        clearTimeout(this._authTimeout);
        this._requestId = -139412349;
        this._resolve(gear);
    }


    private readonly onConnectionDataCallback = (buffer: Buffer): void => {
        this._decoder.decode(buffer, this.onDataCallback)
    }


    readonly authenticate = (): Promise<CoobocGearSignatureType> => {
        return new Promise<CoobocGearSignatureType>((resolve: (gear: CoobocGearSignatureType) => void, reject: (reason: string) => void) => {
            this._resolve = resolve;
            this._reject = reject;
            this._authTimeout = setTimeout(() => {
                this.rejectAuthenticate("auth timeout")();
            }, Config.COOBOC_GEAR_AUTHENTICATION_TIMEOUT);
            this._conn.setTimeout(Config.COOBOC_GEAR_CONN_DATA_TIMEOUT);
            this._conn.on("data", this.onConnectionDataCallback);
            this._conn.on("close", this.rejectAuthenticate("conn closed"));
            this._conn.on("end", this.rejectAuthenticate("conn end"));
            this._conn.on("timeout", this.rejectAuthenticate("conn timeout"));

            const buf: Buffer = CoobocGearEncoder.buildAuthenticatePacket();

            this._requestId = buf.readUint16BE(PACKET_OFFSET_ID);
            this._conn.write(buf);
        });
    }

};