import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {applyDistribution, checkFreshness, inputs, plugins, stageDistribution} from "./publish.mjs";

const run = (cwd, ...args) => execFileSync("git", args, {cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]}).trim();
const put = (root, file, value = file) => {const dest = path.join(root, file); mkdirSync(path.dirname(dest), {recursive: true}); writeFileSync(dest, value);};
const fixture = t => {
    const root = mkdtempSync(path.join(os.tmpdir(), "bd-publish-test-"));
    t.after(() => rmSync(root, {recursive: true, force: true}));
    const source = path.join(root, "source"), master = path.join(root, "master"), stage = path.join(root, "stage");
    for (const dir of [source, master, stage]) mkdirSync(dir);
    for (const repo of [source, master]) {run(repo, "init", "-q"); run(repo, "config", "user.name", "Test"); run(repo, "config", "user.email", "test@example.invalid"); run(repo, "config", "commit.gpgsign", "false");}
    for (const name of plugins) {
        put(source, `src/plugins/${name}/config.ts`);
        put(source, `dist/Plugins/${name}/${name}.plugin.js`);
        if (name !== "GhostPingDetector") put(master, `Plugins/${name}/README.md`, Buffer.from(`guide:${name}\n`));
    }
    for (const file of [".github/workflows/build.yml", "LICENSE", ".gitignore", ".gitattributes"]) put(source, file);
    put(master, "Archive/Plugins/BetterRoleColors/BetterRoleColors.plugin.js", Buffer.from([0, 1, 255, 10]));
    put(master, "Archive/Plugins/BetterRoleColors/README.md", Buffer.from("archived guide\n"));
    put(master, "Plugins/Stale/Stale.plugin.js"); put(master, "src/old.js");
    run(master, "add", "-A"); run(master, "commit", "-qm", "old");
    run(source, "add", "-A"); run(source, "commit", "-qm", "source");
    return {source, master, stage, sha: run(source, "rev-parse", "HEAD"), url: "https://github.com/example/repo"};
};

test("complete staging preserves archive, removes stale and source files, and is idempotent", t => {
    const f = fixture(t), archive = "Archive/Plugins/BetterRoleColors/BetterRoleColors.plugin.js";
    const bytes = readFileSync(path.join(f.master, archive));
    const guides = [...plugins.filter(n => n !== "GhostPingDetector").map(n => `Plugins/${n}/README.md`), "Archive/Plugins/BetterRoleColors/README.md"];
    const guideBytes = guides.map(file => readFileSync(path.join(f.master, file)));
    stageDistribution(f.source, f.master, f.stage, f.sha, f.url);
    applyDistribution(f.master, f.stage);
    assert.deepEqual(readFileSync(path.join(f.master, archive)), bytes);
    guides.forEach((file, index) => assert.deepEqual(readFileSync(path.join(f.master, file)), guideBytes[index]));
    assert.equal(readdirSync(path.join(f.master, "Plugins")).length, 8);
    assert.throws(() => readFileSync(path.join(f.master, "Plugins/Stale/Stale.plugin.js")));
    assert.throws(() => readFileSync(path.join(f.master, "src/old.js")));
    assert.equal(readFileSync(path.join(f.master, ".github/workflows/build.yml"), "utf8"), ".github/workflows/build.yml");
    assert.match(readFileSync(path.join(f.master, "README.md"), "utf8"), new RegExp(f.sha));
    run(f.master, "add", "-A"); run(f.master, "commit", "-qm", "published");
    rmSync(f.stage, {recursive: true}); mkdirSync(f.stage);
    stageDistribution(f.source, f.master, f.stage, f.sha, f.url);
    applyDistribution(f.master, f.stage);
    assert.equal(run(f.master, "status", "--porcelain"), "");
    guides.forEach((file, index) => assert.deepEqual(readFileSync(path.join(f.master, file)), guideBytes[index]));
});

test("missing artifact or archive fails before clearing master", t => {
    const f = fixture(t);
    rmSync(path.join(f.source, `dist/Plugins/${plugins[0]}/${plugins[0]}.plugin.js`));
    assert.throws(() => stageDistribution(f.source, f.master, f.stage, f.sha, f.url));
    assert.throws(() => applyDistribution(f.master, f.stage));
    assert.equal(run(f.master, "status", "--porcelain"), "");
    rmSync(f.stage, {recursive: true}); mkdirSync(f.stage);
    put(f.source, `dist/Plugins/${plugins[0]}/${plugins[0]}.plugin.js`);
    run(f.master, "rm", "-q", "Archive/Plugins/BetterRoleColors/BetterRoleColors.plugin.js"); run(f.master, "commit", "-qm", "remove archive");
    assert.throws(() => stageDistribution(f.source, f.master, f.stage, f.sha, f.url));
    assert.throws(() => applyDistribution(f.master, f.stage));
    assert.equal(run(f.master, "status", "--porcelain"), "");
    const missingGuide = fixture(t);
    run(missingGuide.master, "rm", "-q", "Plugins/DoNotTrack/README.md"); run(missingGuide.master, "commit", "-qm", "remove guide");
    assert.throws(() => stageDistribution(missingGuide.source, missingGuide.master, missingGuide.stage, missingGuide.sha, missingGuide.url));
    assert.throws(() => applyDistribution(missingGuide.master, missingGuide.stage));
    assert.equal(run(missingGuide.master, "status", "--porcelain"), "");
});

test("freshness allows only irrelevant descendants", t => {
    const f = fixture(t);
    put(f.source, "README.md", "docs"); run(f.source, "add", "-A"); run(f.source, "commit", "-qm", "docs");
    const docs = run(f.source, "rev-parse", "HEAD");
    assert.doesNotThrow(() => checkFreshness(f.source, f.sha, docs));
    put(f.source, "src/plugins/DoNotTrack/config.ts", "changed"); run(f.source, "add", "-A"); run(f.source, "commit", "-qm", "code");
    assert.throws(() => checkFreshness(f.source, f.sha, "HEAD"));
    put(f.source, ".github/ISSUE_TEMPLATE/bug.yml", "template"); run(f.source, "add", "-A"); run(f.source, "commit", "-qm", "template");
    assert.throws(() => checkFreshness(f.source, "HEAD~1", "HEAD"));
    assert.throws(() => checkFreshness(f.source, "HEAD", f.sha));
    assert.throws(() => checkFreshness(f.source, "missing-ref", "HEAD"));
});

test("workflow paths and freshness inputs remain identical", () => {
    const yaml = readFileSync(new URL("../.github/workflows/build-generated-plugins.yml", import.meta.url), "utf8");
    const paths = [...yaml.matchAll(/^ {6}- "([^"]+)"$/gm)].map(match => match[1]);
    assert.deepEqual(paths, inputs);
});
