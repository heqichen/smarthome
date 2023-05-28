import Cosh from "../../../v2/automation/cosh";


console.log("wtf");
const cosh: Cosh = new Cosh();
cosh.addTimeAutomation(1, { "hour": 21, "minute": 31, "second": 20 }, { "channelId": "d", "value": 3 });

setTimeout(() => {
    cosh.debug();
}, 3000);