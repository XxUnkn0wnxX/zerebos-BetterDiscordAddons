import Plugin from "@common/plugin";

import type {Meta} from "@betterdiscord/meta";

import type {Channel, Message, User} from "@discord";

import Config from "./config";
import type {Dispatcher as IDispatcher} from "@discord/modules";


const {Logger, Patcher, Webpack} = BdApi;

const MessageStore = Webpack.getStore<{getMessage(cid: string, id: string): Message}>("MessageStore");
const UserStore = Webpack.getStore<{getUser(id: string): User}>("UserStore");
const ChannelStore = Webpack.getStore<{getChannel(id: string): Channel}>("ChannelStore");
const ImageResolver = Webpack.getByKeys<{getUserAvatarURL(u: User): string;}>("getUserAvatarURL", "getGuildIconURL");
const Dispatcher = Webpack.getByKeys<IDispatcher>("dispatch", "subscribe");

export default class GhostPingDetector extends Plugin {
    constructor(meta: Meta) {super(meta, Config);}

    onStart() {
        if (!Dispatcher) return Logger.error(this.meta.name, "Could not locate Dispatcher!");
        Patcher.before(this.meta.name, Dispatcher, "dispatch", (_, args: [{type: string, id: string, channelId: string}]) => {
            const event = args[0];
            if (!event || !event.type || event.type !== "MESSAGE_DELETE") return;
            const message = MessageStore?.getMessage(event.channelId, event.id);
            if (!message) return false;
            if (message.mentioned) {
                const user = UserStore?.getUser(message.author.id);
                if (!user) return false;
                const icon = ImageResolver?.getUserAvatarURL(user);
                const channel = ChannelStore?.getChannel(event.channelId);
                const body = `New ghost ping by ${user.tag} in #${channel?.name ?? "Unknown"}.`;
                const onclick = () => {Logger.info(this.meta.name, message);};
                const notification = new Notification("Ghost Ping", {body, icon, requireInteraction: true});
                notification.onclick = onclick;
            }
            return false;
        });
    }
    
    onStop() {
        Patcher.unpatchAll(this.meta.name);
    }
};
