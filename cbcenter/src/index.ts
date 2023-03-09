import * as net  from 'net';


// Setup Server
const server : net.Server = net.createServer();
server.on('connection', (conn:net.Socket):void => {
    var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;  
    console.log('new client connection from %s', remoteAddress);

    conn.on('data', (data: Buffer):void => {
        console.log("got data", data);
    });
});



server.listen(8113, () => {
    console.log('server listening to %j', server.address());
});

