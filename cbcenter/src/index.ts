import * as net from 'net';
import SocketClient from "./socket_client";




// Setup Server
const server: net.Server = net.createServer();
server.on('connection', (conn: net.Socket): void => {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    
    const socketClient: SocketClient = new SocketClient(conn);

    socketClient.authenticate().then(() => {
        // TODO
        console.log("good");
    }).catch((reason: any) => {
        console.log(`client ${remoteAddress} not allowed ${reason}`);
        socketClient.drop();
    });
});



server.listen(8113, () => {
    console.log('server listening to %j', server.address());
});

