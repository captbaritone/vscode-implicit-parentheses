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

// Find the least specific target that has configured this setting.
// TODO: Update this to handle language-specific configs.
function getConfigurationType(
  configuration: vscode.WorkspaceConfiguration,
  key: string
): vscode.ConfigurationTarget {
  const config = configuration.inspect(key);
  if (!config) {
    return vscode.ConfigurationTarget.Global;
  }
  if (config.workspaceFolderValue !== undefined) {
    return vscode.ConfigurationTarget.WorkspaceFolder;
  } else if (config.workspaceValue !== undefined) {
    return vscode.ConfigurationTarget.Workspace;
  } else if (config.globalValue !== undefined) {
    return vscode.ConfigurationTarget.Global;
  }
  return vscode.ConfigurationTarget.Global;
}

export function activateCommands(): vscode.Disposable {
  const subscriptions = [];
  subscriptions.push(
    vscode.commands.registerCommand(SHOW_COMMAND, () => {
      const config = vscode.workspace.getConfiguration();
      config.update(
        ENABLED_CONFIG,
        true,
        getConfigurationType(config, ENABLED_CONFIG)
      );
    }),
    vscode.commands.registerCommand(HIDE_COMMAND, () => {
      const config = vscode.workspace.getConfiguration();
      config.update(
        ENABLED_CONFIG,
        false,
        getConfigurationType(config, ENABLED_CONFIG)
      );
    }),
    vscode.commands.registerCommand(TOGGLE_COMMAND, () => {
      const config = vscode.workspace.getConfiguration();
      // TODO: This technically returns a promise. If we got multiple toggles in
      // rapid succession, that's a race condition.
      config.update(
        ENABLED_CONFIG,
        !config.get(ENABLED_CONFIG),
        getConfigurationType(config, ENABLED_CONFIG)
      );
    })
  );

  return vscode.Disposable.from(...subscriptions);
}
