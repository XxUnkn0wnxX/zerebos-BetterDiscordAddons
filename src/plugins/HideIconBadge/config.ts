import type {Manifest} from "@betterdiscord/manifest";

const manifest: Manifest = {
    info: {
        name: "HideIconBadge",
        authors: [{
            name: "Zerebos",
            discord_id: "249746236008169473",
            github_username: "zerebos",
            twitter_username: "IAmZerebos"
        }],
        version: "0.0.6",
        description: "Hides the badge on the app icon and tray icon.",
        github: "https://github.com/zerebos/BetterDiscordAddons/tree/master/Plugins/HideIconBadge",
        github_raw: "https://raw.githubusercontent.com/zerebos/BetterDiscordAddons/master/Plugins/HideIconBadge/HideIconBadge.plugin.js"
    },
    changelog: [
        {title: "What's New?", type: "added", items: ["No longer depends on ZeresPluginLibrary!"]}
    ],
    main: "index.ts"
};

export default manifest;
