import GearManager from "./gmm";
import UI from "./ui";



const gm = new GearManager();

const onUiEvent = (dat: any) => {
    console.log("dat", dat);
    gm.setOutputValue("3JSM700", 1, dat ? 1 : 0);
}

const ui = new UI(onUiEvent);

gm.onGearConnected(() => { });
gm.onGearDisconnected(() => { });

gm.start().then(() => {
    console.log("gm started");
    ui.start().then(() => {
        console.log("ui started");
    });
});


// let bulb: boolean = false;
// setInterval(() => {
//     const targetValue = bulb ? 1 : 0;
//     bulb = !bulb;
//     gm.setOutputValue("3JSM700", 1, targetValue);
// }, 5000);