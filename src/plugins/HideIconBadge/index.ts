import Plugin from "@common/plugin";
import type {Meta} from "@betterdiscord/meta";
import Config from "./config";


interface IElectronModule {
    setBadge(n: number): void;
    setSystemTrayIcon(i: string): void;
}

const ElectronModule = BdApi.Webpack.getByKeys<IElectronModule>("setBadge");

export default class HideIconBadge extends Plugin {
    constructor(meta: Meta) {
        super(meta, Config);
    }

    onStart() {
        if (!ElectronModule) return;
        ElectronModule?.setBadge(0);
        BdApi.Patcher.before(this.meta.name, ElectronModule, "setBadge", (_, args) => {
            args[0] = 0;
        });

        ElectronModule?.setSystemTrayIcon("DEFAULT");
        BdApi.Patcher.before(this.meta.name, ElectronModule, "setSystemTrayIcon", (_, args) => {
            if (args[0] === "UNREAD") args[0] = "DEFAULT";
        });
    }
    
    onStop() {
        BdApi.Patcher.unpatchAll(this.meta.name);
    }

};
