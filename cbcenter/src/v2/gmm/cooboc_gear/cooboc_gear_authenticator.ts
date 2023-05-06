import net from "net";
import CoobocGearProtocol from "./cooboc_gear_encoder";



export default class CoobocGearAuthenticator {
    private readonly AUTHENTICATION_TIMEOUT: number = process.env.COOBOC_GEAR_AUTHENTICATION_TIMEOUT ? parseInt(process.env.COOBOC_GEAR_AUTHENTICATION_TIMEOUT) : 200;

    private readonly _conn: net.Socket;
    private _authTimeout: NodeJS.Timeout | undefined;

    private _resolve: () => void = () => { };
    private _reject: (reason: string) => void = () => { };

    constructor(conn: net.Socket) {
        this._conn = conn;

        this.authenticate = this.authenticate.bind(this);
        this.onConnectionDataCallback = this.onConnectionDataCallback.bind(this);
    }

    private readonly onAuthBad = (reason: string): (() => void) => {
        return () => {
            clearTimeout(this._authTimeout);
            this._conn.destroy();
            this._reject(reason);
        };
    }

    private readonly onConnectionDataCallback = (buffer: Buffer): void => {
        console.log("on client data: ", buffer);
        clearTimeout(this._authTimeout);
    }

    readonly authenticate = (): Promise<void> => {
        return new Promise<void>((resolve: () => void, reject: (reason: string) => void) => {
            this._resolve = resolve;
            this._reject = reject;
            this._authTimeout = setTimeout(() => {
                this.onAuthBad("auth timeout")();
            }, this.AUTHENTICATION_TIMEOUT);
            this._conn.setTimeout(parseInt(process.env.COOBOC_GEAR_CONN_DATA_TIMEOUT ? process.env.COOBOC_GEAR_CONN_DATA_TIMEOUT : "2000"));
            this._conn.on("data", this.onConnectionDataCallback);
            this._conn.on("close", this.onAuthBad("conn closed"));
            this._conn.on("end", this.onAuthBad("conn end"));
            this._conn.on("timeout", this.onAuthBad("conn timeout"));

            const buf: Buffer = CoobocGearProtocol.buildAuthenticatePacket();
            this._conn.write(buf);
        });
    }

};