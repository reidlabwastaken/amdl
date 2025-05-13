# amdl

![banner](./docs/banner.jpg)

a self-hostable web-ui apple music downloader widevine decryptor with questionable legality

## setup

### `.env`

`MEDIA_USER_TOKEN` and `ITUA` are both from your apple music cookies

`WIDEVINE_CLIENT_ID` is uhm owie. this thing kind of Sucks to obtain and i would totally recommend finding a not-so-legal spot you can obtain this from (in fact, i found one on github LOL), rather than extracting it yourself. if you want to do through the pain like i did, check [this guide](forum.videohelp.com/threads/408031-Dumping-Your-own-L3-CDM-with-Android-Studio) out!! once you have your `client_id.bin` file, convert it to base64 and slap it in the env var (`cat client_id.bin | base64 -w 0`)

`WIDEVINE_PRIVATE_KEY` is essentially the same process of obtainment, you'll get it from the same guide!! i'm not sure how to easily find one of these on the web, but i'm sure you end users (user count: 0 (<img src="./docs/true.png" alt="robert downey jr. true image" height="13">) can pull through. this is also in base64 (`cat private_key.pem | base64 -w 0`)

### config

most of the config is talked on in [`config.example.toml`](./config.example.toml), just copy it over to `config.toml` and go wild! i tried to make the error reporting for invalid configurations pretty good and digestable

### running

just as easy as running `npm run build` and running the `dist/index.js` file with your javascript engine of choice

alternatively, use the nix flake, which is currently broken due to an issue outside of my control (i can fix this by publishing a fork of `node-widevine` to the npm registry, but oh well, i'll do that eventually)

## limitations / the formats

currently you can only get basic widevine ones, everything related to playready and fairplay encryption methods are not supported, sorry!! someday i will get this working, at least for playready. it's just that no one has written a library yet but has for python (yuck!!)

guaranteed formats to work include:

- aac-legacy
- aac-he-legacy

## screenshots

<details>
<summary>screenshots</summary>

![home screen](./docs/screen-home.png)

![search screen](./docs/screen-search.png)

![download screen](./docs/screen-dl.png)

</details>
