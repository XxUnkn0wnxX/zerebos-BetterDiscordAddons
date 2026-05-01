import type {Channel, Guild, GuildMember, GuildRole, PermissionOverwrite} from "@discord";
import type {DiscordPermissions as IDiscordPermissions} from "@discord/modules";
import type {PermissionableEntity, PermissionCategoryDefinition} from "./types";



interface Description {
    ast: string[];
    locale: string;
}

interface PermissionSpecification {
    title: string;
    flag: bigint;
    description: ((locale: string) => Description) | string[];
}

interface PermissionSpecCategory {
    title: string;
    permissions: PermissionSpecification[];
}

// interface PermissionDefinition {
//     id: string;
//     name: string;
//     description: string;
// }

// interface PermissionCategoryDefinition {
//     name: string;
//     permissions: PermissionDefinition[];
// }

interface SpecManager {
    generateGuildPermissionSpec(guild: Guild): PermissionSpecCategory[];
    generateChannelPermissionSpec(channelId: string, guildId: string): PermissionSpecCategory[];
}

type PermissionId = keyof IDiscordPermissions;

const GuildStore = BdApi.Webpack.Stores.GuildStore;
const UserStore = BdApi.Webpack.Stores.UserStore;
const DiscordPermissions = BdApi.Webpack.getModule<IDiscordPermissions>(m => m.ADD_REACTIONS, {searchExports: true})!;
const intlModule = BdApi.Webpack.getByKeys<{intl: {string(hash: string): string;}; t: Record<string, string>;}>("intl");

const PermissionStringMap: Partial<Record<PermissionId, string>> = {
    ADD_REACTIONS: "yEoJAr",
    ADMINISTRATOR: "PGvZqX",
    ATTACH_FILES: "3AS4UM",
    BAN_MEMBERS: "oTBA7N",
    BYPASS_SLOWMODE: "kqcjeV",
    CHANGE_NICKNAME: "dilOF6",
    CONNECT: "S0W8Z5",
    CREATE_EVENTS: "qyjZua",
    CREATE_GUILD_EXPRESSIONS: "HarVuP",
    CREATE_INSTANT_INVITE: "zJrgTG",
    CREATE_PRIVATE_THREADS: "QwbTSa",
    CREATE_PUBLIC_THREADS: "25rKnX",
    DEAFEN_MEMBERS: "9L47Fr",
    EMBED_LINKS: "969dEL",
    KICK_MEMBERS: "pBNv6i",
    MANAGE_CHANNELS: "9qLtWs",
    MANAGE_EVENTS: "HIgA5a",
    MANAGE_GUILD_EXPRESSIONS: "bbuXIn",
    MANAGE_MESSAGES: "6lU9xM",
    MANAGE_NICKNAMES: "t+Ct5x",
    MANAGE_ROLES: "C8d+oG",
    MANAGE_GUILD: "QZRcfO",
    MANAGE_THREADS: "kEqgr7",
    MANAGE_WEBHOOKS: "/ADKmM",
    MENTION_EVERYONE: "Y78KGC",
    MODERATE_MEMBERS: "+RL6pz",
    MOVE_MEMBERS: "YtjJPQ",
    MUTE_MEMBERS: "8EI30/",
    PIN_MESSAGES: "Y5BI39",
    PRIORITY_SPEAKER: "BVK71i",
    READ_MESSAGE_HISTORY: "l9ufaR",
    REQUEST_TO_SPEAK: "5kicT2",
    SEND_MESSAGES: "T32rkC",
    SEND_MESSAGES_IN_THREADS: "fTE74g",
    SEND_POLLS: "UMQ7Ww",
    SEND_TTS_MESSAGES: "Mg7bku",
    SEND_VOICE_MESSAGES: "WlWSBT",
    SET_VOICE_CHANNEL_STATUS: "VBwkUf",
    SPEAK: "8w1tIR",
    STREAM: "FlNoSV",
    USE_APPLICATION_COMMANDS: "shbR1a",
    USE_EMBEDDED_ACTIVITIES: "rLSGeh",
    USE_EXTERNAL_APPS: "3TzAk0",
    USE_EXTERNAL_EMOJIS: "BpBGZU",
    USE_EXTERNAL_SOUNDS: "pwaVJ6",
    USE_EXTERNAL_STICKERS: "UeRs+b",
    USE_SOUNDBOARD: "Bco7NG",
    USE_VAD: "08zAV7",
    VIEW_AUDIT_LOG: "fZgLpA",
    VIEW_CHANNEL: "W/A4Qp",
    VIEW_CREATOR_MONETIZATION_ANALYTICS: "0lTLTv",
    VIEW_GUILD_ANALYTICS: "rQJBE/",
};

const FallbackPermissionDetails: Partial<Record<PermissionId, {category: string; description: string;}>> = {
    VIEW_CHANNEL: {category: "General", description: "Allows viewing channels and their contents."},
    CREATE_INSTANT_INVITE: {category: "General", description: "Allows creating invite links for the server or channel."},
    MANAGE_CHANNELS: {category: "General", description: "Allows editing channels, categories, and their settings."},
    MANAGE_ROLES: {category: "General", description: "Allows creating, editing, and assigning roles."},
    MANAGE_GUILD: {category: "General", description: "Allows changing core server settings."},
    VIEW_AUDIT_LOG: {category: "General", description: "Allows viewing the server audit log."},
    VIEW_GUILD_ANALYTICS: {category: "General", description: "Allows viewing server analytics and insights."},
    VIEW_CREATOR_MONETIZATION_ANALYTICS: {category: "General", description: "Allows viewing creator monetization analytics."},
    ADMINISTRATOR: {category: "General", description: "Grants every permission and bypasses channel overwrites."},
    CREATE_GUILD_EXPRESSIONS: {category: "General", description: "Allows creating emojis, stickers, and soundboard sounds."},
    MANAGE_GUILD_EXPRESSIONS: {category: "General", description: "Allows managing emojis, stickers, and soundboard sounds."},
    CREATE_EVENTS: {category: "General", description: "Allows creating scheduled events."},
    MANAGE_EVENTS: {category: "General", description: "Allows editing and deleting scheduled events."},
    CHANGE_NICKNAME: {category: "Membership", description: "Allows changing your own nickname."},
    MANAGE_NICKNAMES: {category: "Membership", description: "Allows changing other members' nicknames."},
    KICK_MEMBERS: {category: "Membership", description: "Allows removing members from the server."},
    BAN_MEMBERS: {category: "Membership", description: "Allows banning members from the server."},
    MODERATE_MEMBERS: {category: "Membership", description: "Allows timing out and moderating members."},
    SEND_MESSAGES: {category: "Text", description: "Allows sending messages in text channels."},
    SEND_TTS_MESSAGES: {category: "Text", description: "Allows sending text-to-speech messages."},
    EMBED_LINKS: {category: "Text", description: "Allows sending embeds for supported links."},
    ATTACH_FILES: {category: "Text", description: "Allows uploading files and images."},
    ADD_REACTIONS: {category: "Text", description: "Allows adding reactions to messages."},
    USE_EXTERNAL_EMOJIS: {category: "Text", description: "Allows using emojis from other servers."},
    USE_EXTERNAL_STICKERS: {category: "Text", description: "Allows using stickers from other servers."},
    MENTION_EVERYONE: {category: "Text", description: "Allows mentioning @everyone, @here, and all roles."},
    MANAGE_MESSAGES: {category: "Text", description: "Allows deleting, pinning, and managing messages."},
    PIN_MESSAGES: {category: "Text", description: "Allows pinning messages in channels."},
    READ_MESSAGE_HISTORY: {category: "Text", description: "Allows reading message history."},
    CREATE_PUBLIC_THREADS: {category: "Text", description: "Allows creating public threads."},
    CREATE_PRIVATE_THREADS: {category: "Text", description: "Allows creating private threads."},
    SEND_MESSAGES_IN_THREADS: {category: "Text", description: "Allows sending messages inside threads."},
    MANAGE_THREADS: {category: "Text", description: "Allows renaming, archiving, and deleting threads."},
    USE_APPLICATION_COMMANDS: {category: "Text", description: "Allows using slash commands and context menu commands."},
    SEND_VOICE_MESSAGES: {category: "Text", description: "Allows sending voice messages."},
    SEND_POLLS: {category: "Text", description: "Allows creating polls in supported channels."},
    BYPASS_SLOWMODE: {category: "Text", description: "Allows sending messages without waiting for slowmode."},
    MANAGE_WEBHOOKS: {category: "Text", description: "Allows creating and editing webhooks."},
    CONNECT: {category: "Voice", description: "Allows joining voice channels."},
    SPEAK: {category: "Voice", description: "Allows speaking in voice channels."},
    STREAM: {category: "Voice", description: "Allows streaming video or screen share."},
    USE_VAD: {category: "Voice", description: "Allows using voice activity instead of push-to-talk."},
    PRIORITY_SPEAKER: {category: "Voice", description: "Allows using priority speaker in voice channels."},
    MUTE_MEMBERS: {category: "Voice", description: "Allows muting other members in voice channels."},
    DEAFEN_MEMBERS: {category: "Voice", description: "Allows deafening other members in voice channels."},
    MOVE_MEMBERS: {category: "Voice", description: "Allows moving members between voice channels."},
    REQUEST_TO_SPEAK: {category: "Voice", description: "Allows requesting to speak in stage channels."},
    SET_VOICE_CHANNEL_STATUS: {category: "Voice", description: "Allows changing the status of a voice channel."},
    USE_SOUNDBOARD: {category: "Voice", description: "Allows using the soundboard."},
    USE_EXTERNAL_SOUNDS: {category: "Voice", description: "Allows using soundboard sounds from other servers."},
    USE_EMBEDDED_ACTIVITIES: {category: "Voice", description: "Allows launching embedded voice activities."},
    USE_EXTERNAL_APPS: {category: "Apps", description: "Allows external apps and app integrations to be used."},
};

function findSpecManager(): SpecManager | undefined {
    return BdApi.Webpack.getModule<SpecManager>(
        (module): module is SpecManager =>
            typeof module?.generateGuildPermissionSpec === "function" &&
            typeof module?.generateChannelPermissionSpec === "function",
        {searchExports: true}
    );
}

function humanizePermissionId(permission: string): string {
    return permission
        .split("_")
        .map(part => part[0] + part.slice(1).toLowerCase())
        .join(" ");
}

function getPermissionName(permission: PermissionId): string {
    const hash = PermissionStringMap[permission];
    if (hash && intlModule?.intl && intlModule.t?.[hash]) {
        return intlModule.intl.string(intlModule.t[hash]) ?? humanizePermissionId(permission);
    }

    return humanizePermissionId(permission);
}

function buildFallbackDefinitions(): PermissionCategoryDefinition[] {
    const categories = new Map<string, PermissionCategoryDefinition["permissions"]>();
    const permissionIds = Object.keys(DiscordPermissions) as PermissionId[];

    for (const permission of permissionIds) {
        const fallback = FallbackPermissionDetails[permission] ?? {
            category: "Other",
            description: `Controls ${getPermissionName(permission).toLowerCase()}.`
        };

        if (!categories.has(fallback.category)) {
            categories.set(fallback.category, []);
        }

        categories.get(fallback.category)?.push({
            id: permission,
            name: getPermissionName(permission),
            description: fallback.description
        });
    }

    return [...categories.entries()].map(([name, permissions]) => ({name, permissions}));
}

export function getDefinitions(guildIdOrGuild?: string | Guild): PermissionCategoryDefinition[] {
    // If no guild is provided, default to the first guild in the sorted guild list
    if (!guildIdOrGuild) guildIdOrGuild = BdApi.Webpack.Stores.SortedGuildStore.getFlattenedGuildIds()[0];

    // Get the guild object from the ID if a string was provided
    const guild = typeof guildIdOrGuild === "string" ? BdApi.Webpack.Stores.GuildStore.getGuild(guildIdOrGuild) : guildIdOrGuild;
    if (!guild) return buildFallbackDefinitions();

    const specManager = findSpecManager();
    if (!specManager) return buildFallbackDefinitions();

    const guildSpecs = specManager.generateGuildPermissionSpec(guild);
    if (!guildSpecs?.length) return buildFallbackDefinitions();
    return guildSpecs.map(category => ({
        name: category.title,
        permissions: category.permissions.map(perm => ({
            id: Object.keys(DiscordPermissions).find(key => DiscordPermissions[key as PermissionId] === perm.flag) ?? "",
            name: perm.title,
            description: typeof perm.description === "function" ? perm.description(BdApi.Webpack.Stores.LocaleStore.locale).ast[0] : perm.description[0]
        }))
    }));
}


export function getAllowedDenied(roleOrOverwrite: EntityTarget): Record<string, "allowed" | "denied" | "neutral"> {
    const allowed = getAllowedPermissions(roleOrOverwrite);
    const denied = getDeniedPermissions(roleOrOverwrite);
    const result: Record<string, "allowed" | "denied" | "neutral"> = {};
    for (const perm in DiscordPermissions) {
        const isAllowed = (allowed & DiscordPermissions[perm as keyof IDiscordPermissions]!) === DiscordPermissions[perm as keyof IDiscordPermissions]!;
        const isDenied = (denied & DiscordPermissions[perm as keyof IDiscordPermissions]!) === DiscordPermissions[perm as keyof IDiscordPermissions]!;
        result[perm] = isAllowed ? "allowed" : isDenied ? "denied" : "neutral";
    }
    return result;
}

export function getRoles(guild: Guild) {
    const roleStore = BdApi.Webpack.Stores.GuildRoleStore;
    const roles = roleStore.getRolesSnapshot(guild.id);
    return roles;
}


export function getAllowedPermissions(roleOrOverwrite: EntityTarget): bigint {
    // Channel
    if (typeof roleOrOverwrite === "object" && "allow" in roleOrOverwrite) {
        return roleOrOverwrite.allow;
    }

    // Guild
    if (typeof roleOrOverwrite === "object" && "hoist" in roleOrOverwrite) {
        return roleOrOverwrite.permissions;
    }

    // Custom
    if (typeof roleOrOverwrite === "object" && "permissions" in roleOrOverwrite && !("guildId" in roleOrOverwrite)) {
        if (typeof roleOrOverwrite.permissions === "bigint") {
            return roleOrOverwrite.permissions;
        }
        return roleOrOverwrite.permissions.allow;
    }

    // Default
    return 0n;
}

export function getDeniedPermissions(roleOrOverwrite: EntityTarget): bigint {
    // Channel
    if (typeof roleOrOverwrite === "object" && "deny" in roleOrOverwrite) {
        return roleOrOverwrite.deny;
    }

    // Custom
    if (typeof roleOrOverwrite === "object" && "permissions" in roleOrOverwrite && !("guildId" in roleOrOverwrite)) {
        if (typeof roleOrOverwrite.permissions === "bigint") {
            return 0n;
        }
        return roleOrOverwrite.permissions.deny;
    }

    // Guild & Default
    return 0n;
}


interface CustomEntity extends Omit<PermissionableEntity, "permissions"> {
    // For custom entities, using just a bigint implies allowed permissions with no denials, since we don't have a way to specify denied permissions
    // However, if you want to specify both allowed and denied permissions for a custom entity, you can use the PermissionOverwrite structure
    permissions: Omit<PermissionOverwrite, "id" | "type"> | bigint;
}

type PermissionTarget = Channel | Guild | GuildMember;
type EntityTarget = CustomEntity | GuildRole | PermissionOverwrite;

export function getEntityTargets(permTarget: PermissionTarget): Record<string, EntityTarget> {
    // Channel
    if ("guild_id" in permTarget && permTarget.guild_id) {
        return permTarget.permissionOverwrites;
    }

    // Guild
    if ("maxMembers" in permTarget) {
        const roles = getRoles(permTarget);
        return roles;
    }

    // User
    if ("userId" in permTarget) {
        const guild = GuildStore.getGuild(permTarget.guildId);
        if (!guild) return {};
        const roles = getRoles(guild);
        const memberRoleList = [...permTarget.roles]; // copy to prevent mutations

        // Start with the user's roles minus @everyone, which is added back later for UI purposes
        const memberTargetMap: Record<string, EntityTarget> = {};
        for (const roleId of memberRoleList) {
            if (roles[roleId]) memberTargetMap[roleId] = roles[roleId];
        }

        // @everyone role always applies to users
        // apply after loop to allow custom placement of role in ui
        // TODO: rework the entity structure to avoid this hack
        memberRoleList.push(guild.id);

        // Setup some special variables for later
        const isOwner = permTarget.userId === guild.ownerId;
        const ALL_PERMISSIONS = Object.values(DiscordPermissions!).reduce((all, p) => all | p);

        // Calculate the user's effective permissions by OR'ing together all their role permissions, starting with 0 and applying each role's allowed permissions and then denied permissions
        let userPerms = 0n;
        for (const roleId of memberRoleList) {
            const role = roles[roleId];
            if (role) userPerms |= role.permissions;
        }

        // Add a pseudo-role for "effective" permissions
        memberTargetMap["@effective"] = {
            id: "@effective",
            name: "Effective Permissions",
            permissions: {
                allow: isOwner ? ALL_PERMISSIONS : userPerms,
                deny: isOwner ? 0n : ~userPerms
            },
        } satisfies CustomEntity;

        // If the user is the owner, add an entry for the @owner pseudo-role with all permissions
        if (isOwner) {
            memberTargetMap["@owner"] = {
                id: "@owner",
                name: "Server Owner",
                permissions: ALL_PERMISSIONS,
                iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjb2xvci1taXgoaW4gb2tsYWIsIGhzbCgzOC40NTUgY2FsYygxKjEwMCUpIDQzLjEzNyUgLzEpIDEwMCUsICMwMDAgMCUpIiBkPSJNNSAxOGExIDEgMCAwIDAtMSAxIDMgMyAwIDAgMCAzIDNoMTBhMyAzIDAgMCAwIDMtMyAxIDEgMCAwIDAtMS0xSDVaTTMuMDQgNy43NmExIDEgMCAwIDAtMS41MiAxLjE1bDIuMjUgNi40MmExIDEgMCAwIDAgLjk0LjY3aDE0LjU1YTEgMSAwIDAgMCAuOTUtLjcxbDEuOTQtNi40NWExIDEgMCAwIDAtMS41NS0xLjFsLTQuMTEgMy0zLjU1LTUuMzMuODItLjgyYS44My44MyAwIDAgMCAwLTEuMThsLTEuMTctMS4xN2EuODMuODMgMCAwIDAtMS4xOCAwbC0xLjE3IDEuMTdhLjgzLjgzIDAgMCAwIDAgMS4xOGwuODIuODItMy42MSA1LjQyLTQuNDEtMy4wN1oiPjwvcGF0aD48L3N2Zz4=",
                position: undefined
            } satisfies CustomEntity;
        }

        // Add the @everyone role to the ui
        memberTargetMap[guild.id] = roles[guild.id];

        return memberTargetMap;
    }

    return {};
}


export function getPermissionableEntities(guildContext: Guild, permTarget: PermissionTarget): PermissionableEntity[] {
    const roles = getRoles(guildContext);
    const permEntries: PermissionableEntity[] = [];
    const permTargets = getEntityTargets(permTarget);

    for (const key in permTargets) {
        // console.log(key);
        const entityPermissions = permTargets[key];
        const perms = getAllowedDenied(entityPermissions);

        // Real guild role
        const role = roles?.[key];
        if (role) {
            permEntries.push({
                id: key,
                name: role.name,
                permissions: perms,
                color: role.colorStrings?.primaryColor,
                iconUrl: role.icon ? `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.webp` : undefined,
                position: role.position || undefined
            });
            continue;
        }

        // Real user
        const user = UserStore.getUser(key);
        if (user) {
            permEntries.push({
                id: key,
                name: user.username,
                permissions: perms,
                avatarUrl: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`
            });
        }

        // Custom entries @everyone or @owner
        if ("permissions" in entityPermissions && !("guildId" in entityPermissions)) {
            permEntries.push({
                id: key,
                name: entityPermissions.name,
                permissions: perms,
                color: entityPermissions.color,
                iconUrl: entityPermissions.iconUrl,
                position: entityPermissions.position || undefined
            });
        }
    }
    return permEntries;
}
