/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { activateParens } from "./parens";
import { activateMenuBarItem } from "./menuBarItem";
import { activateCommands } from "./commands";
import { ENABLED_CONFIG } from "./constants";

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  activateMenuBarItem(context.subscriptions);
  activateCommands(context.subscriptions);

  let parens: vscode.Disposable | null = null;
  function updateParensEnabled() {
    if (vscode.workspace.getConfiguration().get(ENABLED_CONFIG)) {
      if (parens === null) {
        parens = activateParens();
      } else {
      }
    } else {
      if (parens !== null) {
        parens.dispose();
        parens = null;
      } else {
      }
    }
  }

  context.subscriptions.push(
    new vscode.Disposable(() => {
      if (parens !== null) {
        parens.dispose();
      }
    })
  );

  updateParensEnabled();
  vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration(ENABLED_CONFIG)) {
        updateParensEnabled();
      }
    },
    null,
    context.subscriptions
  );
}
