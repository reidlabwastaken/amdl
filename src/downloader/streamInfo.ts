import { appleMusicApi } from "../api/index.js";
import * as log from "../log.js";
import type { SongAttributes } from "../api/types/appleMusic/attributes.js";
import hls, { Item } from "parse-hls";
import axios from "axios";
import { getWidevineDecryptionKey } from "./keygen.js";
import { widevine, playready, fairplay } from "../constants/keyFormats.js";
import { songCodecRegex } from "../constants/codecs.js";
import type { WebplaybackResponse } from "api/appleMusicApi.js";
import { downloadSong, RegularCodec, WebplaybackCodec } from "./index.js";

// why is this private
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

export default class StreamInfo {
    public readonly trackId: string;
    public readonly streamUrl: string;
    public readonly widevinePssh: string | undefined;
    public readonly playreadyPssh: string | undefined;
    public readonly fairplayKey: string | undefined;

    private constructor(
        trackId: string,
        streamUrl: string,
        widevinePssh: string | undefined,
        playreadyPssh: string | undefined,
        fairplayKey: string | undefined
    ) {
        this.trackId = trackId;
        this.streamUrl = streamUrl;
        this.widevinePssh = widevinePssh;
        this.playreadyPssh = playreadyPssh;
        this.fairplayKey = fairplayKey;
    }

    // TODO: why can't we decrypt widevine ones with this?
    // we get a valid key.. but it doesn't work :-(
    public static async fromTrackMetadata(trackMetadata: SongAttributes<["extendedAssetUrls"]>, codec: RegularCodec): Promise<StreamInfo> {
        log.warn("the track metadata method is experimental, and may not work or give correct values!");
        log.warn("if there is a failure--use a codec that uses the webplayback method");

        const m3u8Url = trackMetadata.extendedAssetUrls.enhancedHls;
        const m3u8 = await axios.get(m3u8Url, { responseType: "text" });
        const m3u8Parsed = hls.default.parse(m3u8.data);

        const drmInfos = getDrmInfos(m3u8Parsed);
        const assetInfos = getAssetInfos(m3u8Parsed);
        const playlist = await getPlaylist(m3u8Parsed, codec);
        const variantId = playlist.properties[0].attributes.stableVariantId;
        if (variantId === undefined) { throw "variant id does not exist!"; }
        if (typeof variantId !== "string") { throw "variant id is not a string!"; }
        const drmIds = assetInfos[variantId]["AUDIO-SESSION-KEY-IDS"];

        const widevinePssh = getWidevinePssh(drmInfos, drmIds);
        const playreadyPssh = getPlayreadyPssh(drmInfos, drmIds);
        const fairplayKey = getFairplayKey(drmInfos, drmIds);

        const trackId = trackMetadata.playParams?.id;
        if (trackId === undefined) { throw "track id is missing, this may indicate your song isn't accessable w/ your subscription!"; }

        return new StreamInfo(
            trackId,
            m3u8Url, // TODO: make this keep in mind the CODEC, yt-dlp will shit itself if not supplied i think
            widevinePssh,
            playreadyPssh,
            fairplayKey
        );
    }

    // webplayback is the more "legacy" way
    // only supports widevine, from what i can tell
    public static async fromWebplayback(webplayback: WebplaybackResponse, codec: WebplaybackCodec): Promise<StreamInfo> {
        const song = webplayback.songList[0];

        let flavor: string;
        if (codec === WebplaybackCodec.AacHeLegacy) { flavor = "32:ctrp64"; }
        else if (codec === WebplaybackCodec.AacLegacy) { flavor = "28:ctrp256"; }

        const asset = song.assets.find((asset) => { return asset.flavor === flavor; });
        if (asset === undefined) { throw "webplayback info for requested flavor doesn't exist!"; }

        const trackId = song.songId;

        const m3u8Url = asset.URL;
        const m3u8 = await axios.get(m3u8Url, { responseType: "text" });
        const m3u8Parsed = hls.default.parse(m3u8.data);

        const widevinePssh =  m3u8Parsed.lines.find((line) => { return line.name === "key"; })?.attributes?.uri;
        if (widevinePssh === undefined) { throw "widevine uri is missing!"; }
        if (typeof widevinePssh !== "string") { throw "widevine uri is not a string!"; }

        // afaik this ONLY has widevine
        return new StreamInfo(
            trackId,
            m3u8Url,
            widevinePssh,
            undefined,
            undefined
        );
    }
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
            if (!value) { throw "could not match for drm key value!"; }
            if (!value[1]) { throw "drm key value is empty!"; }

            return JSON.parse(Buffer.from(value[1], "base64").toString("utf-8"));
        }
    }

    throw "m3u8 missing audio session key info!";
}

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

// SUPER TODO: remove inquery for the codec, including its library, this is for testing
// add a config option for preferred codec ?
// or maybe in the streaminfo function
async function getPlaylist(m3u8Data: M3u8, codec: RegularCodec): Promise<Item> {
    const masterPlaylists = m3u8Data.streamRenditions;
    const masterPlaylist = masterPlaylists.find((playlist) => {
        const line = playlist.properties[0].attributes?.audio;
        if (line === undefined) { return false; }
        if (typeof line !== "string") { return false; }
        const match = line.match(songCodecRegex[codec]);
        return match !== null;
    });

    if (masterPlaylist === undefined) { throw "no master playlist for codec found!"; }

    return masterPlaylist;
}

function getDrmData(drmInfos: DrmInfos, drmIds: string[], drmKey: string): string | undefined {
    const drmInfoEntry = drmIds.find((drmId) => {
        const entry = drmInfos[drmId];
        return drmId !== "1" && entry?.[drmKey];
    });

    if (drmInfoEntry === undefined) { return undefined; }

    const drmInfo = drmInfos[drmInfoEntry];
    return drmInfo[drmKey].URI;
}

const getWidevinePssh = (drmInfos: DrmInfos, drmIds: string[]): string | undefined => getDrmData(drmInfos, drmIds, widevine);
const getPlayreadyPssh = (drmInfos: DrmInfos, drmIds: string[]): string | undefined => getDrmData(drmInfos, drmIds, playready);
const getFairplayKey = (drmInfos: DrmInfos, drmIds: string[]): string | undefined => getDrmData(drmInfos, drmIds, fairplay);

// TODO: remove later, this is just for testing
// const streamInfo2 = await StreamInfo.fromTrackMetadata((await appleMusicApi.getSong("1615276490")).data[0].attributes, RegularCodec.Aac);

const streamCodec1 = WebplaybackCodec.AacLegacy;
const streamInfo1 = await StreamInfo.fromWebplayback(await appleMusicApi.getWebplayback("1705366148"), streamCodec1);
if (streamInfo1.widevinePssh !== undefined) {
    await downloadSong(
        streamInfo1.streamUrl,
        await getWidevineDecryptionKey(streamInfo1.widevinePssh, streamInfo1.trackId),
        streamCodec1
    );
}

// try {
//     const streamCodec2 = RegularCodec.AacHe;
//     const streamInfo2 = await StreamInfo.fromTrackMetadata((await appleMusicApi.getSong("1705366148")).data[0].attributes, streamCodec2);
//     if (streamInfo2.widevinePssh !== undefined) {
//         await downloadSong(
//             streamInfo2.streamUrl,
//             await getWidevineDecryptionKey(streamInfo2.widevinePssh, streamInfo2.trackId),
//             streamCodec2
//         );
//     }
// } catch (err) {
//     log.error("failed to download song");
//     log.error(err);
// }
