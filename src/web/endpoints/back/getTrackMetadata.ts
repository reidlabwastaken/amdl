import { appleMusicApi } from "../../../api/index.js";
import express from "express";

const router = express.Router();

// this endpoint isn't actually used for anything by us
// it's for people who want to implement apple music downloading into their own apps
// it makes it a bit easier to get the metadata for a track knowing the trackId
router.get("/getTrackMetadata", async (req, res, next) => {
    try {
        const { trackId } = req.query;
        if (typeof trackId !== "string") { res.status(400).send("trackId is required and must be a string!"); return; }

        const trackMetadata = await appleMusicApi.getSong(trackId);
        const trackAttributes = trackMetadata.data[0].attributes;

        res.json(trackAttributes);
    } catch (err) {
        next(err);
    }
});

export default router;
