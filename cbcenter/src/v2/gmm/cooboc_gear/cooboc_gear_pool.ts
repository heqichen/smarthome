import CoobocGear from "./cooboc_gear"



export default class CoobocGearPool {
    private readonly _pool: Map<string, CoobocGear> = new Map<string, CoobocGear>();
    constructor() {
        this.insert = this.insert.bind(this)
        this._pool.clear();
    }

    readonly insert = async (cooboc: CoobocGear): Promise<void> => {
        const gearId: string = cooboc.getId();
        if (this._pool.has(gearId)) {
            throw (gearId + " already in the pool, reject the incoming one");
        }
        this._pool.set(gearId, cooboc);

    }

    readonly remove = (id: string): void => {
        if (this._pool.has(id)) {
            this._pool.delete(id);
        }
    }
    readonly getIdList = (): string[] => {
        return JSON.parse(JSON.stringify(Array.from(this._pool.keys()))) as string[]
    }
};