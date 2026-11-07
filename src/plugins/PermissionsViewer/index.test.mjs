import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

const source = await readFile(new URL("./index.ts", import.meta.url), "utf8");
const sourceFile = ts.createSourceFile("index.ts", source, ts.ScriptTarget.Latest, true);
const helperNames = new Set([
    "formatPermissionName",
    "getPermissionLabel",
    "classModuleToMap",
    "getPermissionStyleClasses"
]);
const helperSource = sourceFile.statements
    .filter(statement => ts.isFunctionDeclaration(statement) && helperNames.has(statement.name?.text))
    .map(statement => statement.getText(sourceFile))
    .join("\n");
const compiledHelpers = ts.transpileModule(helperSource, {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None}
}).outputText;
const context = vm.createContext({});
vm.runInContext(`${compiledHelpers}\nglobalThis.helpers = {formatPermissionName, getPermissionLabel, getPermissionStyleClasses};`, context);
const {getPermissionLabel, getPermissionStyleClasses} = context.helpers;

test("unknown permission names get readable labels without calling Discord localization", () => {
    let calls = 0;
    const label = getPermissionLabel("MANAGE_OFFICIAL_MESSAGES", {}, {
        intl: {string() {calls++; return "unexpected";}},
        t: {}
    });

    assert.equal(label, "Manage Official Messages");
    assert.equal(calls, 0);
});

test("missing Discord translation tokens fall back without calling intl.string", () => {
    let calls = 0;
    const label = getPermissionLabel("MANAGE_OFFICIAL_MESSAGES", {MANAGE_OFFICIAL_MESSAGES: "missingAlias"}, {
        intl: {string() {calls++; return "unexpected";}},
        t: {}
    });

    assert.equal(label, "Manage Official Messages");
    assert.equal(calls, 0);
});

test("known permission localization keeps function tokens and the intl receiver", () => {
    const token = () => "opaque Discord token";
    const intl = {
        string(receivedToken) {
            assert.equal(this, intl);
            assert.equal(receivedToken, token);
            return "View Channels";
        }
    };

    assert.equal(getPermissionLabel("VIEW_CHANNEL", {VIEW_CHANNEL: "viewAlias"}, {
        intl,
        t: {viewAlias: token}
    }), "View Channels");
});

test("modern Discord typography modules populate legacy template keys", () => {
    const classes = getPermissionStyleClasses((...keys) => {
        if (keys[0] === "body-xs/semibold") {
            return {"body-xs/semibold": "modern-semibold", "body-xs/normal": "modern-normal"};
        }
        if (keys[0] === "defaultColor" && keys.length === 1) return {defaultColor: "native-default-color"};
        return undefined;
    });

    assert.equal(classes["text-xs/semibold"], "modern-semibold");
    assert.equal(classes["text-xs/normal"], "modern-normal");
    assert.equal(classes.defaultColor, "native-default-color");
});

test("legacy typography classes remain preferred when available", () => {
    const classes = getPermissionStyleClasses((...keys) => {
        if (keys[0] === "text-xs/semibold") {
            return {"text-xs/semibold": "legacy-semibold", "text-xs/normal": "legacy-normal"};
        }
        if (keys[0] === "body-xs/semibold") return {"body-xs/semibold": "modern-semibold", "body-xs/normal": "modern-normal"};
        if (keys[0] === "defaultColor" && keys.length === 2) return undefined;
        if (keys[0] === "defaultColor") return {defaultColor: "native-default-color"};
        return undefined;
    });

    assert.equal(classes["text-xs/semibold"], "legacy-semibold");
    assert.equal(classes["text-xs/normal"], "legacy-normal");
});
