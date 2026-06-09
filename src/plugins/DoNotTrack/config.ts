import type {Manifest} from "@betterdiscord/manifest";

const manifest: Manifest = {
    info: {
        name: "DoNotTrack",
        authors: [{
            name: "Zerebos",
            discord_id: "249746236008169473",
            github_username: "zerebos",
            twitter_username: "IAmZerebos"
        }],
        version: "0.1.0",
        description: "Stops Discord from tracking everything you do like Sentry and Analytics.",
        github: "https://github.com/zerebos/BetterDiscordAddons/tree/master/Plugins/DoNotTrack",
        github_raw: "https://raw.githubusercontent.com/zerebos/BetterDiscordAddons/master/Plugins/DoNotTrack/DoNotTrack.plugin.js"
    },
    changelog: [
        {
            title: "What's New?",
            type: "added",
            items: [
                "Plugin no longer relies on ZeresPluginLibrary!",
                "DoNotTrack should be more resilient to Discord's changes."
            ]
        },
        {
            title: "Fixes",
            type: "fixed",
            items: [
                "Fixed startup issues.",
                "Hopefully fixed issues with the process monitor."
            ]
        }
    ],
    main: "index.ts",
    config: [
        {
            type: "switch",
            id: "stopProcessMonitor",
            name: "Stop Process Monitor",
            note: "This setting stops Discord from monitoring the processes on your PC and prevents your currently played game from showing.",
            value: true
        }
    ]
};

export default manifest;
