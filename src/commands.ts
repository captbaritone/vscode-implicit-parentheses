/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  ENABLED_CONFIG,
  SHOW_COMMAND,
  TOGGLE_COMMAND,
  HIDE_COMMAND,
} from "./constants";

export function activateCommands(subscriptions: { dispose(): any }[]) {
  subscriptions.push(
    vscode.commands.registerCommand(SHOW_COMMAND, () => {
      vscode.workspace.getConfiguration().update(ENABLED_CONFIG, true);
    }),
    vscode.commands.registerCommand(HIDE_COMMAND, () => {
      vscode.workspace.getConfiguration().update(ENABLED_CONFIG, false);
    }),
    vscode.commands.registerCommand(TOGGLE_COMMAND, () => {
      const config = vscode.workspace.getConfiguration();
      // TODO: This technically returns a promise. If we got multiple toggles in
      // rapid succession, that's a race condition.
      config.update(
        ENABLED_CONFIG,
        !config.get(ENABLED_CONFIG),
        // TODO: Should this affect the workspace instead?
        true
      );
    })
  );
}
