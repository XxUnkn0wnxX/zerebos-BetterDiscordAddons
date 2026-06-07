import type {Manifest} from "@betterdiscord/manifest";

const manifest: Manifest = {
    info: {
        name: "PermissionsViewer",
        authors: [{
            name: "Zerebos",
            discord_id: "249746236008169473",
            github_username: "zerebos",
            twitter_username: "IAmZerebos"
        }],
        version: "1.0.1",
        description: "Allows you to view all the permissions for users, servers, and channels!",
        github: "https://github.com/zerebos/BetterDiscordAddons/tree/master/Plugins/PermissionsViewer",
        github_raw: "https://raw.githubusercontent.com/zerebos/BetterDiscordAddons/master/Plugins/PermissionsViewer/PermissionsViewer.plugin.js"
    },
    changelog: {
        // banner: "https://github.com/user-attachments/assets/a9cd5ef8-35fa-446e-8839-1b9cb1dc8962",
        blurb: "Sorry for the delay in fixing, but I wanted to wait for the underlying issue to be fixed in Discord's code instead of patching around it. This update should fix all the issues with permissions showing up incorrectly and not showing up in popouts.",
        changes: [
            {
                title: "What's Fixed?",
                type: "fixed",
                items: [
                    "Permissions should appear in popouts again.",
                    "Context menu entries should show the modal when clicked.",
                ]
            }
        ]
    },
    config: [
        {
            type: "switch",
            id: "contextMenus",
            name: "Context Menus",
            value: true
        },
        {
            type: "switch",
            id: "popouts",
            name: "Popouts",
            value: true
        },
        {
            type: "switch",
            id: "showNeutral",
            name: "Show Neutral Permissions",
            value: false
        }
    ],
    strings: {
        es: {
            contextMenuLabel: "Permisos",
            popoutLabel: "Permisos",
            modal: {
                header: "Permisos de {{name}}",
                rolesLabel: "Roles",
                permissionsLabel: "Permisos",
                owner: "@propietario"
            },
            settings: {
                popouts: {
                    name: "Mostrar en Popouts",
                    note: "Mostrar los permisos de usuario en popouts como los roles."
                },
                contextMenus: {
                    name: "Botón de menú contextual",
                    note: "Añadir un botón para ver permisos en los menús contextuales."
                }
            }
        },
        pt: {
            contextMenuLabel: "Permissões",
            popoutLabel: "Permissões",
            modal: {
                header: "Permissões de {{name}}",
                rolesLabel: "Cargos",
                permissionsLabel: "Permissões",
                owner: "@dono"
            },
            settings: {
                popouts: {
                    name: "Mostrar em Popouts",
                    note: "Mostrar as permissões em popouts como os cargos."
                },
                contextMenus: {
                    name: "Botão do menu de contexto",
                    note: "Adicionar um botão parar ver permissões ao menu de contexto."
                }
            }
        },
        de: {
            contextMenuLabel: "Berechtigungen",
            popoutLabel: "Berechtigungen",
            modal: {
                header: "{{name}}s Berechtigungen",
                rolesLabel: "Rollen",
                permissionsLabel: "Berechtigungen",
                owner: "@eigentümer"
            },
            settings: {
                popouts: {
                    name: "In Popouts anzeigen",
                    note: "Zeigt die Gesamtberechtigungen eines Benutzers in seinem Popup ähnlich den Rollen an."
                },
                contextMenus: {
                    name: "Kontextmenü-Schaltfläche",
                    note: "Fügt eine Schaltfläche hinzu, um die Berechtigungen mithilfe von Kontextmenüs anzuzeigen."
                }
            }
        },
        en: {
            contextMenuLabel: "Permissions",
            popoutLabel: "Permissions",
            modal: {
                header: "{{name}}'s Permissions",
                rolesLabel: "Roles",
                permissionsLabel: "Permissions",
                owner: "@owner"
            },
            settings: {
                popouts: {
                    name: "Show In Popouts",
                    note: "Shows a user's total permissions in their popout similar to roles."
                },
                contextMenus: {
                    name: "Context Menu Button",
                    note: "Adds a button to view the permissions modal to select context menus."
                },
                showNeutral: {
                    name: "Show Neutral Permissions",
                    note: "Whether to show permissions that are neither allowed nor denied."
                }
            }
        },
        ru: {
            contextMenuLabel: "Полномочия",
            popoutLabel: "Полномочия",
            modal: {
                header: "Полномочия {{name}}",
                rolesLabel: "Роли",
                permissionsLabel: "Полномочия",
                owner: "Владелец"
            },
            settings: {
                popouts: {
                    name: "Показать во всплывающих окнах",
                    note: "Отображает полномочия пользователя в их всплывающем окне, аналогичном ролям."
                },
                contextMenus: {
                    name: "Кнопка контекстного меню",
                    note: "Добавить кнопку для отображения полномочий с помощью контекстных меню."
                }
            }
        },
        nl: {
            contextMenuLabel: "Permissies",
            popoutLabel: "Permissies",
            modal: {
                header: "{{name}}'s Permissies",
                rolesLabel: "Rollen",
                permissionsLabel: "Permissies",
                owner: "@eigenaar"
            },
            settings: {
                popouts: {
                    name: "Toon in Popouts",
                    note: "Toont de totale rechten van een gebruiker in zijn pop-out, vergelijkbaar met rollen."
                },
                contextMenus: {
                    name: "Contextmenuknop",
                    note: "Voegt een knop toe om de machtigingsmodaliteit voor het selecteren van contextmenu's te bekijken."
                }
            }
        }
    },
    main: "index.ts"
};

export default manifest;
