import fs from "node:fs";
import * as log from "./log.js";
import toml from "toml";
import { z, ZodError, ZodSchema } from "zod";
import * as dotenv from "dotenv";
import { fromZodError } from "zod-validation-error";

dotenv.config();

const configSchema = z.object({
    server: z.object({
        port: z.number().int().min(0).max(65535).or(z.string())
    }),
    downloader: z.object({
        cache_dir: z.string(),
        api: z.object({
            language: z.string()
        })
    })
});

const envSchema = z.object({
    MEDIA_USER_TOKEN: z.string(),
    ITUA: z.string(),
    WIDEVINE_CLIENT_ID: z.string(),
    WIDEVINE_PRIVATE_KEY: z.string()
});

// check that `config.toml` actually exists
// if `config.example.toml` doesn't exist(?), error out
// if `config.toml` doesn't exist, copy over `comfig.example.toml` to `config.toml`
let defaultConfig = false;
if (!fs.existsSync("config.toml")) {
    if (!fs.existsSync("config.example.toml")) {
        log.error("config.toml AND config.example.toml not found?? stop this tomfoolery at once");
        process.exit(1);
    }
    log.warn("using default config; this may result in unexpected behavior!");
    fs.copyFileSync("config.example.toml", "config.toml");
    defaultConfig = true;
}

/**
 * @param schema the zod schema to use
 * @param something the thing to load the schema from--either a **file path to a toml file** or **an object** (e.g. process.env)
 * @returns the inferred type of the schema
 */
function loadSchemaSomething<T extends ZodSchema>(schema: T, something: string | unknown): z.infer<T> {
    try {
        if (typeof something === "string") {
            return schema.parse(toml.parse(fs.readFileSync(something, "utf-8")));
        } else {
            return schema.parse(something);
        }
    } catch (err) {
        // zod errors are kind of Ugly by default
        // this will make it look (a little) better for the end user
        if (err instanceof ZodError) { err = fromZodError(err); }

        log.error("error loading schema", err);
        process.exit(1);
    }
}

export const config = loadSchemaSomething(configSchema, "config.toml");
log.debug("config loaded");
export const env = loadSchemaSomething(envSchema, process.env);
log.debug("env loaded");

// check that the cache directory exists
// if it doesn't, create it
if (!fs.existsSync(config.downloader.cache_dir)) {
    log.debug("cache directory not found, creating it");
    if (defaultConfig) { log.warn("using default config; generated cache directory may not be favorable!");}
    fs.mkdirSync(config.downloader.cache_dir, { recursive: true });
}
