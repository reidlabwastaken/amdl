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
            baseURL: ampApiUrl,
            headers: {
                "Media-User-Token": mediaUserToken,
                "Origin": appleMusicHomepageUrl
            },
            params: {
                "l": language
            }
        });
    }

    public async login(): Promise<void> {
        this.http.defaults.headers["Authorization"] = `Bearer ${await getToken(appleMusicHomepageUrl)}`;
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
    ): Promise<string> {
        return (await this.http.post(licenseApiUrl, {
            params: {
                challenge: challenge,
                "key-system": "com.widevine.alpha",
                uri: trackUri,
                adamId: trackId,
                isLibrary: false,
                "user-initiated": true
            }
        })).data;
    }
}
