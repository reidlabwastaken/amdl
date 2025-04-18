import axios, { type AxiosInstance } from "axios";
import storefrontMappings from "../constants/storefrontMappings.js";

export default class ItunesApi {
    private storefront: string;
    private language: string;
    private http: AxiosInstance;

    public constructor(
        storefront: string,
        language: string
    ) {
        const storefrontCode = storefrontMappings.find((storefrontMapping) => storefrontMapping.code.toLowerCase() === storefront.toLowerCase())?.storefrontId;
        if (!storefrontCode) { throw new Error(`failed matching storefront id for storefront: ${storefront}`); }

        this.storefront = storefront;
        this.language = language;
        this.http = axios.create({
            headers: {
                // this SUCKSSSS lmao
                // why did apple do that
                "X-Apple-Store-Front": storefrontCode
            },
            params: {
                "country": storefront,
                "lang": language
            }
        });
    }
}
