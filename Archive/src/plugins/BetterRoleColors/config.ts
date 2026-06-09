import type {Manifest} from "@betterdiscord/manifest";

const manifest: Manifest = {
    info: {
        name: "BetterRoleColors",
        author: "Zerebos",
        version: "0.10.4",
        description: "Discontinued, please use MoreRoleColors (https://betterdiscord.app/plugin/MoreRoleColors) instead!",
        github: "https://github.com/zerebos/BetterDiscordAddons/tree/master/Plugins/BetterRoleColors",
        github_raw: "https://raw.githubusercontent.com/zerebos/BetterDiscordAddons/master/Plugins/BetterRoleColors/BetterRoleColors.plugin.js",
    },
    changelog: [
        {
            title: "Plugin Discontinued",
            type: "fixed",
            items: [
                "This plugin has been discontinued, please use the plugin MoreRoleColors (https://betterdiscord.app/plugin/MoreRoleColors).",
                "It was a difficult decision, but doing this allows me to focus my already limited time onto BetterDiscord itself."
            ]
        }
    ],
    config: [
        {
            type: "category",
            id: "global",
            name: "Global Settings",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "important",
                    name: "Use Important",
                    note: "Add !important to role colors. (Only enable this if the plugin isn't working with your theme).",
                    value: false
                },
                {
                    type: "switch",
                    id: "saturation",
                    name: "Use Saturation",
                    note: "Abide by the saturation level set in Discord's accessibility settings.",
                    value: true
                }
            ]
        },
        {
            type: "category",
            id: "modules",
            name: "Module Settings",
            collapsible: true,
            shown: true,
            settings: [
                {
                    type: "switch",
                    id: "typing",
                    name: "Typing",
                    note: "Toggles colorizing of typing notifications.",
                    value: true
                },
                {
                    type: "switch",
                    id: "voice",
                    name: "Voice",
                    note: "Toggles colorizing of voice users.",
                    value: true
                },
                {
                    type: "switch",
                    id: "mentions",
                    name: "Mentions",
                    note: "Toggles colorizing of user mentions in chat.",
                    value: true
                },
                {
                    type: "switch",
                    id: "chat",
                    name: "Chat",
                    note: "Toggles colorizing the message text of users in chat.",
                    value: true
                },
                {
                    type: "switch",
                    id: "botTags",
                    name: "Bot Tags",
                    note: "Toggles coloring the background of bot tags to match role.",
                    value: true
                },
                {
                    type: "switch",
                    id: "memberList",
                    name: "Memberlist Headers",
                    note: "Toggles coloring role names in the member list.",
                    value: true
                }
            ]
        },
        {
            type: "category",
            id: "popouts",
            name: "Popout Options",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "username",
                    name: "Username",
                    note: "Toggles coloring on the username in popouts.",
                    value: false
                },
                {
                    type: "switch",
                    id: "displayName",
                    name: "Display Name",
                    note: "Toggles coloring on the display name in popouts.",
                    value: true
                }
            ]
        },
        {
            type: "category",
            id: "modals",
            name: "Modal Options",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "username",
                    name: "Username",
                    note: "Toggles coloring on the username in modals.",
                    value: false
                },
                {
                    type: "switch",
                    id: "displayName",
                    name: "Display Name",
                    note: "Toggles coloring on the display name in modals.",
                    value: true
                }
            ]
        },
        {
            type: "category",
            id: "auditLog",
            name: "Audit Log Options",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "username",
                    name: "Username",
                    note: "Toggles coloring on the username in audit log.",
                    value: true
                }
            ]
        },
        {
            type: "category",
            id: "account",
            name: "Account Details Options",
            collapsible: true,
            shown: false,
            settings: [
                {
                    type: "switch",
                    id: "username",
                    name: "Username",
                    note: "Toggles coloring on the username in account details.",
                    value: true
                }
            ]
        }
    ],
    main: "index.ts"
};

export default manifest;
