import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import * as log from "./log.js";

interface CacheEntry {
    fileName: string;
    expiry: number;
}

const ttl = config.downloader.cache.ttl * 1000;
const file = path.join(config.downloader.cache.directory, "cache.json");

if (!fs.existsSync(config.downloader.cache.directory)) {
    log.debug("cache directory not found, creating it");
    fs.mkdirSync(config.downloader.cache.directory, { recursive: true });
}
if (!fs.existsSync(file)) {
    log.debug("cache file not found, creating it");
    fs.writeFileSync(file, JSON.stringify([]), { encoding: "utf-8" });
}

// SUPER TODO: implement this
