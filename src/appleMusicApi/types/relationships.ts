// you will shit yourself if you don't read this:
// required reading: https://developer.apple.com/documentation/applemusicapi/handling-resource-representation-and-relationships

import type { AlbumAttributes, SongAttributes } from "./attributes.js";
import type { AlbumAttributesExtensionTypes, AnyAttributesExtensionTypes, SongAttributesExtensionTypes } from "./extensions.js";

// TODO: have something like this for every resource
export type Relationship<T> = {
    href?: string;
    next?: string;
    data: {
        // TODO: there is extra types here (id, type, etc) i just can't cba to add them lol
        // probably not important ! ahahahah
        // seems to be the same basic "resource" pattern i'm starting to notice (id(?), href, type, meta, etc)
        attributes: T
    }[]
}

export type RelationshipType<T extends AnyAttributesExtensionTypes> = keyof RelationshipTypeMap<T>;
export type RelationshipTypes<T extends AnyAttributesExtensionTypes> = RelationshipType<T>[];
export type RelationshipTypeMap<T extends AnyAttributesExtensionTypes> = {
    albums: AlbumAttributes<Extract<T, AlbumAttributesExtensionTypes>>,
    tracks: SongAttributes<Extract<T, SongAttributesExtensionTypes>> // TODO: tracks can also be music videos, uh oh.
}
