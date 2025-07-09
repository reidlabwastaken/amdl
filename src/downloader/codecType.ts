import { z } from "zod";

export const regularCodecTypeSchema = z.enum([
    "aac",
    "aac_he",
    "aac_binaural",
    "aac_downmix",
    "aac_he_binaural",
    "aac_he_downmix",
    "atmos",
    "ac3",
    "alac"
]);
export const webplaybackCodecTypeSchema = z.enum([
    "aac_legacy",
    "aac_he_legacy"
]);

export type RegularCodecType = z.infer<typeof regularCodecTypeSchema>;
export type WebplaybackCodecType = z.infer<typeof webplaybackCodecTypeSchema>;

export class CodecType {
    public readonly codecType: RegularCodecType | WebplaybackCodecType;
    public readonly regularOrWebplayback: "regular" | "webplayback";

    constructor(codecType: string) {
        const regularCheck = regularCodecTypeSchema.safeParse(codecType);
        const webplaybackCheck = webplaybackCodecTypeSchema.safeParse(codecType);

        if (regularCheck.success) {
            this.regularOrWebplayback = "regular";
            this.codecType = regularCheck.data;
        } else if (webplaybackCheck.success) {
            this.regularOrWebplayback = "webplayback";
            this.codecType = webplaybackCheck.data;
        } else {
            throw new Error(`invalid codec type: ${codecType}!`);
        }
    }
}
