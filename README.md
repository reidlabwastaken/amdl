# amdl

a web apple music downloader with questionable legality

## setup

### `.env`

`MEDIA_USER_TOKEN` and `ITUA` are both from your apple music cookies

`WIDEVINE_CLIENT_ID` however... oh boy. this thing kind of Sucks to obtain and i would totally recommend finding a not-so-legal spot you can obtain this from (in fact, i found one on github LOL), rather than extracting it yourself. if you want to do through the pain like i did, check [this guide](forum.videohelp.com/threads/408031-Dumping-Your-own-L3-CDM-with-Android-Studio) out!! once you have your `client_id.bin` file, convert it to base64 and slap it in the env var (`cat client_id.bin | base64 -w 0`)

### config

most of the config is commented out in [`config.example.toml`](./config.example.toml), just copy it over to `config.toml` and go wild! i tried to make the error reporting for invalid configurations pretty good :)

## the formats

currently you can only get basic widevine ones

## todo

support other formats
