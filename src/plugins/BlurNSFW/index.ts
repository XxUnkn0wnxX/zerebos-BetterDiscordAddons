import type {Component, ReactElement} from "react";

import Plugin from "@common/plugin";
import formatString from "@common/formatstring";

import type {Meta} from "@betterdiscord/meta";

import type {Channel} from "@discord";
import type {ClassModule, FluxStore} from "@discord/modules";

import Config from "./config";

import Events from "events";


const {ContextMenu, DOM, Webpack, Patcher} = BdApi;

const SelectedChannelStore = Webpack.getModule<FluxStore & {getChannelId(): string}>(m => m.getCurrentlySelectedChannelId);
const ChannelStore = Webpack.getModule<{getChannel(id: string): Channel}>(m => m.getDMFromUserId);
const InlineMediaWrapper = Webpack.getByPrototypeKeys<Component & {prototype: Component}>("getSrc", "getRatio");
const WrapperClasses = Webpack.getModule<ClassModule>(m => m.wrapperPlaying);
const Dispatcher = new Events();

const STYLES = `
{{blurOnFocus}}
.${WrapperClasses?.wrapperPlaying.split(" ").join(".")} video,
.${WrapperClasses?.wrapperControlsHidden.split(" ").join(".")} video,
.blur:hover img,
.blur:hover video,
a:hover + div > .blur {
    transition: {{time}}ms cubic-bezier(.2, .11, 0, 1) !important;
    filter: blur(0px) !important;
}

.blur img,
.blur video {
    filter: blur({{size}}px) !important;
    transition: {{time}}ms cubic-bezier(.2, .11, 0, 1) !important;
}`;

export default class BlurMedia extends Plugin {
    constructor(meta: Meta) {
        super(meta, Config);
        this.meta = meta;

        this.contextPatches = [];
        this.channelChange = this.channelChange.bind(this);
    }

    blurredChannels: Set<string>;
    seenChannels: Set<string>;
    contextPatches: (() => void)[];

    onStart() {
        this.blurredChannels = new Set<string>(BdApi.Data.load(this.meta.name, "blurred") ?? []);
        this.seenChannels = new Set(BdApi.Data.load(this.meta.name, "seen") ?? []);

        if (!InlineMediaWrapper || !InlineMediaWrapper.prototype) return;

        Patcher.after(this.meta.name, InlineMediaWrapper.prototype, "render", (_, __, retVal) => {
            const channel = ChannelStore?.getChannel(SelectedChannelStore?.getChannelId() ?? "");
            if (!this.hasBlur(channel)) return;
            if (retVal.props.className) retVal.props.className = retVal.props.className + " blur";
            else retVal.props.className = "blur";
        });

        Patcher.after(this.meta.name, InlineMediaWrapper.prototype, "componentDidMount", (thisObject: Component & {cancelBlurListener?(): void;}) => {
            if (thisObject.cancelBlurListener) return;
            const listener = () => thisObject.forceUpdate();
            Dispatcher.on("blur", listener);
            thisObject.cancelBlurListener = () => Dispatcher.off("blur", listener);
        });

        Patcher.after(this.meta.name, InlineMediaWrapper.prototype, "componentWillUnmount", (thisObject: Component & {cancelBlurListener?(): void;}) => {
            if (!thisObject.cancelBlurListener) return;
            thisObject.cancelBlurListener();
            delete thisObject.cancelBlurListener;
        });

        this.addStyle();

        SelectedChannelStore?.addChangeListener(this.channelChange);

        this.patchContextMenus();
    }

    onStop() {
        BdApi.Data.save(this.meta.name, "blurred", this.blurredChannels);
        BdApi.Data.save(this.meta.name, "seen", this.seenChannels);
        this.contextPatches.forEach(cancel => cancel());
        this.removeStyle();
        SelectedChannelStore?.removeChangeListener(this.channelChange);
    }

    hasBlur(channel?: Channel) {
        if (!channel) return false;
        return this.blurredChannels.has(channel.id);
    }

    addBlur(channel?: Channel) {
        if (!channel) return;
        this.blurredChannels.add(channel.id);
        Dispatcher.emit("blur");
        BdApi.Data.save(this.meta.name, "blurred", this.blurredChannels);
    }

    removeBlur(channel?: Channel) {
        if (!channel) return;
        this.blurredChannels.delete(channel.id);
        Dispatcher.emit("blur");
        BdApi.Data.save(this.meta.name, "blurred", this.blurredChannels);
    }

    channelChange() {
        const channel = ChannelStore?.getChannel(SelectedChannelStore?.getChannelId() ?? "");
        if (!channel?.id || this.seenChannels.has(channel.id)) return;

        this.seenChannels.add(channel.id);
        BdApi.Data.save(this.meta.name, "seen", this.seenChannels);
        if (this.settings.blurNSFW && channel.nsfw) this.addBlur(channel);
    }

    patchContextMenus() {
        const patchFunction = (retVal: ReactElement, props: Record<string, unknown> & {channel?: Channel}) => {
            const newItem = ContextMenu.buildItem({
                type: "toggle",
                label: "Blur Media",
                active: this.hasBlur(props.channel),
                action: () => {
                    if (this.hasBlur(props.channel)) this.removeBlur(props.channel);
                    else this.addBlur(props.channel);
                }
            });

            (retVal.props as {children?: ReactElement[]})?.children?.splice(1, 0, newItem);
        };

        ["user-context", "channel-context", "gdm-context"].forEach(contextName => {
            this.contextPatches.push(ContextMenu.patch(contextName, patchFunction));
        });
    }

    addStyle() {
        const styleString = formatString(STYLES, {
            size: Math.round(this.settings.blurSize as number),
            time: Math.round(this.settings.blurTime as number),
            blurOnFocus: this.settings.blurOnFocus ? "" : ".layer-1Ixpg3 .blur img,"
        });
        DOM.addStyle(this.meta.name, styleString);
    }

    removeStyle() {
        DOM.removeStyle(this.meta.name);
    }

    getSettingsPanel() {
       return this.buildSettingsPanel(() => {
            this.removeStyle();
            this.addStyle();
        });
    }

};
