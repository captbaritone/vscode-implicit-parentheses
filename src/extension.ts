/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Disposable, ExtensionContext, workspace } from "vscode";
import Parens from "./parens";
import MenuBarItem from "./menuBarItem";
import { activateCommands } from "./commands";
import { ENABLED_CONFIG, PAREN_STYLE_CONFIG } from "./constants";

// this method is called when vs code is activated
export function activate(context: ExtensionContext) {
  context.subscriptions.push(new MenuBarItem());
  context.subscriptions.push(activateCommands());

  let parens: Disposable | null = null;
  function updateParensEnabled() {
    if (parens !== null) {
      parens.dispose();
    }
    if (workspace.getConfiguration().get(ENABLED_CONFIG)) {
      const parenStyle = workspace.getConfiguration().get(PAREN_STYLE_CONFIG);
      parens = new Parens({
        style: parenStyle === "big" ? { before: "(", after: ")" } : undefined,
      });
    } else {
      parens = null;
    }
  }

  context.subscriptions.push(
    new Disposable(() => {
      if (parens !== null) {
        parens.dispose();
      }
    })
  );

  updateParensEnabled();
  workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration(ENABLED_CONFIG)) {
        updateParensEnabled();
      }
    },
    null,
    context.subscriptions
  );
}
