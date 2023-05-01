import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app: express.Express = express();
let port: number = process.env.PORT ? parseInt(process.env.PORT) : -1;

if (port <= 0) {
    console.log("invalid port use 8080");
    port = 8080;
}


// app.get('/', (req: express.Request, res: express.Response) => {
//     res.send('Express + TypeScript Server');
// });

const router: express.Router = express.Router();
// router.use(bodyParser.json());
router.use(express.json());

router.get("/test", (req: express.Request, resp: express.Response) => {
    resp.send({ "result": true });
});


app.use("/api", router);
app.use("/", express.static("./static/"));

console.log("process.env.cwd", process.env.PWD);

app.listen(port, () => {
    console.log("Start on port.", port);
});
