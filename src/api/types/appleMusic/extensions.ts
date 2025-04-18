export type AnyAttributesExtentionType = SongAttributesExtensionMap;

export type SongAttributesExtensionType = keyof SongAttributesExtensionMap;
export type SongAttributesExtensionTypes = SongAttributesExtensionType[];
export type SongAttributesExtensionMap = {
    artistUrl: string,
    // does not seem to work
    // is documented though,, will leave optional?
    audioVariants?: string[],
    // undocumented !! awesome !!
    extendedAssetUrls: {
        plus: string,
        lightweight: string
        superLightweight: string
        lightweightPlus: string
        enhancedHls: string
    }
}
