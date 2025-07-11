import { appleMusicApi } from "../../../appleMusicApi/index.js";
import express from "express";
import { validate } from "../../validate.js";
import { z } from "zod";

const router = express.Router();

const schema = z.object({
    query: z.object({
        id: z.string()
    })
});

// this endpoint isn't actually used for anything by us
// it's for people who want to implement apple music downloading into their own apps (ex. discord music bot)
// it makes it a bit easier to get the metadata for a track knowing the trackId
router.get("/getTrackMetadata", async (req, res, next) => {
    try {
        const { id } = (await validate(req, schema)).query;

        const trackMetadata = await appleMusicApi.getSong(id);

        res.json(trackMetadata);
    } catch (err) {
        next(err);
    }
});

export default router;
