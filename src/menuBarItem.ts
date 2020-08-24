import * as vscode from "vscode";
import { ENABLED_CONFIG, TOGGLE_COMMAND, MENU_BAR_CONFIG } from "./constants";

export function activateMenuBarItem(subscriptions: { dispose(): any }[]) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = TOGGLE_COMMAND;

  const PLAY = "\u25BA";
  const STOP = "\u25A0";

  function setText() {
    const config = vscode.workspace.getConfiguration();
    const icon = config.get(ENABLED_CONFIG) ? STOP : PLAY;
    const action = config.get(ENABLED_CONFIG) ? "hide" : "show";
    statusBarItem.text = `(${icon})`;
    statusBarItem.tooltip = `Click to ${action} implicit parentheses.`;
  }

  function setVisibility() {
    if (vscode.workspace.getConfiguration().get(MENU_BAR_CONFIG)) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  }

  setText();
  setVisibility();

  vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration(ENABLED_CONFIG)) {
        setText();
      }
      if (event.affectsConfiguration(MENU_BAR_CONFIG)) {
        setVisibility();
      }
    },
    null,
    subscriptions
  );
  subscriptions.push(statusBarItem);
}
