import * as vscode from "vscode";
import { ENABLED_CONFIG, TOGGLE_COMMAND } from "./constants";

export function activateMenuBarItem(subscriptions: { dispose(): any }[]) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  const PLAY = "\u25BA";
  const STOP = "\u25A0";

  function setText() {
    const config = vscode.workspace.getConfiguration();
    const icon = config.get(ENABLED_CONFIG) ? STOP : PLAY;
    statusBarItem.text = `(${icon})`;
  }

  setText();
  statusBarItem.show();
  statusBarItem.command = TOGGLE_COMMAND;

  vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration(ENABLED_CONFIG)) {
        setText();
      }
    },
    null,
    subscriptions
  );
  subscriptions.push(statusBarItem);
}
