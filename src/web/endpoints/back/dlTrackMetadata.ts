import { getWidevineDecryptionKey } from "../../../downloader/keygen.js";
import { downloadSong, RegularCodec } from "../../../downloader/index.js";
import express from "express";
import StreamInfo from "../../../downloader/streamInfo.js";
import { appleMusicApi } from "../../../api/index.js";

const router = express.Router();

// TODO: support more encryption schemes
// TODO: some type of agnostic-ness for the encryption keys
router.get("/dlTrackMetadata", async (req, res, next) => {
    try {
        const { trackId, codec } = req.query;
        if (typeof trackId !== "string") { res.status(400).send("trackId is required and must be a string!"); return; }
        if (typeof codec !== "string") { res.status(400).send("codec is required and must be a string!"); return; }

        const c = Object.values(RegularCodec).find((c) => { return c === codec; });
        if (c === undefined) { res.status(400).send("codec is invalid!"); return; }

        const trackMetadata = await appleMusicApi.getSong(trackId);
        const trackAttributes = trackMetadata.data[0].attributes;
        const streamInfo = await StreamInfo.fromTrackMetadata(trackAttributes, c);
        if (streamInfo.widevinePssh !== undefined) {
            const decryptionKey = await getWidevineDecryptionKey(streamInfo.widevinePssh, streamInfo.trackId);
            const filePath = await downloadSong(streamInfo.streamUrl, decryptionKey, c);
            res.download(filePath);
        } else {
            res.status(400).send("no decryption key found!");
        }
    } catch (err) {
        next(err);
    }
});

export default router;
