import * as net from 'net';
import SocketClient, { GearSignature } from "./socket_client";
import ClientPool from "./client_pool";
import { Payload } from './gear_talk';

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

