import { config } from "./config.js";
import process from "node:process";
import * as log from "./log.js";
import { appleMusicApi } from "./api/index.js";
import { app } from "./web/index.js";

await appleMusicApi.login().catch((err) => {
    log.error("failed to login to apple music api");
    log.error(err);
    process.exit(1);
}).finally(() => {
    log.info("logged in to apple music api");
});

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
