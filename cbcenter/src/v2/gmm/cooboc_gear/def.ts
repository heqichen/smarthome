export enum PacketType {
    AUTH = 0x0203,
    HEARTBEAT = 0x0631,
    USER_ACTION = 0x0707,
    SINGLE_VALUE = 0x0801,
};


export const PACKET_LENGTH: number = 16;
export const PACKET_HEADER: number = 0xA5;

export const PACKET_OFFSET_ATTR: number = 1;
export const PACKET_OFFSET_ID: number = 2;
export const PACKET_OFFSET_TYPE: number = 4;
export const PACKET_OFFSET_PAYLOAD: number = 6;
export const PACKET_OFFSET_PAYLOAD_END: number = 14;
export const PACKET_OFFSET_CRC: number = 14;

export enum PacketAttr {
    REQUEST_ACK = 0x00,
    RESPONSE = 0x01,
    REQUEST_WITHOUT_ACK = 0x02,

}
// export const PACKET_ATTR_REQUEST_ACK: number = 0x00;
// export const PACKET_ATTR_REQUEST_WITHOUT_ACK: number = 0x02;

/**
 *     0   1   2      3  4        5   6       ...      13   14 15
    ┌────┬────┬─────────┬───────────┬──────────┬──────────┬──────┐
    │0xA5│ATTR│PackID(2)│PackType(2)│PayloadLen│Payload(7)│CRC(2)│
    └────┴────┴─────────┴───────────┴──────────┴──────────┴──────┘
**/
export function calculateCrc(buf: Buffer): number {
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

export const millis = (): number => {
    const time: [number, number] = process.hrtime();
    return time[0] * 1000 + time[1] / 1000000;
}

// ['None','0-Test', '1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor'];

export enum CoobocGearTypeType {
    NONE = 0,
    TEST = 1,
    ONE_BUTTON = 2,
    TWO_BUTTON = 3,
    THREE_BUTTON = 4,
    FOUR_BUTTON = 5,
    SLOT = 6,
    HUMAN_EXISTENCE = 7,
    PIR = 8,
    WATER = 9,
    DOOR = 10,
    INVALID = 255
};

export const extractCoobocGearType = (uint8: number): CoobocGearTypeType => {
    if (uint8 >= 0 && uint8 <= CoobocGearTypeType.DOOR) {
        return uint8 as CoobocGearTypeType;
    }
    return CoobocGearTypeType.INVALID;
}



export type CoobocGearSignatureType = {
    id: string,
    type: CoobocGearTypeType,
};


// channel definition
// digital input number, 
// digital output number,


