# Implicit Parentheses VSCode Extension

Clarify operator precedence by showing implicit parentheses as inline decorations in JavaScript files.

![demo video](https://user-images.githubusercontent.com/162735/97759792-f61aec00-1abe-11eb-9ba6-fdfa973bb566.gif)

When reading complex expressions, it can be hard to understand how the subexpressions will be grouped. This extensions shows you how the sub expression are grouped by visually including the implicit parentheses as decorations.

## Try Online

**[Online Demo](https://capt.dev/parens)**

## Installation

Install through VS Code extension marketplace. Search for "Implicit Parentheses".

## Command Pallet Commands

- "Show Implicit Parentheses"
- "Hide Implicit Parentheses"
- "Toggle Implicit Parentheses"

## Extension Settings

This extension contributes the following settings:

- `implicitParentheses.enable`: Show implicit parentheses
- `implicitParentheses.showInMenuBar`: Show a button in the menu bar to show/hide implicit parentheses
- `implicitParentheses.useFlow`: Parse JavaScript files as Flow
- `implicitParentheses.debounceTimeout`: Number of milliseconds that the plugin will wait after a file changes before it parses the file.

The color of the parentheses can be configured via:

```JSON
{
    "workbench.colorCustomizations": {
        "implicitParentheses.parens": "#ff0000"
    }
}
```

## TODO

- [ ] Correctly handle case where config has been set at the language level.

## Possible Future Features

- Allow user to configure which parens are shown
- Provide automated fixes for adding parens, or even extracting expressions to variables.
- Use the menu bar item to indicate if parsing has failed.
- Suggest changing parser when we get a parse error that indicates we're using the wrong parser
- Use Flow/Typescript parser when possible to get incremental parsing.
