
import net from "net";
import CoobocGearAuthenticator from "./cooboc_gear_authenticator";
import { CoobocGearType } from "./def";

export default class CoobocGearManager {
    private readonly _server: net.Server = net.createServer();

    constructor() {
        this.start = this.start.bind(this);
        this.newConnectionHandler = this.newConnectionHandler.bind(this);
    }

    private readonly newConnectionHandler = (conn: net.Socket): void => {
        const remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
        console.log("client come");
        const auth = new CoobocGearAuthenticator(conn);
        auth.authenticate().then((gear: CoobocGearType) => {
            console.log("a gear connected", gear);
        }).catch((reason: string) => {
            console.log("auth failed, reason: [", reason, "]");
        });
    }

    readonly start = (): Promise<void> => {
        this._server.on("connection", this.newConnectionHandler);
        return new Promise<void>((resolve: () => void, reject: () => void): void => {
            this._server.listen(8113, () => {
                console.log('server listening to %j', this._server.address());
            });
            resolve();
        });
    }
};