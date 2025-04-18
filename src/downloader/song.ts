import { appleMusicApi } from "../api/index.js";
import * as log from "../log.js";
import type { SongAttributes } from "../api/types/appleMusic/attributes.js";
import hls, { Item } from "parse-hls";
import axios from "axios";
// TODO: remove
import { select } from "@inquirer/prompts";

// ugliest type ever
// this library is so bad
// i wish pain on the person who wrote this /j :smile:
type HLS = ReturnType<typeof hls.default.parse>;

// TODO: whole big thing, and a somewhat big issue
// some files can just Not be downloaded
// this is because only the fairplay (com.apple.streamingkeydelivery) key is present
// and no other drm schemes exist..
// however... there is still widevine ones ???? just tucked away... REALLY WELL
// https://github.com/glomatico/gamdl/blob/main/gamdl/downloader_song_legacy.py#L27
// bullshit, i tell you.
// havent had this issue with the small pool i tested before late 2024. what ????
// i don't get it.
// i just tried another thing from 2022 ro 2023 and it worked fine

// SUPER TODO: turn this all into a streaminfo class

// this typing is dubious...
// TODO: possibly just stop using an array; use union type on generic
// TODO: add "legacy" fallback
async function getStreamInfo(trackMetadata: SongAttributes<["extendedAssetUrls"]>): Promise<void> {
    const m3u8Url = trackMetadata.extendedAssetUrls.enhancedHls;
    const m3u8 = await axios.get(m3u8Url, { responseType: "text" });
    const m3u8Parsed = hls.default.parse(m3u8.data);

    const drmInfos = getDrmInfos(m3u8Parsed);
    const assetInfos = getAssetInfos(m3u8Parsed);
    const playlist = await getPlaylist(m3u8Parsed);
    const variantId = playlist.properties[0].attributes.stableVariantId;
    if (typeof variantId !== "string") { throw "variant id does not exist or is not a string!"; }
    const drmIds = assetInfos[variantId]["AUDIO-SESSION-KEY-IDS"];

    const widevinePssh = getWidevinePssh(drmInfos, drmIds);
    const playreadyPssh = getPlayreadyPssh(drmInfos, drmIds);
    const fairplayKey = getFairplayKey(drmInfos, drmIds);

    log.debug("widevine pssh", widevinePssh);
    log.debug("playready pssh", playreadyPssh);
    log.debug("fairplay key", fairplayKey);
}

// i don't think i wanna write all of the values we need. annoying !
type DrmInfos = { [key: string]: { [key: string]: { "URI": string } }; };
function getDrmInfos(m3u8Data: HLS): DrmInfos {
    // see `getAssetInfos` for the reason why this is so bad
    // filthy. i should write my own m3u8 library that doesn't suck balls
    for (const line of m3u8Data.lines) {
        if (
            line.name === "sessionData" &&
            line.content.includes("com.apple.hls.AudioSessionKeyInfo")
        ) {
            const value = line.content.match(/VALUE="([^"]+)"/);
            if (!value) { throw "could not match for value!"; }

            return JSON.parse(Buffer.from(value[1], "base64").toString("utf-8"));
        }
    }

    throw "m3u8 missing audio session key info!";
}

// TODO: remove inquery for the codec, including its library, this is for testing
// add a config option for preferred codec ?
async function getPlaylist(m3u8Data: HLS): Promise<Item> {
    const masterPlaylists = m3u8Data.streamRenditions;
    const masterPlaylist = await select({
        message: "codec ?",
        choices: masterPlaylists.map((playlist) => ({
            name: playlist.properties[0].attributes.audio as string,
            value: playlist
        }))
    });

    return masterPlaylist;
}

// TODO: check type more strictly
// does it really exist? we never check,,
// i don't think i wanna write all of the values we need. annoying !
type AssetInfos = { [key: string]: { "AUDIO-SESSION-KEY-IDS": string[]; }; }
function getAssetInfos(m3u8Data: HLS): AssetInfos {
    // LOL??? THIS LIBRARY IS SO BAD
    // YOU CAN'T MAKE THIS SHIT UP
    // https://files.catbox.moe/ac0ps4.jpg
    for (const line of m3u8Data.lines) {
        if (
            line.name === "sessionData" &&
            line.content.includes("com.apple.hls.audioAssetMetadata")
        ) {
            const value = line.content.match(/VALUE="([^"]+)"/);
            if (!value) { throw "could not match for value!"; }

            return JSON.parse(Buffer.from(value[1], "base64").toString("utf-8"));
        }
    }

    throw "m3u8 missing audio asset metadata!";
}

function getDrmData(drmInfos: DrmInfos, drmIds: string[], drmKey: string): string {
    const drmInfoEntry = drmIds.find((drmId) => {
        const entry = drmInfos[drmId];
        return drmId !== "1" && entry?.[drmKey];
    });

    if (drmInfoEntry === undefined) { throw `requested drm key (${drmKey}) not found!`; }

    const drmInfo = drmInfos[drmInfoEntry];
    return drmInfo[drmKey].URI; // afaik this index is 100% safe?
}

const getWidevinePssh = (drmInfos: DrmInfos, drmIds: string[]): string => getDrmData(drmInfos, drmIds, "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed");
const getPlayreadyPssh = (drmInfos: DrmInfos, drmIds: string[]): string => getDrmData(drmInfos, drmIds, "com.microsoft.playready");
const getFairplayKey = (drmInfos: DrmInfos, drmIds: string[]): string => getDrmData(drmInfos, drmIds, "com.apple.streamingkeydelivery");

// TODO: remove later, this is just for testing
log.debug(await appleMusicApi.getWebplayback("1758429584"));
await getStreamInfo((await appleMusicApi.getSong("1758429584")).data[0].attributes);

