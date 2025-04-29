import { RegularCodec } from "../downloader/index.js";

export const songCodecRegex: { [key in RegularCodec]: RegExp } = {
    [RegularCodec.Aac]: /audio-stereo-\d+/,
    [RegularCodec.AacHe]: /audio-HE-stereo-\d+/,
    [RegularCodec.AacBinaural]: /audio-stereo-\d+-binaural/,
    [RegularCodec.AacDownmix]: /audio-stereo-\d+-downmix/,
    [RegularCodec.AacHeBinaural]: /audio-HE-stereo-\d+-binaural/,
    [RegularCodec.AacHeDownmix]: /audio-HE-stereo-\d+-downmix/,
    [RegularCodec.Atmos]: /audio-atmos-.*/,
    [RegularCodec.Ac3]: /audio-ac3-.*/,
    [RegularCodec.Alac]: /audio-alac-.*/
};
