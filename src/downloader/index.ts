import { config } from "../config.js";
import { spawn } from "node:child_process";
import path from "node:path";
import { addToCache, isCached } from "../cache.js";

export async function downloadSong(streamUrl: string, decryptionKey: string, songCodec: RegularCodec | WebplaybackCodec): Promise<string> {
    let baseOutputName = streamUrl.match(/(?:.*\/)\s*(\S*?)[.?]/)?.[1];
    if (!baseOutputName) { throw new Error("could not get base output name from stream url!"); }
    baseOutputName += `_${songCodec}`;
    const encryptedName = baseOutputName + "_enc.mp4";
    const encryptedPath = path.join(config.downloader.cache.directory, encryptedName);
    const decryptedName = baseOutputName + ".mp4";
    const decryptedPath = path.join(config.downloader.cache.directory, decryptedName);

    if ( // TODO: remove check for encrypted file/cache for encrypted?
        isCached(encryptedName) &&
        isCached(decryptedName)
    ) { return decryptedPath; }

    await new Promise<void>((res, rej) => {
        const child = spawn(config.downloader.ytdlp_path, [
            "--quiet",
            "--no-warnings",
            "--allow-unplayable-formats",
            "--fixup", "never",
            "--paths", config.downloader.cache.directory,
            "--output", encryptedName,
            streamUrl
        ]);
        child.on("error", (err) => { rej(err); });
        child.stderr.on("data", (data) => { rej(new Error(data.toString().trim())); });
        child.on("exit", () => { res(); });
    });

    addToCache(encryptedName);

    await new Promise<void>((res, rej) => {
        const child = spawn(config.downloader.ffmpeg_path, [
            "-loglevel", "error",
            "-y",
            "-decryption_key", decryptionKey,
            "-i", encryptedPath,
            "-c", "copy",
            "-movflags", "+faststart",
            decryptedPath
        ]);
        child.on("error", (err) => { rej(err); });
        child.stderr.on("data", (data) => { rej(new Error(data.toString().trim())); });
        child.on("exit", () => { res(); } );
    });

    addToCache(decryptedName);

    return decryptedPath;
}

// TODO: find a better spot for this
export enum RegularCodec {
    Aac = "aac",
    AacHe = "aac_he",
    AacBinaural = "aac_binaural",
    AacDownmix = "aac_downmix",
    AacHeBinaural = "aac_he_binaural",
    AacHeDownmix = "aac_he_downmix",
    Atmos = "atmos",
    Ac3 = "ac3",
    Alac = "alac"
}

export enum WebplaybackCodec {
    AacLegacy = "aac_legacy",
    AacHeLegacy = "aac_he_legacy"
}
