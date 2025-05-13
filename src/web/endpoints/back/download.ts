import { getWidevineDecryptionKey } from "../../../downloader/keygen.js";
import { downloadSong, RegularCodec, WebplaybackCodec } from "../../../downloader/index.js";
import express from "express";
import StreamInfo from "../../../downloader/streamInfo.js";
import { appleMusicApi } from "../../../appleMusicApi/index.js";
import { z } from "zod";
import { validate } from "../../validate.js";

const router = express.Router();

const schema = z.object({
    query: z.object({
        id: z.string(),
        codec: z.nativeEnum(RegularCodec).or(z.nativeEnum(WebplaybackCodec))
    })
});

// TODO: support more encryption schemes
// TODO: some type of agnostic-ness for the encryption schemes on regular codec
// TODO: make it less ugly,, hahahiwehio
router.get("/download", async (req, res, next) => {
    try {
        const { id, codec } = (await validate(req, schema)).query;

        // TODO: write helper function for this
        // or make it a class so we can use `instanceof`
        const regularCodec = Object.values(RegularCodec).find((c) => { return c === codec; });
        const webplaybackCodec = Object.values(WebplaybackCodec).find((c) => { return c === codec; });
        if (regularCodec === undefined && webplaybackCodec === undefined) { res.status(400).send("codec is invalid!"); return; }

        if (regularCodec !== undefined) {
            const trackMetadata = await appleMusicApi.getSong(id);
            const trackAttributes = trackMetadata.data[0].attributes;
            const streamInfo = await StreamInfo.fromTrackMetadata(trackAttributes, regularCodec);
            if (streamInfo.widevinePssh !== undefined) {
                const decryptionKey = await getWidevineDecryptionKey(streamInfo.widevinePssh, streamInfo.trackId);
                const filePath = await downloadSong(streamInfo.streamUrl, decryptionKey, regularCodec);
                res.download(filePath);
            } else {
                res.status(400).send("no decryption key found!");
            }
        } else if (webplaybackCodec !== undefined) {
            const webplaybackResponse = await appleMusicApi.getWebplayback(id);
            const streamInfo = await StreamInfo.fromWebplayback(webplaybackResponse, webplaybackCodec);
            if (streamInfo.widevinePssh !== undefined) {
                const decryptionKey = await getWidevineDecryptionKey(streamInfo.widevinePssh, streamInfo.trackId);
                const filePath = await downloadSong(streamInfo.streamUrl, decryptionKey, webplaybackCodec);
                res.download(filePath);
            } else {
                res.status(400).send("no decryption key found!");
            }
        }
    } catch (err) {
        next(err);
    }
});

export default router;
