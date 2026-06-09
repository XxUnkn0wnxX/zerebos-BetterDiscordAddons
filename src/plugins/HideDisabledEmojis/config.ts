import type {Manifest} from "@betterdiscord/manifest";

const manifest: Manifest = {
    info: {
        name: "HideDisabledEmojis",
        authors: [{
            name: "Zerebos",
            discord_id: "249746236008169473",
            github_username: "zerebos",
            twitter_username: "IAmZerebos"
        }],
        version: "0.1.0",
        description: "Hides disabled emojis from the emoji picker.",
        github: "https://github.com/zerebos/BetterDiscordAddons/tree/master/Plugins/HideDisabledEmojis",
        github_raw: "https://github.com/zerebos/BetterDiscordAddons/blob/master/Plugins/HideDisabledEmojis/HideDisabledEmojis.plugin.js"
    },
    changelog: [
        {
            title: "What's New?",
            type: "added",
            items: [
                "No longer dependent on ZeresPluginLibrary!",
            ]
        },
        {
            title: "Bugs Squashed",
            type: "fixed",
            items: [
                "Correctly hides emojis in the picker.",
                "Also hides categories in the sidebar that have no emojis available to be used.",
                "Hides other nitro promo in the emoji picker."
            ]
        }
    ],
    main: "index.ts"
};

export default manifest;
