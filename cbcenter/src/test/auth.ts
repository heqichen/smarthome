import * as net from "net";





function calculateCrc(buf: Buffer): number {
    let crc: number = 0;
    for (let i = 0; i < buf.length; ++i) {
        const byte: number = buf[i];
        crc ^= byte;
        if (crc & 0x01) {
            crc = (crc << 1) ^ 0xA001;
        } else {
            crc = (crc << 1);
        }
        crc = crc & 0x00FFFF;
    }
    return crc;
}





const netOpt: net.SocketConnectOpts = {
    port: 8113,
    host: "localhost"
};
const socket: net.Socket = new net.Socket();
socket.connect(netOpt, () => {
    console.log('TCP connection established with the server.');
    socket.on("data", (data: Buffer) => {
        console.log("data: ", data);
        const actualCrc = data.readUint16BE(14);
        data[14] = 0;
        data[15] = 0;
        const expectCrc: number = calculateCrc(data);
        console.log("actual crc: ", actualCrc, "  expect crc: ", expectCrc);

        data[1] |= 0x01;
        // data[2]++;
        data.writeUint8(3, 6);
        data.write("12345678", 7, 7, "utf-8");
        console.log(data);
        const crc: number = calculateCrc(data);
        data.writeUint16BE(crc, 14);
        setTimeout(() => {
            socket.write(data);
        }, (1950));

    });
});