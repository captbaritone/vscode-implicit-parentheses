import * as vscode from "vscode";
import { findParens } from "./parse";
import { debounce, repeat } from "./utils";
import { DEBOUNCE_TIME, PARSER_CONFIG } from "./constants";
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

  updateDecorations(decorationType);

  const triggerUpdateDecorations = debounce(
    () => updateDecorations(decorationType),
    DEBOUNCE_TIME
  );
  subscriptions.push(
    new vscode.Disposable(() => triggerUpdateDecorations.cancel())
  );

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      triggerUpdateDecorations();
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
        triggerUpdateDecorations();
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

function updateDecorations(decorationType: vscode.TextEditorDecorationType) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const parens = findParens(activeEditor.document.getText(), getPlugins());
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

  activeEditor.setDecorations(
    decorationType,
    decorations.map(({ count, pos, beforeAfter }) => {
      return {
        range: new vscode.Range(
          activeEditor.document.positionAt(pos),
          activeEditor.document.positionAt(pos)
        ),
        renderOptions: {
          [beforeAfter]: { contentText: repeat(paren[beforeAfter], count) },
        },
      };
    })
  );
}
