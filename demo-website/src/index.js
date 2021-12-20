import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";
import { findParens } from "./parse";

function repeat(unit, count) {
  return new Array(count).fill(unit).join("");
}

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

let lastValidResponse = null;

monaco.languages.registerInlayHintsProvider("javascript", {
  provideInlayHints(model, range, token) {
    const text = model.getLinesContent().join("\n");
    let parens = null;
    try {
      parens = findParens(text, "javascript", false);
    } catch (e) {
      console.log("parse error");
    }
    if (parens === null) {
      return new Promise();
    }
    const { open, close } = parens;

    const decorations = [];

    open.forEach((count, pos) => {
      decorations.push({ count, pos, char: "₍" });
    });

    close.forEach((count, pos) => {
      decorations.push({ count, pos, char: "₎" });
    });

    const hints = decorations.map(({ count, pos, char }) => {
      return {
        kind: monaco.languages.InlayHintKind.Other,
        position: model.getPositionAt(pos),
        text: repeat(char, count),
      };
    });

    lastValidResponse = hints;

    return hints;
  },
});

const INITIAL_VALUE = `
// Oops! A bug.
const total = a + maybeB ?? DEFAULT;

// Fixed!
const newTotal = a + (maybeB ?? DEFAULT);

// Oops! Another bug.
if(!x in someObj) {

}

// Fixed!
if(!(x in someObj)) {

}
`.trim();

monaco.editor.defineTheme("myTheme", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editorInlayHint.foreground": "#666666",
    "editorInlayHint.background": "#1e1e1e",
  },
});

const editor = monaco.editor.create(document.getElementById("container"), {
  value: INITIAL_VALUE,
  language: "javascript",
  minimap: {
    enabled: false,
  },
  fontSize: "16px",
  theme: "myTheme",
  quickSuggestions: {
    other: false,
    comments: false,
    strings: false,
  },
  parameterHints: {
    enabled: false,
  },
  suggestOnTriggerCharacters: false,
  acceptSuggestionOnEnter: "off",
  tabCompletion: "off",
  wordBasedSuggestions: false,
  renderLineHighlight: false,
  lineNumbers: false,
  scrollBeyondLastLine: false,
  hover: {
    enabled: false,
  },
  padding: {
    top: "10px",
    bottom: "10px",
  },
});

editor.focus();
