import * as net from 'net';
import SocketClient, { GearSignature } from "./socket_client";
import ClientPool from "./client_pool";
import { Payload } from './gear_talk';
import Uiserver from "./uiserver/index";


const clientPool: ClientPool = new ClientPool();

// Setup Server
const server: net.Server = net.createServer();
server.on('connection', (conn: net.Socket): void => {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    console.log("client come");
    const socketClient: SocketClient = new SocketClient(conn);
    socketClient.authenticate().then((payload: Payload) => {
        // TODO
        console.log("good", payload);
        const signature: GearSignature = {
            type: payload.readUInt8(0),
            id: payload.toString("utf-8", 1)
        };
        console.log(signature);
        clientPool.push(socketClient, signature);

    }).catch((reason: any) => {
        console.log(`client ${remoteAddress} not allowed ${reason}`);
        socketClient.drop();
    });
});

server.listen(8113, () => {
    console.log('server listening to %j', server.address());
});

let targetValue: number = 0;


const uiCallback: (dat: any) => void = (dat: any): void => {
    const value: number = dat ? 1 : 0;
    // 3JSM700 socket
    // HWP7000 test esp-01
    clientPool.setSingleValue("3JSM700", 1, value);


}

const uiserver: Uiserver = new Uiserver(uiCallback);

// setInterval(() => {
//     if (targetValue === 0) {
//         targetValue = 1;
//     } else {
//         targetValue = 0;
//     }

//     // 3JSM700 socket
//     // HWP7000 test esp-01
//     clientPool.setSingleValue("3JSM700", 1, targetValue);

// }, 200);
