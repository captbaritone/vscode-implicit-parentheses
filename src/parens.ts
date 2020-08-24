import * as vscode from "vscode";
import { findParens } from "./parse";
import { debounce, repeat } from "./utils";
import { DEBOUNCE_CONFIG, PARSER_CONFIG } from "./constants";
import { ParserPlugin } from "@babel/parser";

export function activateParens() {
  const subscriptions = [];
  const parenColor = new vscode.ThemeColor("implicitparens.parens");

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

function getPlugins(): ParserPlugin[] {
  const configValue = vscode.workspace.getConfiguration().get(PARSER_CONFIG);
  switch (configValue) {
    case "TypeScript":
      return ["typescript"];
    case "Flow":
      return ["flow"];
    case "JavaScript":
      return [];
    default:
      throw new Error(`Invalid config for parser: ${configValue}`);
  }
}

function updateDecorations(
  editor: vscode.TextEditor,
  decorationType: vscode.TextEditorDecorationType
) {
  const parens = findParens(editor.document.getText(), getPlugins());
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
