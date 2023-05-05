import net from 'net';
import { CoobocGear } from './cooboc_gear/types';
import CoobocGearAuthenticator from './cooboc_gear/authenticator';

type OnGearConnectedCallbackType = (name: string) => void;


export default class GearManager {
    private onGearConnectedCallback_: OnGearConnectedCallbackType = () => { };
    private coobocGearAuthenticator_: CoobocGearAuthenticator = new CoobocGearAuthenticator();

    // constructor() {
    //     this.onGearConnected = this.onGearConnected.bind(this);
    //     this.begin = this.begin.bind(this);
    //     this.listGearNames = this.listGearNames.bind(this);
    // }

    // onGearConnected = (callback: OnGearConnectedCallbackType): void => {
    //     this.onGearConnectedCallback_ = callback;
    // }

    /**
     * Setup network here
     */

    // begin = (): Promise<void> => {
    //     return new Promise<void>((resolve: () => void, reject: (reason: any) => void) => {
    //         // For Cooboc Gear
    //         const server: net.Server = net.createServer(); 24
    //         server.on('connection', (conn: net.Socket): void => {
    //             this.coobocGearAuthenticator_.authenticate(conn).then()

    //             const gear: CoobocGear = new CoobocGear(conn);


    //             const remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    //             console.log("client come");
    //             const socketClient: SocketClient = new SocketClient(conn);
    //             socketClient.authenticate().then((payload: Payload) => {
    //                 // TODO
    //                 console.log("good", payload);
    //                 const signature: GearSignature = {
    //                     type: payload.readUInt8(0),
    //                     id: payload.toString("utf-8", 1)
    //                 };
    //                 console.log(signature);
    //                 clientPool.push(socketClient, signature);

    //             }).catch((reason: any) => {
    //                 console.log(`client ${remoteAddress} not allowed ${reason}`);
    //                 socketClient.drop();
    //             });
    //         });

    //         server.listen(8113, () => {
    //             console.log('server listening to %j', server.address());
    //         });
    //     });
    // };

    listGearNames = (): string[] => {
        return [];
    }


};