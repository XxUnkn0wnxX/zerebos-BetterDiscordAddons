# BetterDiscordAddons

This is a fork of [zerebos/BetterDiscordAddons](https://github.com/zerebos/BetterDiscordAddons), a collection of BetterDiscord plugins. [master](https://github.com/XxUnkn0wnxX/zerebos-BetterDiscordAddons/tree/master) is the default branch and contains the built plugins for download; `develop` contains the source.

## Plugins

- BetterFormattingRedux
- BlurNSFW
- DoNotTrack
- GhostPingDetector
- HideDisabledEmojis
- HideIconBadge
- PermissionsViewer
- RoleMembers

Download the desired `.plugin.js` from its directory on [master](https://github.com/XxUnkn0wnxX/zerebos-BetterDiscordAddons/tree/master/Plugins) and place it in BetterDiscord's plugins folder.

## Building

Make source changes and open pull requests against `develop`.

Install the dependencies with `bun install --frozen-lockfile`, then build an individual plugin:

```sh
bun run build PermissionsViewer
bun run build PermissionsViewer --watch
```

Builds are written to `dist/Plugins/<PluginName>/<PluginName>.plugin.js`. Add `--install` to explicitly copy each build to your existing BetterDiscord plugins folder. Without it, builds and watch mode do not access that folder.

For a manually dispatched publication, select the `develop` branch when starting the workflow.

## Archive

[BetterRoleColors source](Archive/src/plugins/BetterRoleColors) is retained here; its [documentation](https://github.com/XxUnkn0wnxX/zerebos-BetterDiscordAddons/blob/master/Archive/Plugins/BetterRoleColors/README.md) is on master. Its [last retained build](https://github.com/XxUnkn0wnxX/zerebos-BetterDiscordAddons/tree/master/Archive/Plugins/BetterRoleColors) is on master and is not rebuilt by the publication workflow.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE).
