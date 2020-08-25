import * as vscode from "vscode";
import { findParens } from "./parse";
import { debounce, repeat } from "./utils";
import {
  DEBOUNCE_CONFIG,
  USE_FLOW_CONFIG,
  PAREN_COLOR_ID,
  SUPPORTED_LANGUAGE_IDS,
} from "./constants";
import { ParserPlugin } from "@babel/parser";

export function activateParens() {
  const subscriptions = [];
  const parenColor = new vscode.ThemeColor(PAREN_COLOR_ID);

  const decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      color: parenColor,
      fontStyle: "normal",
    },
    before: {
      color: parenColor,
      fontStyle: "normal",
    },
  });

  subscriptions.push(decorationType);

  for (const editor of vscode.window.visibleTextEditors) {
    updateDecorations(editor, decorationType);
  }

  const triggerUpdateDecorations = debounce(
    (editor: vscode.TextEditor) => updateDecorations(editor, decorationType),
    vscode.workspace.getConfiguration().get(DEBOUNCE_CONFIG)
  );
  subscriptions.push(
    new vscode.Disposable(() => triggerUpdateDecorations.cancel())
  );

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor !== undefined) {
        triggerUpdateDecorations(activeEditor);
      }
    },
    null,
    subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (
        activeEditor !== undefined &&
        event.document === activeEditor.document
      ) {
        triggerUpdateDecorations(activeEditor);
      }
    },
    null,
    subscriptions
  );

  return vscode.Disposable.from(...subscriptions);
}

// @ts-ignore `enums` are not yet included in the types.
const FLOW_PLUGINS: ParserPluginWithOptions = [
  [["flow", { all: true, enums: true }], "jsx"],
];

function getPlugins(languageId: string): ParserPlugin[] {
  const useFlow = vscode.workspace.getConfiguration().get(USE_FLOW_CONFIG);
  switch (languageId) {
    case "typescript":
      return ["typescript"];
    case "typescriptreact":
      return ["typescript", "jsx"];
    // The `flow` languageId is used interally at Facebook
    case "flow":
      // @ts-ignore `enums` are not yet included in the types.
      return FLOW_PLUGINS;
    case "javascriptreact":
      if (useFlow) {
        return FLOW_PLUGINS;
      }
      return ["jsx"];
    case "javascript":
      if (useFlow) {
        return FLOW_PLUGINS;
      }
      return [];
    default:
      // TODO: enforce this with types
      console.warn(`Unexpected languageId: ${languageId}`);
      return [];
  }
}

function updateDecorations(
  editor: vscode.TextEditor,
  decorationType: vscode.TextEditorDecorationType
) {
  const { languageId } = editor.document;
  if (!SUPPORTED_LANGUAGE_IDS.has(languageId)) {
    // TODO: Log
    return;
  }
  const parens = findParens(
    editor.document.getText(),
    getPlugins(editor.document.languageId)
  );
  if (parens === null) {
    return;
  }
  const { open, close } = parens;

  const decorations: {
    count: number;
    pos: number;
    beforeAfter: "before" | "after";
  }[] = [];

  open.forEach((count, pos) => {
    decorations.push({ count, pos, beforeAfter: "before" });
  });

  close.forEach((count, pos) => {
    decorations.push({ count, pos, beforeAfter: "after" });
  });

  const paren = { before: "(", after: ")" };

  editor.setDecorations(
    decorationType,
    decorations.map(({ count, pos, beforeAfter }) => {
      return {
        range: new vscode.Range(
          editor.document.positionAt(pos),
          editor.document.positionAt(pos)
        ),
        renderOptions: {
          [beforeAfter]: { contentText: repeat(paren[beforeAfter], count) },
        },
      };
    })
  );
}
