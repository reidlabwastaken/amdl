export type AnyAttributesExtensionType = AlbumAttributesExtensionType | SongAttributesExtensionType;
export type AnyAttributesExtensionTypes = AnyAttributesExtensionType[];

export type AlbumAttributesExtensionType = keyof AlbumAttributesExtensionMap;
export type AlbumAttributesExtensionTypes = AlbumAttributesExtensionType[];
export type AlbumAttributesExtensionMap = {
    artistUrl: string
    audioVariants?: string[]
}

export type SongAttributesExtensionType = keyof SongAttributesExtensionMap;
export type SongAttributesExtensionTypes = SongAttributesExtensionType[];
export type SongAttributesExtensionMap = {
    artistUrl: string,
    audioVariants?: string[],
    extendedAssetUrls: {
        plus: string,
        lightweight: string
        superLightweight: string
        lightweightPlus: string
        enhancedHls: string
    }
}
