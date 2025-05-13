import { LicenseType, Session } from "node-widevine";
import { env } from "../config.js";
import { appleMusicApi } from "../appleMusicApi/index.js";
import { dataUriToBuffer } from "data-uri-to-buffer";
import psshTools from "pssh-tools";
import * as log from "../log.js";

export async function getWidevineDecryptionKey(psshDataUri: string, trackId: string): Promise<string> {
    let pssh = Buffer.from(dataUriToBuffer(psshDataUri).buffer);

    const privateKey = Buffer.from(env.WIDEVINE_PRIVATE_KEY, "base64");
    const identifierBlob = Buffer.from(env.WIDEVINE_CLIENT_ID, "base64");
    let session = new Session({ privateKey, identifierBlob }, pssh);

    let challenge: Buffer;
    try {
        challenge = session.createLicenseRequest(LicenseType.STREAMING);
    } catch (err) {
        // for some reason, if gotten from a webplayback manifest, the pssh is in a completely different format
        // well, somewhat. it's just the raw data, we have to rebuild the pssh
        const rebuiltPssh = psshTools.widevine.encodePssh({
            contentId: "meow", // this actually isn't even needed, but this library is somewhat-stubborn
            dataOnly: false,
            keyIds: [Buffer.from(dataUriToBuffer(psshDataUri).buffer).toString("hex")]
        });

        log.warn("pssh was invalid, treating it as raw data (this is expected in the webplayback manifest)");
        log.warn("this should not throw an error, unless the pssh data is actually invalid");

        pssh = Buffer.from(rebuiltPssh, "base64");
        session = new Session({ privateKey, identifierBlob }, pssh);
        challenge = session.createLicenseRequest(LicenseType.STREAMING);
    }

    const response = await appleMusicApi.getWidevineLicense(
        trackId,
        psshDataUri,
        challenge.toString("base64")
    );

    if (typeof response?.license !== "string") { throw new Error("license is gone/not a string! maybe auth failed (unsupported codec?)"); }
    const license = session.parseLicense(Buffer.from(response.license, "base64"));
    if (license.length === 0) { throw new Error("license(s) can't parse. this may be an error showing invalid data! (ex. pssh/challenge)"); }

    const validKey = license.find((keyPair) => { return keyPair?.key?.length === 32; })?.key;
    if (validKey === undefined) { throw new Error("no valid key found in license!"); }
    return validKey;
}
