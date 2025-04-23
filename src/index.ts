import { config } from "./config.js";
import express, { type NextFunction, type Request, type Response } from "express";
import process from "node:process";
import * as log from "./log.js";
import { appleMusicApi } from "./api/index.js";

class HttpException extends Error {
    public readonly status?: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

const app = express();

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

// TODO: reorganize this
// a bit gugly..

await appleMusicApi.login().catch((err) => {
    log.error("failed to login to apple music api");
    log.error(err);
    process.exit(1);
});
log.debug("logged in to apple music api");

try {
    const listener = app.listen(config.server.port, () => {
        const address = listener.address();

        // okay, afaik, this is (theoretically) completely unreachable
        // if you're listening, you have to have an address
        if (address === null) { process.exit(1); }

        else if (typeof address === "string") { log.info(`hosting on unix://${address}`); }
        else { log.info(`hosting on http://localhost:${address.port}`); }
    });
} catch (err) {
    log.error("failed to start server");
    log.error(err);
    process.exit(1);
}

process.on("uncaughtException", (err) => {
    log.error("uncaught exception!");
    log.error(err);
    process.exit(1);
});
process.on("unhandledRejection", (err) => {
    log.error("unhandled rejection!");
    log.error(err);
    process.exit(1);
});

// TODO: remove later
// this is for testing purposes
await import("./downloader/streamInfo.js");
await import("./cache.js");
