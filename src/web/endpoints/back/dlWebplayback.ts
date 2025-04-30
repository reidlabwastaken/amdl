import { getWidevineDecryptionKey } from "../../../downloader/keygen.js";
import { downloadSong, WebplaybackCodec } from "../../../downloader/index.js";
import express from "express";
import StreamInfo from "../../../downloader/streamInfo.js";
import { appleMusicApi } from "../../../api/index.js";

const router = express.Router();

router.get("/dlWebplayback", async (req, res, next) => {
    try {
        const { trackId, codec } = req.query;
        if (typeof trackId !== "string") { res.status(400).send("trackId is required and must be a string!"); return; }
        if (typeof codec !== "string") { res.status(400).send("codec is required and must be a string!"); return; }

        const c = Object.values(WebplaybackCodec).find((c) => { return c === codec; });
        if (c === undefined) { res.status(400).send("codec is invalid!"); return; }

        // TODO: check if this returns an error
        const webplaybackResponse = await appleMusicApi.getWebplayback(trackId);
        console.log(webplaybackResponse);
        const streamInfo = await StreamInfo.fromWebplayback(webplaybackResponse, c);
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
