import type {Manifest} from "@betterdiscord/manifest";

const manifest: Manifest = {
    info: {
        name: "BlurNSFW",
        authors: [{
            name: "Zerebos",
            discord_id: "249746236008169473",
            github_username: "zerebos",
            twitter_username: "IAmZerebos"
        }],
        version: "1.0.5",
        description: "Blurs images and videos until you hover over them.",
        github: "https://github.com/zerebos/BetterDiscordAddons/tree/master/Plugins/BlurNSFW",
        github_raw: "https://raw.githubusercontent.com/zerebos/BetterDiscordAddons/master/Plugins/BlurNSFW/BlurNSFW.plugin.js"
    },
    changelog: [
        {
            title: "What's New?",
            type: "added",
            items: [
                "Plugin no longer relies on ZeresPluginLibrary!",
            ]
        },
        {
            title: "Bug Fixes & Info",
            type: "fixed",
            items: [
                "The settings panel will now reflect your actual settings.",
                "Media should be blurred properly once again!",
                "If things aren't blurred properly for you, it might be due to an experiment Discord is doing.",
                "Once the experiment is more widely rolled out, I will add compatibility for it in this plugin."
            ]
        }
    ],
    config: [
        {
            type: "switch",
            id: "blurNSFW",
            name: "Blur NSFW Channels",
            note: "This setting automatically blurs media in channels marked NSFW.",
            value: true
        },
        {
            type: "slider",
            id: "blurSize",
            name: "Blur Size",
            note: "The size (in px) of the blurred pixels.",
            value: 10,
            min: 0,
            max: 50,
            units: "px"
        },
        {
            type: "slider",
            id: "blurTime",
            name: "Blur Time",
            note: "The time (in ms) it takes for the blur to disappear and reappear.",
            value: 200,
            min: 0,
            max: 5000,
            units: "ms"
        },
        {
            type: "switch",
            id: "blurOnFocus",
            name: "Blur When Focused",
            note: "This setting keeps the blur when clicking on/expanding an image.",
            value: true
        }
    ],
    main: "index.ts"
};

export default manifest;
