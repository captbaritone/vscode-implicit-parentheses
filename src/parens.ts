import * as vscode from "vscode";
import { findParens, ParenLocations } from "./parse";
import { debounce, repeat } from "./utils";
import {
  DEBOUNCE_CONFIG,
  USE_FLOW_CONFIG,
  PAREN_COLOR_ID,
  SUPPORTED_LANGUAGE_IDS,
} from "./constants";

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

  const outputChannel = vscode.window.createOutputChannel(
    "Implicit Parentheses"
  );
  subscriptions.push(outputChannel);

  for (const editor of vscode.window.visibleTextEditors) {
    updateDecorations(editor, decorationType, outputChannel);
  }

  const triggerUpdateDecorations = debounce(
    (editor: vscode.TextEditor) =>
      updateDecorations(editor, decorationType, outputChannel),
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
        const { languageId } = activeEditor.document;
        if (SUPPORTED_LANGUAGE_IDS.has(languageId)) {
          triggerUpdateDecorations(activeEditor);
        } else {
          outputChannel.appendLine(
            `The language ${languageId} is not supported by Implicit Parentheses`
          );
        }
      }
    },
    null,
    subscriptions
  );

  return vscode.Disposable.from(...subscriptions);
}

function updateDecorations(
  editor: vscode.TextEditor,
  decorationType: vscode.TextEditorDecorationType,
  outputChannel: vscode.OutputChannel
) {
  outputChannel.appendLine("Updating decorations...");

  const useFlow: boolean =
    vscode.workspace.getConfiguration().get(USE_FLOW_CONFIG) ?? false;

  let parens: ParenLocations;
  try {
    parens = findParens(
      editor.document.getText(),
      editor.document.languageId,
      useFlow
    );
  } catch (e) {
    outputChannel.appendLine(
      `Encounterd an while parsing ${editor.document.fileName}}: ${String(e)}`
    );
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
