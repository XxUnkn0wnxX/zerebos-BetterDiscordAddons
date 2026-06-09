import Plugin from "@common/plugin";

import type {Meta} from "@betterdiscord/meta";

import Config from "./config";
import ToolbarData from "./toolbar";
import Languages from "./languages";
import CSS from "./styles.css";
import ToolbarHTML from "./toolbar.html";
import type {SettingGroup} from "@betterdiscord/api/ui";
import type {Component, RefObject} from "react";
import type {Message} from "@discord";
import type {ClassModule} from "@discord/modules";



const {ContextMenu, DOM, Patcher, UI, ReactUtils, Webpack, Logger} = BdApi;

const MessageActions = Webpack.getByKeys<{sendMessage(): void}>("jumpToMessage", "_sendMessage");
const TextareaClasses = Webpack.getByKeys<ClassModule>("channelTextArea", "textArea") ?? {textArea: "textArea_bdf0de"};

export default class BetterFormattingRedux extends Plugin {
    customWrappers: string[];
    buttonOrder: string[];

    discordWrappers: Record<string, string> = {bold: "**", italic: "*", underline: "__", strikethrough: "~~", code: "`", codeblock: "```", spoiler: "||"};
    isOpen: boolean = false;
    replaceList = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}";
    smallCapsList = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ{|}";
    superscriptList = " !\"#$%&'⁽⁾*⁺,⁻./⁰¹²³⁴⁵⁶⁷⁸⁹:;<⁼>?@ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁνᵂˣʸᶻ[\\]^_`ᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ{|}";
    upsideDownList = " ¡\"#$%℘,)(*+'-˙/0Ɩ↊Ɛ߈ϛ9ㄥ86:;>=<¿@∀ᗺƆᗡƎℲꓨHIՐꓘꓶWNOԀꝹꓤSꓕꓵΛMX⅄Z]\\[^‾,ɐqɔpǝɟᵷɥᴉɾʞꞁɯuodbɹsʇnʌʍxʎz}|{";
    fullwidthList = "　！＂＃＄％＆＇（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ［＼］＾＿｀ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ｛｜｝";
    leetList = " !\"#$%&'()*+,-./0123456789:;<=>?@48CD3FG#IJK1MN0PQЯ57UVWXY2[\\]^_`48cd3fg#ijk1mn0pqЯ57uvwxy2{|}";
    thiccList = "　!\"#$%&'()*+,-./0123456789:;<=>?@卂乃匚刀乇下厶卄工丁长乚从ん口尸㔿尺丂丅凵リ山乂丫乙[\\]^_`卂乃匚刀乇下厶卄工丁长乚从ん口尸㔿尺丂丅凵リ山乂丫乙{|}";

    constructor(meta: Meta) {
        super(meta, Config);

        this.customWrappers = (this.manifest.config?.find(g => g.id === "wrappers") as SettingGroup).settings.map(s => s.id);
        this.buttonOrder = (this.manifest.config?.find(g => g.id === "toolbar") as SettingGroup).settings.map(s => s.id);
    }

    async onStart() {
        // await PluginUtilities.addScript("sortableScript", "//zerebos.github.io/BetterDiscordAddons/Plugins/Sortable.js");
        DOM.addStyle(this.meta.name + "-style", CSS);
        this.setupToolbar();

        if (!MessageActions) return Logger.error(this.meta.name, "Could not find MessageActions module!");
        Patcher.before(this.meta.name, MessageActions, "sendMessage", (_, [, msg]: [unknown, Message]) => {
            msg.content = this.format(msg.content);
        });
    }

    onStop() {
        Patcher.unpatchAll(this.meta.name);
        // $("*").off("." + this.meta.name);
        document.querySelector(".bf-toolbar")?.remove();
        // PluginUtilities.removeScript("sortableScript");
        DOM.removeStyle(this.meta.name + "-style");
    }

    observer(e: MutationRecord) {
        if (!e.addedNodes.length || !(e.addedNodes[0] instanceof Element)) return;

        const elem = e.addedNodes[0];
        const textarea = elem.matches(`.${TextareaClasses.textArea}`) ? elem : elem.querySelector(`.${TextareaClasses.textArea}`);
        if (textarea) this.addToolbar(textarea as HTMLDivElement);
    }

    updateStyle() {
        this.updateSide();
        this.updateOpacity();
        this.updateFontSize();
    }

    updateSide() {
        const toolbar = document.querySelector(".bf-toolbar");
        if (!toolbar) return;
        if (this.settings.rightSide) toolbar.classList.remove("bf-left");
        else toolbar.classList.add("bf-left");
    }

    updateOpacity() {
        const toolbar = document.querySelector<HTMLDivElement>(".bf-toolbar");
        if (!toolbar) return;
        toolbar.style.opacity = this.settings.toolbarOpacity as string;
    }

    updateFontSize() {
        const toolbar = document.querySelector<HTMLDivElement>(".bf-toolbar");
        if (!toolbar) return;
        toolbar.style.fontSize = this.settings.fontSize + "%";
    }

    openClose() {
        this.isOpen = !this.isOpen;
        const toolbar = document.querySelector<HTMLDivElement>(".bf-toolbar");
        if (!toolbar) return;
        toolbar.classList.toggle("bf-visible");
    }

    escape(s: string) {
        return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    }

    doFormat(text: string, wrapper: string, offset: number) {

        // If this is not a wrapper, return original
        if (text.substring(offset, offset + wrapper.length) != wrapper) return text;

        let returnText = text;
        const len = text.length;
        const begin = text.indexOf(wrapper, offset);

        if (text[begin - 1] == "\\") return text; // If the wrapper is escaped, remove the backslash and return the text

        let end = text.indexOf(wrapper, begin + wrapper.length);
        if (end != -1) end += wrapper.length - 1;

        // Making it to this point means that we have found a full wrapper
        // This block performs inner chaining
        if (this.settings.chainFormats) {
            for (let w = 0; w < this.customWrappers.length; w++) {
                const newText = this.doFormat(returnText, this.settings[this.customWrappers[w]] as string, begin + wrapper.length);
                if (returnText != newText) {
                    returnText = newText;
                    end = end - (this.settings[this.customWrappers[w]] as string).length * 2;
                }
            }
        }

        returnText = returnText.replace(new RegExp(`([^]{${begin}})${this.escape(wrapper)}([^]*)${this.escape(wrapper)}([^]{${len - end - 1}})`), (match, before, middle, after) => {
            let letterNum = 0;
            middle = middle.replace(/./g, (letter: string) => {
                const index = this.replaceList.indexOf(letter);
                letterNum += 1;
                if (wrapper == this.settings.fullwidthWrapper) {
                    if (this.settings.fullWidthMap) return index != -1 ? this.fullwidthList[index] : letter;
                    return index != -1 ? letterNum == middle.length ? letter.toUpperCase() : letter.toUpperCase() + " " : letter;
                }
                else if (wrapper == this.settings.superscriptWrapper) {return index != -1 ? this.superscriptList[index] : letter;}
                else if (wrapper == this.settings.smallcapsWrapper) {return index != -1 ? this.smallCapsList[index] : letter;}
                else if (wrapper == this.settings.upsidedownWrapper) {return index != -1 ? this.upsideDownList[index] : letter;}
                else if (wrapper == this.settings.leetWrapper) {return index != -1 ? this.leetList[index] : letter;}
                else if (wrapper == this.settings.thiccWrapper) {return index != -1 ? this.thiccList[index] : letter;}
                else if (wrapper == this.settings.variedWrapper) {
                    const compare = this.settings.startCaps ? 1 : 0;
                    if (letter.toLowerCase() == letter.toUpperCase()) letterNum = letterNum - 1;
                    return index != -1 ? letterNum % 2 == compare ? letter.toUpperCase() : letter.toLowerCase() : letter;
                }
                else if (wrapper == this.settings.firstcapsWrapper) {
                    if (letterNum == 1 || middle[letterNum - 2] === " ") return letter.toUpperCase();
                }
                else if (wrapper == this.settings.uppercaseWrapper) {return letter.toUpperCase();}
                else if (wrapper == this.settings.lowercaseWrapper) {return letter.toLowerCase();}
                return letter;
            });
            if (wrapper == this.settings.upsidedownWrapper && this.settings.reorderUpsidedown) return before + middle.split("").reverse().join("") + after;
            return before + middle + after;
        });

        return returnText;
    }

    format(string: string) {
        let text = string;
        for (let i = 0; i < text.length; i++) {
            if (text[i] == "`") {
                const next = text.indexOf("`", i + 1);
                if (next != -1) i = next;
            }
            else if (text[i] == "@") {
                const match = /@.*#[0-9]*/.exec(text.substring(i));
                if (match && match.index == 0) i += match[0].length - 1;
            }
            else {
                for (let w = 0; w < this.customWrappers.length; w++) {
                    if (!this.settings[this.customWrappers[w].replace("Wrapper", "Format")]) continue;
                    const newText = this.doFormat(text, this.settings[this.customWrappers[w]] as string, i);
                    if (text != newText) {
                        text = newText;
                        i = i - (this.settings[this.customWrappers[w]] as string).length * 2;
                    }
                }
            }
        }
        if (this.settings.closeOnSend) document.querySelector(".bf-toolbar")?.classList.remove("bf-visible");
        return text;
    }

    async wrapSelection(leftWrapper: string, rightWrapper?: string) {
        if (!rightWrapper) rightWrapper = leftWrapper;
        if (leftWrapper.startsWith("```")) leftWrapper = leftWrapper + "\n";
        if (rightWrapper.startsWith("```")) rightWrapper = "\n" + rightWrapper;
        const textarea = document.querySelector<HTMLDivElement | HTMLTextAreaElement>(`.${TextareaClasses.textArea}`);
        if (!textarea) return;
        if (textarea.tagName === "TEXTAREA") return this.oldWrapSelection(textarea as HTMLTextAreaElement, leftWrapper, rightWrapper);
        const slateNode = ReactUtils.getOwnerInstance(textarea) as Component & {focus(): void; ref: RefObject<{getSlateEditor(): {selection: {anchor: {path: string, offset: number}, focus: {path: string, offset: number}}, apply<T>(o: T): void;};}>;};
        const slate = slateNode?.ref?.current?.getSlateEditor();
        if (!slate) return; // bail out if no slate

        let offset; // new cursor offset

        if (slate.selection.anchor.offset <= slate.selection.focus.offset) {
            offset = slate.selection.focus.offset + leftWrapper.length;
            slate.apply({type: "insert_text", text: leftWrapper, path: slate.selection.anchor.path, offset: slate.selection.anchor.offset});
            slate.apply({type: "insert_text", text: rightWrapper, path: slate.selection.focus.path, offset: slate.selection.focus.offset});
        }
        else {
            offset = slate.selection.anchor.offset + leftWrapper.length;
            slate.apply({type: "insert_text", text: rightWrapper, path: slate.selection.anchor.path, offset: slate.selection.anchor.offset});
            slate.apply({type: "insert_text", text: leftWrapper, path: slate.selection.focus.path, offset: slate.selection.focus.offset});
        }

        // new selection data
        const newSelection = {
            anchor: {path: slate.selection.anchor.path, offset: offset},
            focus: {path: slate.selection.focus.path, offset: offset}
        };

        slate.selection = newSelection; // update selection data
        slate.apply({type: "insert_text", text: "", path: slate.selection.anchor.path, offset: offset}); // update cursor position
        slateNode.focus();
    }

    oldWrapSelection(textarea: HTMLTextAreaElement, leftWrapper: string, rightWrapper: string) {
        let text = textarea.value;
        const start = textarea.selectionStart;
        const len = text.substring(textarea.selectionStart, textarea.selectionEnd).length;
        text = leftWrapper + text.substring(textarea.selectionStart, textarea.selectionEnd) + rightWrapper;
        textarea.focus();
        document.execCommand("insertText", false, text);
        textarea.selectionStart = start + leftWrapper.length;
        textarea.selectionEnd = textarea.selectionStart + len;
    }

    getContextMenu() {
        return ContextMenu.buildMenu(
            Object.keys(Languages).map((letter: keyof typeof Languages) => {
                return {
                    type: "submenu",
                    label: letter,
                    items: Object.keys(Languages[letter]).map(language => {
                        return {
                            label: Languages[letter][language as keyof typeof Languages[keyof typeof Languages]],
                            action: () => {this.wrapSelection("```" + language, "```");}
                        };
                    })
                };
            })
        );
    }

    buildToolbar() {
        const toolbar = DOM.parseHTML(ToolbarHTML) as HTMLDivElement;
        const sorted = this.buttonOrder;
        for (let i = 0; i < sorted.length; i++) {
            const key = sorted[i].replace("Button", "") as keyof typeof ToolbarData;
            const button = DOM.parseHTML("<div class='format'>") as HTMLDivElement;
            if (!ToolbarData[key]) continue;
            button.classList.add(ToolbarData[key].type);
            UI.createTooltip(button, ToolbarData[key].name);
            if (!this.settings[key + "Button"]) button.classList.add("disabled");
            if (key === "codeblock") {
                const contextMenu = this.getContextMenu();
                button.addEventListener("contextmenu", (e) => {
                    ContextMenu.open(e, contextMenu, {align: "bottom"});
                });
            }
            button.dataset.name = sorted[i].replace("Button", "");
            if (this.settings.useIcons) button.innerHTML = ToolbarData[key].icon;
            else button.innerHTML = ToolbarData[key].displayName;
            toolbar.append(button);
        }
        // window.Sortable.create(toolbar, {
        //     draggable: ".format", // css-selector of elements, which can be sorted
        //     ghostClass: "ghost",
        //     onUpdate: () => {
        //         const buttons = toolbar.querySelectorAll(".format");
        //         for (let i = 0; i < buttons.length; i++) {
        //             this.buttonOrder[i] = buttons[i].dataset.name;
        //         }
        //         PluginUtilities.saveData(this.meta.name, "buttonOrder", this.buttonOrder);
        //     }
        // });
        if (!this.settings.useIcons) {
            toolbar.addEventListener("mousemove", (e) => {
                const target = e.currentTarget as HTMLDivElement;
                const pos = e.pageX - (target.parentElement?.getBoundingClientRect()?.left ?? 0);
                const width = parseInt(getComputedStyle(target).width);
                let diff = -1 * width;
                Array.from(target.children).forEach((elem: HTMLElement) => {
                    diff += elem.offsetWidth;
                });
                target.scrollLeft = (pos / width * diff);
            });
        }

        return toolbar;
    }

    setupToolbar() {
        document.querySelector(".bf-toolbar")?.remove();
        document.querySelectorAll(`.${TextareaClasses.textArea}`).forEach(elem => {
            this.addToolbar(elem.children[0] as HTMLDivElement);
        });
    }

    addToolbar(textarea: HTMLDivElement) {
        const toolbarElement = this.buildToolbar();
        if (this.settings.hoverOpen == true) toolbarElement.classList.add("bf-hover");
        if (this.isOpen) toolbarElement.classList.add("bf-visible");

        const inner = textarea.parentElement?.parentElement;
        if (!inner) return;
        inner.parentElement?.insertBefore(toolbarElement, inner.nextSibling);

        toolbarElement.addEventListener("click", (e: MouseEvent & {target: HTMLDivElement}) => {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest("div");
                if (!button) return;
                if (button.classList.contains("bf-arrow")) {
                    if (!this.settings.hoverOpen) this.openClose();
                }
                else if (button.classList.contains("format")) {
                    if (!button.dataset.name) return;
                    let wrapper = "";
                    if (button.classList.contains("native-format")) wrapper = this.discordWrappers[button.dataset.name];
                    else wrapper = this.settings[button.dataset.name + "Wrapper"] as string;
                    this.wrapSelection(wrapper);
                }
            });

        this.updateStyle();
    }

    getSettingsPanel() {
        return this.buildSettingsPanel(this.updateSettings.bind(this));
    }

    updateSettings(group: string, id: string, value: unknown) {

        if (group == "toolbar") this.setupToolbar();
        if (group == "plugin" && id == "hoverOpen") {
            const toolbar = document.querySelector(".bf-toolbar");
            if (value) {
                toolbar?.classList.remove("bf-visible");
                toolbar?.classList.add("bf-hover");
            }
            else {
                toolbar?.classList.remove("bf-hover");
            }
        }

        if (group == "style") {
            if (id == "icons") this.setupToolbar();
            if (id == "rightSide") this.updateSide();
            if (id == "toolbarOpacity") this.updateOpacity();
            if (id == "fontSize") this.updateFontSize();
        }

        // let resetButton = $("<button>");
        // resetButton.on("click", () => {
        //     this.settings = this.defaultSettings;
        //     this.saveSettings();
        //     this.setupToolbar();
        //     panel.empty();
        //     this.generateSettings(panel);
        // });
        // resetButton.text("Reset To Defaults");
        // resetButton.css("float", "right");
        // resetButton.attr("type","button");

        // panel.append(resetButton);
    }

};
