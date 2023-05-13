import GearManager from "./gmm";


const gm = new GearManager();

gm.onGearConnected(() => { });
gm.onGearDisconnected(() => { });

gm.start().then(() => {
    console.log("gm started");
});


let bulb: boolean = false;
setInterval(() => {
    const targetValue = bulb ? 1 : 0;
    bulb = !bulb;
    gm.setOutputValue("3JSM700", 1, targetValue);
}, 5000);