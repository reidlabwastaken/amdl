import { appleMusicApi } from "../api/index.js";
import * as log from "../log.js";
import type { SongAttributes } from "../api/types/appleMusic/attributes.js";
import hls, { Item } from "parse-hls";
import axios from "axios";
import { getWidevineDecryptionKey } from "./keygen.js";
import { widevine, playready, fairplay } from "../constants/keyFormats.js";
import { select } from "@inquirer/prompts";

// ugliest type ever
// this library is so bad
// i wish pain on the person who wrote this /j :smile:
type M3u8 = ReturnType<typeof hls.default.parse>;

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
// SOLVED. widevine keys are not always present in the m3u8 manifest that is default (you can see that in link above, thats why it exists)
// OH. it doesn't seem to give the keys you want anyway LOLLLLLLL????
// i'm sure its used for *SOMETHING* so i'll keep it

// SUPER TODO: turn this all into a streaminfo class

// SUPER TODO: add "legacy", would use stuff from webplayback, default to this
// TODO: make widevine/fairplay optional (esp for above)
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

    const trackId = trackMetadata.playParams?.id;
    if (trackId === undefined) { throw "track id is missing, this may indicate your song isn't accessable w/ your subscription!"; }

    // TODO: make this a value in the class when we do that
    log.info(await getWidevineDecryptionKey(widevinePssh, trackId));
}

type DrmInfos = { [key: string]: { [key: string]: { "URI": string } }; };
function getDrmInfos(m3u8Data: M3u8): DrmInfos {
    // see `getAssetInfos` for the reason why this is so bad
    for (const line of m3u8Data.lines) {
        if (
            line.name === "sessionData" &&
            line.content.includes("com.apple.hls.AudioSessionKeyInfo")
        ) {
            const value = line.content.match(/VALUE="([^"]+)"/);
            if (!value) { throw "could not match for value!"; }
            if (!value[1]) { throw "value is empty!"; }

            return JSON.parse(Buffer.from(value[1], "base64").toString("utf-8"));
        }
    }

    throw "m3u8 missing audio session key info!";
}

// TODO: remove inquery for the codec, including its library, this is for testing
// add a config option for preferred codec ?
// or maybe in the streaminfo function
async function getPlaylist(m3u8Data: M3u8): Promise<Item> {
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
// filthy. i should write my own m3u8 library that doesn't suck balls
type AssetInfos = { [key: string]: { "AUDIO-SESSION-KEY-IDS": string[]; }; }
function getAssetInfos(m3u8Data: M3u8): AssetInfos {
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
            if (!value[1]) { throw "value is empty!"; }

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

const getWidevinePssh = (drmInfos: DrmInfos, drmIds: string[]): string => getDrmData(drmInfos, drmIds, widevine);
const getPlayreadyPssh = (drmInfos: DrmInfos, drmIds: string[]): string => getDrmData(drmInfos, drmIds, playready);
const getFairplayKey = (drmInfos: DrmInfos, drmIds: string[]): string => getDrmData(drmInfos, drmIds, fairplay);

// TODO: remove later, this is just for testing
// log.debug(await appleMusicApi.getWebplayback("1615276490"));
await getStreamInfo((await appleMusicApi.getSong("1615276490")).data[0].attributes);
