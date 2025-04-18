import type { SongAttributesExtensionMap, SongAttributesExtensionTypes } from "./extensions.js";
import type { Artwork, EditorialNotes, PlayParameters, Preview } from "./extras.js";
// import type { SongAttributesRelationshipMap, SongAttributesRelationshipTypes } from "./relationships.js";

export type SongAttributes<
    T extends SongAttributesExtensionTypes,
    // U extends SongAttributesRelationshipTypes
> = {
    albumName: string
    artistName: string
    artwork: Artwork
    attribution?: string
    composerName?: string
    contentRating?: string
    discNumber?: number
    durationInMillis: number
    editorialNotes?: EditorialNotes
    genreNames: string[]
    hasLyrics: boolean
    isAppleDigitalMaster: boolean
    isrc?: string
    movementCount?: number
    movementName?: string
    movementNumber?: number
    name: string
    playParams?: PlayParameters
    previews: Preview[]
    releaseDate?: string
    trackNumber?: number
    url: string
    workName?: string
}
    & Pick<SongAttributesExtensionMap, T[number]>
    // & Pick<SongAttributesRelationshipMap, U[number]>
