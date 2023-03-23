
interface CoobocGear { };
// ['None','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor'];

class CoobocGearNone implements CoobocGear { };
const placeholderGear: CoobocGear = new CoobocGearNone();
class CoobocGear1Button implements CoobocGear {
    constructor(idStr: string) { }
};



function buildCoobocGear(type: number, id: string): CoobocGear {
    if (type == 0) {
        throw "type invalid";
    }
    return new CoobocGear1Button(id);
}