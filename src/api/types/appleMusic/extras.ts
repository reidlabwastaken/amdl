// TODO: i can't cba to make views (what r these??) / relationships 100% type safe
// it's difficult because they seem to trickle down extensions, too
// oh wait--the relationships are not always present (not applicable) so thats even better !!
// so i would have to make a type for each relationship hahahahahahaha

// https://developer.apple.com/documentation/applemusicapi/artwork
export interface Artwork {
    bgColor?: string
    height: number
    width: number
    textColor1?: string
    textColor2?: string
    textColor3?: string
    textColor4?: string
    url: string
}

// https://developer.apple.com/documentation/applemusicapi/editorialnotes
export interface EditorialNotes {
    short?: string
    standard?: string
    name?: string
    tagline?: string
}

// https://developer.apple.com/documentation/applemusicapi/playparameters
export interface PlayParameters {
    id: string
    kind: string
}

// https://developer.apple.com/documentation/applemusicapi/preview
export interface Preview {
    artwork?: Artwork
    url: string
    hlsUrl?: string
}
