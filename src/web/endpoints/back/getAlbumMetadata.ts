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

// see comments in `getTrackMetadata.ts`
// awawawawawa
router.get("/getAlbumMetadata", async (req, res, next) => {
    try {
        const { id } = (await validate(req, schema)).query;

        const albumMetadata = await appleMusicApi.getAlbum(id);

        res.json(albumMetadata);
    } catch (err) {
        next(err);
    }
});

export default router;
