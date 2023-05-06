import GearManager from "./gmm";


const gm = new GearManager();

gm.onGearConnected(() => { });
gm.onGearDisconnected(() => { });

gm.start().then(() => {
    console.log("gm started");
});


