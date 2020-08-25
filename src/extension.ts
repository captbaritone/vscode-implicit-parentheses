/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { activateParens } from "./parens";
import { activateMenuBarItem } from "./menuBarItem";
import { activateCommands } from "./commands";
import { ENABLED_CONFIG, DEBOUNCE_CONFIG, USE_FLOW_CONFIG } from "./constants";

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  activateMenuBarItem(context.subscriptions);
  activateCommands(context.subscriptions);

  let parens: vscode.Disposable | null = null;
  function updateParensEnabled() {
    if (parens !== null) {
      parens.dispose();
    }
    if (vscode.workspace.getConfiguration().get(ENABLED_CONFIG)) {
      parens = activateParens();
    } else {
      parens = null;
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
      if (
        event.affectsConfiguration(USE_FLOW_CONFIG) ||
        event.affectsConfiguration(ENABLED_CONFIG) ||
        event.affectsConfiguration(DEBOUNCE_CONFIG)
      ) {
        updateParensEnabled();
      }
    },
    null,
    context.subscriptions
  );
}
