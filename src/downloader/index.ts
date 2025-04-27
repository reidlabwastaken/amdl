import { config } from "../config.js";
import { spawn } from "node:child_process";
import path from "node:path";
import { addToCache, isCached } from "../cache.js";

// TODO: make this have a return type
export async function downloadSong(streamUrl: string, decryptionKey: string): Promise<void> {
    const baseOutputName = streamUrl.split("/").at(-1)?.split("?").at(0)?.split(".").splice(0, 1).join(".")?.trim();
    if (!baseOutputName) { throw "could not get base output name from stream url"; }
    const encryptedName = baseOutputName + "_enc.mp4";
    const encryptedPath = path.join(config.downloader.cache.directory, encryptedName);
    const decryptedName = baseOutputName + ".mp4";
    const decryptedPath = path.join(config.downloader.cache.directory, decryptedName);

    if ( // TODO: remove check for encrypted file/cache for encrypted?
        isCached(encryptedName) &&
        isCached(decryptedName)
    ) { return; }

    await new Promise<void>((res, rej) => {
        const child = spawn(config.downloader.ytdlp_path, [
            "--quiet",
            "--no-warnings",
            "--allow-unplayable-formats",
            "--fixup", "never",
            "--paths", config.downloader.cache.directory,
            "--output", encryptedName,
            streamUrl
        ]).on("error", (err) => { rej(err); });
        child.stderr.on("data", (chunk) => { rej(chunk); });
        child.on("exit", () => { res(); });
    });

    await new Promise<void>((res, rej) => {
        const child = spawn(config.downloader.ffmpeg_path, [
            "-loglevel", "error",
            "-y",
            "-decryption_key", decryptionKey,
            "-i", encryptedPath,
            "-c", "copy",
            "-movflags", "+faststart",
            decryptedPath
        ]).on("error", (err) => { rej(err); });
        child.stderr.on("data", (chunk) => { rej(chunk); });
        child.on("exit", () => { res(); } );
    });

    addToCache(encryptedName);
    addToCache(decryptedName);
}
