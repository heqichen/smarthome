import Express from "express";
import Config from "../config";
import Http from "http";
import { Server as SocketIO } from "socket.io";

export type UIEventCallback_ = (dat: any) => void;


export default class UI {
    private readonly _onUiEventCallback: UIEventCallback_;
    private readonly _app: Express.Express;
    private readonly _httpServer: Http.Server;
    private readonly _socketIo: SocketIO;


    private readonly _router: Express.Router = Express.Router();



    constructor(callback: UIEventCallback_) {
        this._onUiEventCallback = callback;
        this._app = Express();
        this._httpServer = Http.createServer(this._app);
        this._socketIo = new SocketIO(this._httpServer);

        this.start = this.start.bind(this);

        // this._router.use(Express.json);

        this._router.get("/on", (req: Express.Request, resp: Express.Response) => {
            this._onUiEventCallback(true);
            resp.send({ "result": true });
        });

        this._router.get("/off", (req: Express.Request, resp: Express.Response) => {
            this._onUiEventCallback(false);
            resp.send({ "result": true });
        });

        this._socketIo.on("connection", (socket:any) => {
            console.log(" a socket io client come");
        })


        this._app.use("/api", this._router);
        this._app.use("/", Express.static("./static/"));

    }

    readonly start = (): Promise<void> => {
        return new Promise<void>((resolve: () => void, reject: () => void): void => {
            // this._app.listen(Config.UI_PORT, () => {
            //     console.log("Start on port.", Config.UI_PORT);
            //     resolve();
            // });
            this._httpServer.listen(Config.UI_PORT, () => {
                console.log("Start on port.", Config.UI_PORT);
                resolve();
            });
        });
    };
}

