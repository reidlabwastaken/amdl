import * as log from "../log.js";
import express, { type NextFunction, type Request, type Response } from "express";
import { create } from "express-handlebars";
import formatDuration from "format-duration";
import { back, front } from "./endpoints/index.js";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { AxiosError } from "axios";
import { env } from "../config.js";

export class HttpException extends Error {
    public readonly status?: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

const app = express();
const hbs = create({
    helpers: {
        add(a: number, b: number) { return a + b; },
        arrayJoin(array: string[], separator: string) { return array.join(separator); },
        formatDuration(duration: number) { return formatDuration(duration); },
        greaterThan(a: number, b: number) { return a > b; },
        mapNumberToLetter(num: number) { return String.fromCharCode(num + 64); } // A = 1, B = 2
    }
});

app.set("trust proxy", ["loopback", "uniquelocal"]);

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", env.VIEWS_DIR);

app.use("/", express.static(env.PUBLIC_DIR));
app.get("/favicon.ico", (_req, res) => { res.status(301).location("/favicon.png").send(); });

back.forEach((route) => { app.use("/api", route); });
front.forEach((route) => { app.use(route); });

app.use((req, _res, next) => {
    next(new HttpException(404, `${req.path} not found`));
});

// ex. if the apple music api returns a 403, we want to return a 403
// this is so damn useful, i'm so glad i thought of this
app.use((err: AxiosError, _req: Request, _res: Response, next: NextFunction) => {
    if (err instanceof AxiosError && err.response) {
        const status = err.response.status;
        const message = `upstream api error: ${err.response.status}`;

        next(new HttpException(status, message));
    } else {
        next(err);
    }
});

// make more readable zod error messages
// helps a lot imo
app.use((err: ZodError, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        const formattedErr = fromZodError(err);

        const status = 400;
        const message = formattedErr.message;

        if (req.originalUrl.startsWith("/api/")) {
            res.status(status).send(message);
        } else {
            next(new HttpException(status, message));
        }
    } else {
        next(err);
    }
});

app.use((err: HttpException, req: Request, res: Response, _next: NextFunction) => {
    if (!err.status || (err.status >= 500 && err.status < 600)) {
        log.error("internal server error");
        log.error(err);
    }

    const status = err.status ?? 500;
    const message = err.message;

    if (req.originalUrl.startsWith("/api/")) {
        res.status(status).send(message);
    } else {
        res.status(status).render("error", {
            title: "uh oh..",
            status: status,
            message: message
        });
    }
});

export { app };
