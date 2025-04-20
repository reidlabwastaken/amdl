import { LicenseType, Session } from "node-widevine";
import { env } from "../config.js";
import { appleMusicApi } from "../api/index.js";
import { dataUriToBuffer } from "data-uri-to-buffer";
import * as log from "../log.js";
import fs from "node:fs";
import * as psshTools from "pssh-tools";

export async function getWidevineDecryptionKey(psshDataUri: string, trackId: string): Promise<void> {
    let pssh = Buffer.from(dataUriToBuffer(psshDataUri).buffer);

    const privateKey = Buffer.from(env.WIDEVINE_PRIVATE_KEY, "base64");
    const identifierBlob = Buffer.from(env.WIDEVINE_CLIENT_ID, "base64");
    let session = new Session({ privateKey, identifierBlob }, pssh);

    let challenge: Buffer;
    try {
        challenge = session.createLicenseRequest(LicenseType.STREAMING);
    } catch (err) {
        // for some reason, if gotten from a webplayback manifest, the pssh is in a completely different format
        // well, somewhat. we have to rebuild the pssh
        const rebuiltPssh = psshTools.widevine.encodePssh({
            contentId: "Hiiii", // lol?? i don't know what this is, random slop go!!!!
            dataOnly: false,
            keyIds: [Buffer.from(dataUriToBuffer(psshDataUri).buffer).toString("hex")]
        });

        log.warn("pssh was invalid, treating it as raw data");
        log.warn("this should not error, unless the pssh data is invalid, too");

        pssh = Buffer.from(rebuiltPssh, "base64");
        session = new Session({ privateKey, identifierBlob }, pssh);
        challenge = session.createLicenseRequest(LicenseType.STREAMING);
    }

    const response = await appleMusicApi.getWidevineLicense(
        trackId,
        psshDataUri,
        challenge.toString("base64")
    );

    if (typeof response?.license !== "string") { throw "license is missing or not a string! sign that authentication failed (unsupported codec?)"; }
    const license = session.parseLicense(Buffer.from(response.license, "base64"));
    if (license.length === 0) { throw "license(s) failed to be parsed. this could be an error for invalid data! (e.x. pssh/challenge)"; }

    log.info(license);
    fs.writeFileSync("license", response.license, { encoding: "utf-8" });
}
