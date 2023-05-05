import net from 'net';

export default class CoobocGearAuthenticator {
    constructor() {
        this.authenticate = this.authenticate.bind(this);
    }

    authenticate = (conn: net.Socket): Promise<void> => {
        return new Promise<void>((resolve: () => void, reject: () => void) => {
            // TODO:
            resolve();
        });
    }
};