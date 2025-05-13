import express from "express";
import { validate } from "../../validate.js";
import { z } from "zod";
import { config } from "../../../config.js";

const router = express.Router();

const schema = z.object({
    query: z.object({
        id: z.string()
    })
});

router.get("/download", async (req, res, next) => {
    try {
        const { id } = (await validate(req, schema)).query;

        res.render("download", {
            title: "download",
            codecs: config.server.frontend.displayed_codecs,
            id: id
        });
    } catch (err) {
        next(err);
    }
});

export default router;
