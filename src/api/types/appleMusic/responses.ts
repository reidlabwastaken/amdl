// TODO: relationships
// this is a semi-reverse engineered type definition for the apple music API
// i don't, and never will, support [scoping parameters](https://developer.apple.com/documentation/applemusicapi/handling-resource-representation-and-relationships#Scoping-Parameters)
// there is a small chance i will add more endpoints

import type { SongAttributes } from "./attributes.js";
import type { SongAttributesExtensionTypes } from "./extensions.js";

// https://developer.apple.com/documentation/applemusicapi/get-a-catalog-song
export interface GetSongResponse<
    T extends SongAttributesExtensionTypes,
> {
    // https://developer.apple.com/documentation/applemusicapi/songs
    data: {
        id: string
        type: "songs"
        href: string
        // https://developer.apple.com/documentation/applemusicapi/songs/attributes-data.dictionary
        attributes: SongAttributes<T>
        // TODO: add relationships
        // https://developer.apple.com/documentation/applemusicapi/songs/relationships-data.dictionary
    }[]
}
