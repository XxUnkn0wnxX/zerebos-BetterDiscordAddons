import type {Component, ReactElement} from "react";

import Plugin from "@common/plugin";
import formatString from "@common/formatstring";

import type {Meta} from "@betterdiscord/meta";

import type {Channel, Guild, GuildMember, GuildRole, PermissionOverwrite, User} from "@discord";
import type {ClassModule, DiscordPermissions as IDiscordPermissions} from "@discord/modules";

import Config from "./config";

import DefaultCSS from "./styles.css";

import ItemHTML from "./item.html";
import SectionHTML from "./list.html";
import {rgbToAlpha} from "@common/colors";
import PermissionModal from "./components/PermissionViewerModal.svelte";
import {mount, unmount} from "svelte";
import {getDefinitions, getPermissionableEntities} from "./perms";
import type {PermissionableEntity} from "./types";


const {ContextMenu, DOM, Utils, Webpack, UI, ReactUtils} = BdApi;

const GuildStore = Webpack.getStore<{getGuild(id: string): Guild;}>("GuildStore");
const SelectedGuildStore = Webpack.getStore<{getGuildId(): string;}>("SelectedGuildStore");
const GuildRoleStore = Webpack.getStore<{getRolesSnapshot(id: string): Record<string, GuildRole>;}>("GuildRoleStore");
const MemberStore = Webpack.getStore<{getNick(gid: string, uid: string): string; getMembers(id: string): GuildMember[]; getMember(gid: string, uid: string): GuildMember;}>("GuildMemberStore");
const UserStore = Webpack.getStore<{getUser(id: string): User;}>("UserStore");
const DiscordPermissions = Webpack.getModule<IDiscordPermissions>(m => m.ADD_REACTIONS, {searchExports: true});
const intlModule = BdApi.Webpack.getByKeys<{intl: {string(hash: string): string;}; t: Record<string, string>;}>("intl");


const getRoles = (guild: {roles?: Record<string, GuildRole>; id: string;}): Record<string, GuildRole> | undefined => guild?.roles ?? GuildRoleStore?.getRolesSnapshot(guild?.id);
// const getHashString = (hash: string) => intlModule?.intl.string(hash);
const getPermString = (perm: keyof IDiscordPermissions) => intlModule?.intl.string(intlModule.t[PermissionStringMap[perm]]) ?? perm.toString();

const PermissionStringMap: Record<keyof IDiscordPermissions, string> = {
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

const TemplateRetryDelays = [0, 16, 50, 100, 250, 500];
const RequiredTemplateClassKeys = [
    "role",
    "roleCircle"
];

interface PermissionTemplateSet {
    sectionHTML: string;
    itemHTML: string;
}

function isOverwriteEmpty(overwrite: PermissionOverwrite): boolean {
    return !overwrite.allow && !overwrite.deny && overwrite.type == 0;
}

/**
 * For some reason, Discord sometimes creates an overwrite object for the
 * `@everyone` role that has no permissions set.
 * @param channel
 * @returns
 */
function hasOverwrites(channel: Channel): boolean {
    const roleIds = Object.keys(channel.permissionOverwrites);
    if (roleIds.length === 0) return false;
    if (roleIds.length === 1 && isOverwriteEmpty(channel.permissionOverwrites[roleIds[0]])) return false;
    return true;
}

function classModuleToMap(module?: ClassModule): ClassModule {
    if (!module) return {};
    const descriptors = Object.getOwnPropertyDescriptors(module);
    const classMap: ClassModule = {};
    for (const key in descriptors) {
        classMap[key] = descriptors[key].value;
    }
    return classMap;
}

function stripUnresolvedClassTokens(html: string): string {
    return html.replace(/{{(?!sectionTitle}})[^}]+}}/g, "");
}

function getClassByPrefix(element: Element | null | undefined, prefix: string): string | undefined {
    if (!element) return undefined;
    return Array.from(element.classList).find(className => className.startsWith(`${prefix}_`) || className.startsWith(`${prefix}__`));
}

export default class PermissionsViewer extends Plugin {
    constructor(meta: Meta) {super(meta, Config);}

    contextMenuPatches: (() => void)[] = [];
    permissionTemplates?: PermissionTemplateSet;
    popoutMountObserverMap = new WeakMap<HTMLDivElement, MutationObserver>();
    popoutMountObservers = new Set<MutationObserver>();
    popoutMountRetries = new WeakMap<HTMLDivElement, number>();

    onStart() {
        DOM.addStyle(this.meta.name, DefaultCSS);

        if (this.settings.popouts) this.bindPopouts();
        if (this.settings.contextMenus) this.bindContextMenus();
    }

    onStop() {
        DOM.removeStyle(this.meta.name);
        for (const observer of this.popoutMountObservers) observer.disconnect();
        this.popoutMountObservers.clear();
        this.unbindPopouts();
        this.unbindContextMenus();
    }

    patchPopouts(e: MutationRecord) {
        const popoutMount = (popout: HTMLDivElement, props: {displayProfile: {guildId: string;}; user: User;}) => {
            if (!props || !props.displayProfile || !props.user) return;
            // const popout = document.querySelector<HTMLDivElement>(`[class*="userPopout_"], [class*="outer_"]`);
            if (!popout || popout.querySelector("#permissions-popout")) return;
            const user = MemberStore?.getMember(props.displayProfile.guildId, props.user.id);
            const guild = GuildStore?.getGuild(props.displayProfile.guildId);
            const name = MemberStore?.getNick(props.displayProfile.guildId, props.user.id) ?? props.user.username;
            // console.log({user, guild, name});
            if (!user || !guild || !name) return;

            const userRoles = user.roles.slice(0);
            userRoles.push(guild.id);
            userRoles.reverse();
            let perms = 0n;
            let roleList = popout.querySelector<HTMLDivElement>(`[class*="roleList"]`);
            // console.log("popout list element:", popout);
            if (roleList?.parentElement?.className.includes("section")) roleList = roleList.parentElement as HTMLDivElement;
            if (!roleList) return this.retryPopoutMount(popout, props);
            const templates = this.getPermissionTemplates(popout);
            if (!templates) return this.retryPopoutMount(popout, props);

            const referenceRoles = getRoles(guild);
            if (!referenceRoles) return;

            const permBlock = DOM.parseHTML(formatString(templates.sectionHTML, {sectionTitle: this.strings.popoutLabel})) as HTMLDivElement;
            const memberPerms = permBlock.querySelector<HTMLDivElement>(".member-perms") as HTMLDivElement;

            // console.log("Reference roles:", referenceRoles);
            // console.log("Calculating permissions for roles", userRoles.map(r => referenceRoles[r]?.name ?? r));
            for (let r = 0; r < userRoles.length; r++) {
                const role = userRoles[r];
                if (!referenceRoles[role]) continue;
                perms = perms | referenceRoles[role].permissions;
                for (const perm in DiscordPermissions) {
                    const permName = getPermString(perm as keyof IDiscordPermissions) || perm.split("_").map(n => n[0].toUpperCase() + n.slice(1).toLowerCase()).join(" ");
                    const hasPerm = (perms & DiscordPermissions[perm as keyof typeof DiscordPermissions]!) == DiscordPermissions[perm as keyof typeof DiscordPermissions];
                    if (hasPerm && !memberPerms.querySelector(`[data-name="${permName}"]`)) {
                        const element = DOM.parseHTML(templates.itemHTML) as HTMLDivElement;
                        // element.classList.add(RoleClasses.rolePill);
                        let roleColor = referenceRoles[role].colorStrings?.primaryColor;
                        element.querySelector<HTMLDivElement>(".name")!.textContent = permName;
                        element.setAttribute("data-name", permName);
                        if (!roleColor) roleColor = "#B9BBBE";
                        element.querySelector<HTMLDivElement>(".perm-circle")!.style.backgroundColor = rgbToAlpha(roleColor, 1);
                        // element.style.borderColor = ColorConverter.rgbToAlpha(roleColor, 0.6);
                        memberPerms.prepend(element);
                    }
                }
            }

            permBlock.querySelector<HTMLSpanElement>(".perm-details")?.addEventListener("click", () => {
                popoutInstance?.props?.targetRef?.current?.click(); // Close the popout
                document.querySelector<HTMLDivElement>(`[class*="backdrop__"]`)?.click(); // Close the modal
                // this.showModal(this.createModalUser(name, user, guild));
                this.createModalUser(name, user, guild);
            });

            // await new Promise(resolve => setTimeout(resolve, 100)); // Wait for the popout to render

            roleList?.after(permBlock);
            this.disconnectPopoutMountObserver(popout);

            // console.log(roleList, permBlock);

            const popoutInstance = Utils.findInTree<Component & {updatePosition(): void; props: {targetRef: {current: HTMLElement | null;};};}>(
                ReactUtils.getInternalInstance(popout),
                (m: {updatePosition?: () => void;}) => m && m.updatePosition,
                {walkable: ["stateNode", "return"]}
            );
            if (!popoutInstance || !popoutInstance.updatePosition) return;
            popoutInstance.updatePosition();
        };

        if (!e.addedNodes.length || !(e.addedNodes[0] instanceof Element)) return;
        const element = e.addedNodes[0];
        const popout = element.querySelector<HTMLDivElement>(`[class*="userPopout_"], [class*="outer_"]`) ?? element as HTMLDivElement;

        if (!popout || !popout.matches(`[class*="userPopout_"], [class*="outer_"]`)) return;
        // console.log("Popout detected, patching...", popout);
        const props = Utils.findInTree<{displayProfile: {guildId: string;}; user: User;}>(ReactUtils.getInternalInstance(popout), (m: {user?: User;}) => m && m.user, {walkable: ["memoizedProps", "return"]});
        popoutMount(popout, props);
    }

    getPopoutClassMap(popout: HTMLDivElement): ClassModule {
        const roleList = popout.querySelector(`[class*="roleList"]`);
        const role = roleList?.querySelector(`[class*="role_"], [class*="role__"]`);
        const roleName = role?.querySelector(`[class*="roleName_"], [class*="roleName__"]`);
        const roleCircle = role?.querySelector(`[class*="roleCircle_"], [class*="roleCircle__"]`);
        const roleTag = roleList?.querySelector(`[class*="roleTag_"], [class*="roleTag__"]`);

        const classMap: ClassModule = {};
        const roleClass = getClassByPrefix(role, "role");
        const roleCircleClass = getClassByPrefix(roleCircle, "roleCircle");
        const roleNameClass = getClassByPrefix(roleName, "roleName");
        const roleTagClass = getClassByPrefix(roleTag, "roleTag");

        if (roleClass) classMap.role = roleClass;
        if (roleCircleClass) classMap.roleCircle = roleCircleClass;
        if (roleNameClass) classMap.roleName = roleNameClass;
        if (roleTagClass) classMap.roleTag = roleTagClass;

        return classMap;
    }

    getPermissionTemplates(popout: HTMLDivElement): PermissionTemplateSet | null {
        if (this.permissionTemplates) return this.permissionTemplates;

        const PopoutRoleClasses = classModuleToMap(Webpack.getByKeys<ClassModule>("roleCircle"));
        const PopoutRoleClasses2 = classModuleToMap(Webpack.getByKeys<ClassModule>("role", "roleTag"));
        const EyebrowClasses = classModuleToMap(Webpack.getByKeys<ClassModule>("defaultColor", "eyebrow"));
        const classMap = Object.assign({}, PopoutRoleClasses, PopoutRoleClasses2, EyebrowClasses, this.getPopoutClassMap(popout));

        if (RequiredTemplateClassKeys.some(key => typeof classMap[key] !== "string" || !classMap[key])) return null;

        this.permissionTemplates = {
            sectionHTML: stripUnresolvedClassTokens(formatString(SectionHTML, classMap)),
            itemHTML: stripUnresolvedClassTokens(formatString(ItemHTML, classMap))
        };
        return this.permissionTemplates;
    }

    disconnectPopoutMountObserver(popout: HTMLDivElement) {
        const observer = this.popoutMountObserverMap.get(popout);
        if (!observer) return;

        observer.disconnect();
        this.popoutMountObserverMap.delete(popout);
        this.popoutMountObservers.delete(observer);
    }

    observePopoutMount(popout: HTMLDivElement) {
        if (this.popoutMountObserverMap.has(popout)) return;

        const retryMount = () => {
            if (!document.body.contains(popout) || popout.querySelector("#permissions-popout")) {
                this.disconnectPopoutMountObserver(popout);
                return;
            }

            const mutation = {addedNodes: [popout]} as unknown as MutationRecord;
            this.patchPopouts(mutation);
        };

        const observer = new MutationObserver(retryMount);
        observer.observe(popout, {childList: true, subtree: true});
        this.popoutMountObserverMap.set(popout, observer);
        this.popoutMountObservers.add(observer);
    }

    retryPopoutMount(popout: HTMLDivElement, props: {displayProfile: {guildId: string;}; user: User;}) {
        const retryCount = this.popoutMountRetries.get(popout) ?? 0;
        const retryDelay = TemplateRetryDelays[retryCount];

        if (retryDelay === undefined) {
            console.warn("[PermissionsViewer] Discord popout role classes were not ready; skipping permission popout render.");
            return;
        }

        const runRetry = () => {
            if (!document.body.contains(popout) || popout.querySelector("#permissions-popout")) return;
            const mutation = {addedNodes: [popout]} as unknown as MutationRecord;
            this.patchPopouts(mutation);
        };

        this.observePopoutMount(popout);
        this.popoutMountRetries.set(popout, retryCount + 1);
        if (retryDelay === 0) void Promise.resolve().then(runRetry);
        else setTimeout(runRetry, retryDelay);
    }

    bindPopouts() {
        this.observer = this.patchPopouts.bind(this);
    }

    unbindPopouts() {
        this.observer = undefined;
    }

    async bindContextMenus() {
        this.patchChannelContextMenu();
        this.patchGuildContextMenu();
        this.patchUserContextMenu();
    }

    unbindContextMenus() {
        for (const cancel of this.contextMenuPatches) cancel();
    }

    patchGuildContextMenu() {
        this.contextMenuPatches.push(ContextMenu.patch("guild-context", (retVal: ReactElement<{children?: ReactElement[];}>, props) => {
            if (!props?.guild) return retVal; // Ignore non-guild items
            const newItem = ContextMenu.buildItem({
                label: this.strings.contextMenuLabel,
                action: () => {
                    this.createModalGuild(props.guild.name, props.guild);
                }
            });
            retVal.props.children?.splice(1, 0, newItem);
        }));
    }

    patchChannelContextMenu() {
        this.contextMenuPatches.push(ContextMenu.patch("channel-context", (retVal: ReactElement<{children?: ReactElement[];}>, props) => {
            const newItem = ContextMenu.buildItem({
                label: this.strings.contextMenuLabel,
                action: () => {
                    if (!hasOverwrites(props.channel)) return UI.showToast(`#${props.channel.name} has no permission overrides`, {type: "info"});
                    this.createModalChannel(props.channel.name, props.channel, props.guild);
                }
            });
            retVal.props.children?.splice(1, 0, newItem);
        }));
    }

    patchUserContextMenu() {
        this.contextMenuPatches.push(ContextMenu.patch("user-context", (retVal: ReactElement<{children?: ReactElement<{children?: ReactElement[];}>[];}>, props) => {
            const guild = GuildStore?.getGuild(props.guildId);
            if (!guild) return;

            const newItem = ContextMenu.buildItem({
                label: this.strings.contextMenuLabel,
                action: () => {
                    const user = MemberStore?.getMember(props.guildId, props.user.id);
                    if (!user) return;
                    const name = user.nick ? user.nick : props.user.globalName ?? props.user.username;
                    this.createModalUser(name, user, guild);
                }
            });
            retVal?.props?.children?.[0]?.props?.children?.splice(2, 0, newItem);
        }));
    }

    createModalChannel(name: string, channel: Channel, guild: Guild) {
        return this.showModal({title: `#${name}`}, getPermissionableEntities(guild, channel));
    }

    createModalUser(name: string, user: GuildMember, guild: Guild) {
        const userInstance = UserStore?.getUser(user.userId);
        return this.showModal({
            title: name,
            avatarUrl: userInstance?.getAvatarURL(null, 128, true)
        }, getPermissionableEntities(guild, user));
    }

    createModalGuild(name: string, guild: Guild) {
        return this.showModal(
            {
                title: name,
                avatarUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128&quality=lossless` : undefined
            },
            getPermissionableEntities(guild, guild)
        );
    }

    showModal(
        title: {
            title: string;
            subtitle?: string;
            avatarUrl?: string;
        },
        entries: PermissionableEntity[]
    ) {
        const svelteMountContainer = document.createElement("div");
        svelteMountContainer.style.display = "contents";

        const temp = mount(PermissionModal, {
            target: svelteMountContainer,
            props: {
                title: title.title,
                avatarUrl: title.avatarUrl,
                subtitle: title.subtitle ?? "View effective permissions and role breakdowns",
                tabs: entries,
                onClose: () => {svelteMountContainer.remove();},
                categories: getDefinitions(SelectedGuildStore?.getGuildId() ?? ""),
                showNeutral: this.settings.showNeutral as boolean,
                onToggleShowNeutral: (value: boolean) => {
                    this.settings.showNeutral = value;
                    this.saveSettings();
                }
            }
        });
        document.querySelector<HTMLDivElement>("#app-mount")?.append(svelteMountContainer);
        DOM.onRemoved(svelteMountContainer, () => unmount(temp));
    }

    getSettingsPanel() {
        return this.buildSettingsPanel((_, id, checked) => {
            if (id == "popouts") {
                if (checked) this.bindPopouts();
                else this.unbindPopouts();
            }
            if (id == "contextMenus") {
                if (checked) this.bindContextMenus();
                else this.unbindContextMenus();
            }
        });
    }

};
