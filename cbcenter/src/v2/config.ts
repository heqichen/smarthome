import dotenv from "dotenv";
dotenv.config();


const Config = {
    UI_PORT: process.env.UI_PORT ? parseInt(process.env.UI_PORT) : 8080,
    COOBOC_GEAR_CONN_DATA_TIMEOUT: process.env.COOBOC_GEAR_CONN_DATA_TIMEOUT ? parseInt(process.env.COOBOC_GEAR_CONN_DATA_TIMEOUT) : 10000,
    COOBOC_GEAR_AUTHENTICATION_TIMEOUT: process.env.COOBOC_GEAR_AUTHENTICATION_TIMEOUT ? parseInt(process.env.COOBOC_GEAR_AUTHENTICATION_TIMEOUT) : 200,
    COOBOC_GEAR_PACKET_TIMEOUT_THRESHOLD: process.env.COOBOC_GEAR_PACKET_TIMEOUT_THRESHOLD ? parseInt(process.env.COOBOC_GEAR_PACKET_TIMEOUT_THRESHOLD) : 400,
    COOBOC_GEAR_HEARTBEAT_INTERVAL: process.env.COOBOC_GEAR_HEARTBEAT_INTERVAL ? parseInt(process.env.COOBOC_GEAR_HEARTBEAT_INTERVAL) : 3000,
    COOBOC_GEAR_HEARTBEAT_BROWNOUT_COUNT: process.env.COOBOC_GEAR_HEARTBEAT_BROWNOUT_COUNT ? parseInt(process.env.COOBOC_GEAR_HEARTBEAT_BROWNOUT_COUNT) : 3,

};

export default Config;