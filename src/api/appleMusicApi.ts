import axios, { type AxiosInstance } from "axios";
import { ampApiUrl, appleMusicHomepageUrl, licenseApiUrl, webplaybackApiUrl } from "../constants/urls.js";
import type { GetSongResponse } from "./types/appleMusic/responses.js";
import type { SongAttributesExtensionTypes } from "./types/appleMusic/extensions.js";
import { getToken } from "./token.js";
import { config } from "../config.js";

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

    async getSong<
        T extends SongAttributesExtensionTypes = ["extendedAssetUrls"]
    > (
        id: string,
        extend: T = ["extendedAssetUrls"] as T
    ): Promise<GetSongResponse<T>> {
        return (await this.http.get<GetSongResponse<T>>(`/v1/catalog/${this.storefront}/songs/${id}`, {
            params: {
                extend: extend.join(",")
            }
        })).data;
    }

    async getWebplayback(
        trackId: string
    ): Promise<unknown> {
        return (await this.http.post(webplaybackApiUrl, {
            salableAdamId: trackId,
            language: config.downloader.api.language
        })).data;
    }

    async getWidevineLicense(
        trackId: string,
        trackUri: string,
        challenge: string
    ): Promise<{ license: string | undefined }> {
        return (await this.http.post(licenseApiUrl, {
            challenge: challenge,
            "key-system": "com.widevine.alpha",
            uri: trackUri,
            adamId: trackId,
            isLibrary: false,
            "user-initiated": true
        }, { headers: {
            // do these do anything.
            "x-apple-music-user-token": this.http.defaults.headers.common["Media-User-Token"],
            "x-apple-renewal": true
        }})).data;
    }
}
