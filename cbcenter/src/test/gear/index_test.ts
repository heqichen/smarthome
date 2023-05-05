import GearManager from "../../gear/index";

const gm: GearManager = new GearManager();


gm.onGearConnected((name: string) => {
    console.log("[", name, "] connected");
});

gm.begin().then(() => { }).catch((e) => { });

// Test interface
gm.listGearNames();