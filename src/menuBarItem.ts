import {
  Disposable,
  window,
  StatusBarAlignment,
  StatusBarItem,
  workspace,
  ConfigurationChangeEvent,
} from "vscode";
import { ENABLED_CONFIG, TOGGLE_COMMAND, MENU_BAR_CONFIG } from "./constants";

const PLAY = "\u25BA";
const STOP = "\u25A0";

export default class MenuBarItem implements Disposable {
  private readonly _disposables: Disposable[] = [];
  private readonly _statusBarItem: StatusBarItem;
  constructor() {
    this._disposables = [];
    this._statusBarItem = window.createStatusBarItem(
      StatusBarAlignment.Left,
      100 // What should this number be?
    );
    this._statusBarItem.command = TOGGLE_COMMAND;

    this._disposables.push(this._statusBarItem);

    this._setText();
    this._setVisibility();

    workspace.onDidChangeConfiguration(
      this._handleConfigChange,
      this,
      this._disposables
    );
  }

  _handleConfigChange(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration(ENABLED_CONFIG)) {
      this._setText();
    }
    if (event.affectsConfiguration(MENU_BAR_CONFIG)) {
      this._setVisibility();
    }
  }

  _setText() {
    const enabled = workspace.getConfiguration().get<boolean>(ENABLED_CONFIG);
    const icon = enabled ? STOP : PLAY;
    const action = enabled ? "hide" : "show";
    this._statusBarItem.text = `(${icon})`;
    this._statusBarItem.tooltip = `Click to ${action} implicit parentheses.`;
  }

  _setVisibility() {
    if (workspace.getConfiguration().get<boolean>(MENU_BAR_CONFIG)) {
      this._statusBarItem.show();
    } else {
      this._statusBarItem.hide();
    }
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose());
  }
}
