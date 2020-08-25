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
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
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

function updateDecorations(
  editor: vscode.TextEditor,
  decorationType: vscode.TextEditorDecorationType
) {
  const { languageId } = editor.document;
  if (!SUPPORTED_LANGUAGE_IDS.has(languageId)) {
    // TODO: Log
    return;
  }
  const useFlow: boolean =
    vscode.workspace.getConfiguration().get(USE_FLOW_CONFIG) ?? false;

  const parens = findParens(
    editor.document.getText(),
    editor.document.languageId,
    useFlow
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
