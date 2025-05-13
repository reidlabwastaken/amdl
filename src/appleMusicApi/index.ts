import axios, { type AxiosInstance } from "axios";
import { ampApiUrl, appleMusicHomepageUrl, licenseApiUrl, webplaybackApiUrl } from "../constants/urls.js";
import type { GetSongResponse, SearchResponse } from "./types/responses.js";
import type { AlbumAttributesExtensionTypes, AnyAttributesExtensionTypes, SongAttributesExtensionTypes } from "./types/extensions.js";
import { getToken } from "./token.js";
import { config, env } from "../config.js";
import { HttpException } from "../web/index.js";
import type { RelationshipTypes } from "./types/relationships.js";

export default class AppleMusicApi {
    private storefront: string;
    private http: AxiosInstance;

    public constructor(
        storefront: string,
        language: string,
        mediaUserToken: string
    ) {
        this.storefront = storefront;
        this.http = axios.create({
            baseURL: ampApiUrl
        });

        this.http.defaults.headers.common["Origin"] = appleMusicHomepageUrl;
        this.http.defaults.headers.common["Media-User-Token"] = mediaUserToken;

        // yeah dude. awesome
        // https://stackoverflow.com/a/54636780
        this.http.defaults.params = {};
        this.http.defaults.params["l"] = language;
    }

    public async login(): Promise<void> {
        this.http.defaults.headers.common["Authorization"] = `Bearer ${await getToken(appleMusicHomepageUrl)}`;
    }

    async getAlbum<
        T extends AlbumAttributesExtensionTypes = [],
        U extends RelationshipTypes<T> = ["tracks"]
    > (
        id: string,
        extend: T = [] as unknown[] as T,
        relationships: U = ["tracks"] as U
    ): Promise<GetSongResponse<T, U>> {
        return (await this.http.get<GetSongResponse<T, U>>(`/v1/catalog/${this.storefront}/albums/${id}`, {
            params: {
                extend: extend.join(","),
                include: relationships.join(",")
            }
        })).data;
    }

    async getSong<
        // TODO: possibly make this any, and use the addScopingParameters function?
        // would be a bit cleaner, almost everywhere, use above in `getAlbum` perchancibly
        T extends SongAttributesExtensionTypes = ["extendedAssetUrls"],
        U extends RelationshipTypes<T> = ["albums"]
    > (
        id: string,
        extend: T = ["extendedAssetUrls"] as T,
        relationships: U = ["albums"] as U
    ): Promise<GetSongResponse<T, U>> {
        return (await this.http.get<GetSongResponse<T, U>>(`/v1/catalog/${this.storefront}/songs/${id}`, {
            params: {
                extend: extend.join(","),
                include: relationships.join(",")
            }
        })).data;
    }

    // TODO: add support for other types / abstract it for other types
    // i don't think we will use em, but completeness is peam
    async search<
        T extends AnyAttributesExtensionTypes = [],
        U extends RelationshipTypes<T> = ["tracks"]
    > (
        term: string,
        limit: number = 25,
        offset: number = 0,
        extend: T = [] as unknown[] as T,
        relationships: U = ["tracks"] as U
    ): Promise<SearchResponse<T, U>> {
        return (await this.http.get(`/v1/catalog/${this.storefront}/search`, {
            params: {
                ...this.addScopingParameters("albums", relationships, extend),
                ...{
                    term: term,
                    types: ["albums", "songs"].join(","), // adding "songs" makes search results have albums when searching song name
                    limit: limit,
                    offset: offset,
                    extend: extend.join(","),
                    include: relationships.join(",")
                }
            }
        })).data;
    }

    async getWebplayback(
        trackId: string
    ): Promise<WebplaybackResponse> {
        // this is one of those endpoints that returns a 200
        // no matter what happens, even if theres an error
        // so we gotta do this stuuuupid hack
        // TODO: find a better way to do this
        const res = await this.http.post(webplaybackApiUrl, {
            salableAdamId: trackId,
            language: config.downloader.api.language
        });

        if (res.data?.failureType === "3077") {
            throw new HttpException(404, "track not found");
        } else if (res.data?.failureType !== undefined) {
            throw new HttpException(500, `upstream webplayback api error: ${res.data.failureType}`);
        }

        return res.data;
    }

    async getWidevineLicense(
        trackId: string,
        trackUri: string,
        challenge: string
    ): Promise<WidevineLicenseResponse> {
        return (await this.http.post(licenseApiUrl, {
            challenge: challenge,
            "key-system": "com.widevine.alpha",
            uri: trackUri,
            adamId: trackId,
            isLibrary: false,
            "user-initiated": true
        }, { headers: {
            // do these do anything.
            // i'm including them anyway,,
            "x-apple-music-user-token": this.http.defaults.headers.common["Media-User-Token"],
            "x-apple-renewal": true
        }})).data;
    }

    // helper function to automatically add scoping parameters
    // this is so i don't have to make those work in typescript
    addScopingParameters(
        names: string | string[],
        relationships: string[],
        extend: string[]
    ): { [scope: string]: string } {
        const params: { [scope: string]: string } = {};

        for (const name of Array.isArray(names) ? names : [names]) {
            for (const relationship of relationships) { params[`include[${name}]`] = relationship; }
            for (const extendType of extend) { params[`extend[${names}]`] = extendType; }
        }

        return params;
    }
}

export const appleMusicApi = new AppleMusicApi(env.ITUA, config.downloader.api.language, env.MEDIA_USER_TOKEN);

// these are super special types
// i'm not putting this in the ./types folder.
// maybe ltr bleh
export type WebplaybackResponse = { songList: { assets: { flavor: string, URL: string }[], songId: string }[] };
export type WidevineLicenseResponse = { license: string | undefined };
