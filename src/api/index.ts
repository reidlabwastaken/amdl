import { config, env } from "../config.js";
import AppleMusicApi from "./appleMusicApi.js";
import ItunesApi from "./itunesApi.js";

export const appleMusicApi = new AppleMusicApi(env.ITUA, config.downloader.api.language, env.MEDIA_USER_TOKEN);
export const itunesApi = new ItunesApi(env.ITUA, config.downloader.api.language);
