import {execFileSync, spawnSync} from "node:child_process";
import {cpSync, existsSync, mkdirSync, readdirSync, rmSync, rmdirSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const plugins = ["BetterFormattingRedux", "BlurNSFW", "DoNotTrack", "GhostPingDetector", "HideDisabledEmojis", "HideIconBadge", "PermissionsViewer", "RoleMembers"];
// These match the workflow's push paths; keep both lists in sync.
export const inputs = ["src/**", "scripts/**", "package.json", "bun.lock", "tsconfig.json", "eslint.config.js", ".github/**", "LICENSE", ".gitignore", ".gitattributes"];
const git = (cwd, ...args) => execFileSync("git", args, {cwd, encoding: "utf8"});
const required = file => {if (!existsSync(file)) throw new Error(`Missing required file: ${file}`); return file;};
const copy = (src, dest) => {mkdirSync(path.dirname(dest), {recursive: true}); cpSync(required(src), dest);};

export function checkFreshness(repo, built, current) {
    // merge-base exits 1 for a non-ancestor and other errors must also fail.
    git(repo, "merge-base", "--is-ancestor", built, current);
    const result = spawnSync("git", ["diff", "--quiet", built, current, "--", ...inputs.map(p => `:(glob)${p}`)], {cwd: repo});
    if (result.error || result.status !== 0) throw new Error(`Publication inputs changed or git diff failed (status ${result.status})`);
}

export function stageDistribution(source, master, stage, sha, repository) {
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("Expected full source SHA");
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error("Invalid repository URL");
    if (readdirSync(stage).length) throw new Error("Staging directory must be empty");
    const actual = readdirSync(path.join(source, "src/plugins"), {withFileTypes: true}).filter(e => e.isDirectory() && existsSync(path.join(source, "src/plugins", e.name, "config.ts"))).map(e => e.name).sort();
    if (JSON.stringify(actual) !== JSON.stringify([...plugins].sort())) throw new Error("Unexpected active plugin configs");
    const retain = file => {
        const bytes = execFileSync("git", ["show", `HEAD:${file}`], {cwd: master});
        const dest = path.join(stage, file);
        mkdirSync(path.dirname(dest), {recursive: true});
        writeFileSync(dest, bytes);
        return bytes;
    };
    for (const name of plugins) {
        copy(path.join(source, "dist/Plugins", name, `${name}.plugin.js`), path.join(stage, "Plugins", name, `${name}.plugin.js`));
        if (name !== "GhostPingDetector") retain(`Plugins/${name}/README.md`);
    }
    const archived = "Archive/Plugins/BetterRoleColors/BetterRoleColors.plugin.js";
    if (!retain(archived).length) throw new Error("Archived plugin is empty");
    retain("Archive/Plugins/BetterRoleColors/README.md");
    for (const file of ["LICENSE", ".gitignore", ".gitattributes"]) copy(path.join(source, file), path.join(stage, file));
    cpSync(required(path.join(source, ".github")), path.join(stage, ".github"), {recursive: true});
    const listing = plugins.map(name => `- [${name}](${repository}/raw/refs/heads/master/Plugins/${name}/${name}.plugin.js)${name === "GhostPingDetector" ? "" : ` · [Guide](Plugins/${name}/README.md)`}`).join("\n");
    writeFileSync(path.join(stage, "README.md"), `# BetterDiscordAddons downloads\n\nBuilt from [source commit ${sha}](${repository}/tree/${sha}). This fork is based on [zerebos/BetterDiscordAddons](https://github.com/zerebos/BetterDiscordAddons). For source and build instructions, see [develop](${repository}/tree/develop).\n\nDownload a plugin below and place the \`.plugin.js\` file in BetterDiscord's plugins folder.\n\n## Plugins\n\n${listing}\n\n## Archive\n\n[BetterRoleColors](${repository}/raw/refs/heads/master/Archive/Plugins/BetterRoleColors/BetterRoleColors.plugin.js) is a retained historical build; it is not rebuilt by this workflow. [Guide](Archive/Plugins/BetterRoleColors/README.md).\n`);
}

export function applyDistribution(master, stage) {
    if (git(master, "status", "--porcelain", "--untracked-files=all").trim()) throw new Error("Distribution worktree must be clean");
    // Stage must have been completed before any tracked file is removed.
    for (const name of plugins) required(path.join(stage, "Plugins", name, `${name}.plugin.js`));
    for (const file of [".github", "README.md", "LICENSE", ".gitignore", ".gitattributes", "Archive/Plugins/BetterRoleColors/BetterRoleColors.plugin.js", "Archive/Plugins/BetterRoleColors/README.md"]) required(path.join(stage, file));
    for (const name of plugins.filter(n => n !== "GhostPingDetector")) required(path.join(stage, "Plugins", name, "README.md"));
    const tracked = git(master, "ls-files", "-z").split("\0").filter(Boolean);
    for (const file of tracked) rmSync(path.join(master, file), {force: true});
    const dirs = new Set();
    for (const file of tracked) {
        let dir = path.dirname(file);
        while (dir !== ".") {dirs.add(dir); dir = path.dirname(dir);}
    }
    for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
        try {rmdirSync(path.join(master, dir));}
 catch (error) {if (error.code !== "ENOTEMPTY" && error.code !== "ENOENT") throw error;}
    }
    for (const entry of readdirSync(stage)) cpSync(path.join(stage, entry), path.join(master, entry), {recursive: true});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [command, ...args] = process.argv.slice(2);
    if (command === "stage" && args.length === 5) stageDistribution(...args);
    else if (command === "apply" && args.length === 2) applyDistribution(...args);
    else if (command === "fresh" && args.length === 3) checkFreshness(...args);
    else throw new Error("Usage: publish.mjs stage SOURCE MASTER STAGE SHA REPOSITORY | apply MASTER STAGE | fresh REPO BUILT CURRENT");
}
