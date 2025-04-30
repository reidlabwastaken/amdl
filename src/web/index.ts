import * as log from "../log.js";
import express, { type NextFunction, type Request, type Response } from "express";
import { engine } from "express-handlebars";

import dlTrackMetadata from "./endpoints/back/dlTrackMetadata.js";
import dlWebplayback from "./endpoints/back/dlWebplayback.js";
import getTrackMetadata from "./endpoints/back/getTrackMetadata.js";
import search from "./endpoints/front/search.js";

export class HttpException extends Error {
    public readonly status?: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

const app = express();

app.set("trust proxy", ["loopback", "uniquelocal"]);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use("/", express.static("public"));

app.use(dlTrackMetadata);
app.use(dlWebplayback);
app.use(getTrackMetadata);
app.use(search);

app.use((req, _res, next) => {
    next(new HttpException(404, `${req.path} not found`));
});

app.use((err: HttpException, _req: Request, res: Response, _next: NextFunction) => {
    if (!err.status || err.status % 500 < 100) {
        log.error(err);
    }

    const status = err.status ?? 500;
    const message = err.message;

    res.status(status).send(message);
});

export { app };
