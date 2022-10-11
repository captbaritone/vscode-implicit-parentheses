// TODO: Add a test which confirms these match what's in package.json

export const TOGGLE_COMMAND = "implicitParentheses.toggleParens";
export const SHOW_COMMAND = "implicitParentheses.showParens";
export const HIDE_COMMAND = "implicitParentheses.hideParens";

export const PAREN_COLOR_ID = "implicitParentheses.parens";
export const ENABLED_CONFIG = "implicitParentheses.enable";
export const USE_FLOW_CONFIG = "implicitParentheses.useFlow";
export const DEBOUNCE_CONFIG = "implicitParentheses.debounceTimeout";
export const MENU_BAR_CONFIG = "implicitParentheses.showInMenuBar";
export const PAREN_STYLE_CONFIG = "implicitParentheses.parenStyle";

export const SUPPORTED_LANGUAGE_IDS = new Set([
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
  "flow",
]);
