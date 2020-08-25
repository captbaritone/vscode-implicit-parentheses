import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { File as FileAST, Node } from "@babel/types";
import { ParserOptions, ParserPlugin } from "@babel/parser";

type Locations = Map<number, number>;
export type ParenLocations = { open: Locations; close: Locations };

const CONFUSING = new Set([
  "BinaryExpression",
  "LogicalExpression",
  "UnaryExpression",
  "ConditionalExpression",
  "AssignmentExpression",
]);

export function findParens(
  text: string,
  languageId: string,
  useFlow: boolean
): ParenLocations {
  const openParens: number[] = [];
  const closeParens: number[] = [];

  function addParens(node: Node) {
    if (node.start === null || node.end === null) {
      return;
    }
    openParens.push(node.start);
    closeParens.push(node.end);
  }

  const ast = parser.parse(text, babelOptions({ languageId, useFlow }));

  const RIGHT_TO_LEFT_ASSOCIATIVE_OPERATORS = new Set([
    "**",
    "=",
    "+=",
    "-=",
    "%=",
    "**=",
    "*=",
    "<<=",
    ">>=",
    ">>>=",
    "&=",
    "^=",
    "|=",
    "&&=",
    "||=",
    "??=",
  ]);

  traverse(ast, {
    enter(path) {
      if (!CONFUSING.has(path.type) || !CONFUSING.has(path.parent.type)) {
        // People can figure these out probably
        return;
      }
      if (path.node.type === path.parent.type) {
        if (
          // @ts-ignore
          path.node.operator !== undefined &&
          // @ts-ignore
          path.node.operator === path.parent.operator &&
          // @ts-ignore
          !RIGHT_TO_LEFT_ASSOCIATIVE_OPERATORS.has(path.node.operator)
        ) {
          // Here the presedence is obvisouly the same, and people can
          // infer left-to-right associativity.
          return;
        }
      } else if (path.parent.type === "AssignmentExpression") {
        return;
      }

      addParens(path.node);
    },
  });

  return {
    open: groupLineNumbers(openParens),
    close: groupLineNumbers(closeParens),
  };
}

// @ts-ignore `enums` are not yet included in the types.
const FLOW_PLUGINS: ParserPluginWithOptions = [
  ["flow", { all: true, enums: true }],
  "jsx",
];

function getPlugins(languageId: string, useFlow: boolean): ParserPlugin[] {
  switch (languageId) {
    case "typescript":
      return ["typescript"];
    case "typescriptreact":
      return ["typescript", "jsx"];
    // The `flow` languageId is used interally at Facebook
    case "flow":
      // @ts-ignore `enums` are not yet included in the types.
      return FLOW_PLUGINS;
    case "javascriptreact":
      if (useFlow) {
        return FLOW_PLUGINS;
      }
      return ["jsx"];
    case "javascript":
      if (useFlow) {
        return FLOW_PLUGINS;
      }
      return [];
    default:
      // TODO: enforce this with types
      console.warn(`Unexpected languageId: ${languageId}`);
      return [];
  }
}

function groupLineNumbers(numbers: number[]) {
  const counts: Map<number, number> = new Map();
  numbers.forEach((num) => {
    let current = counts.get(num);
    counts.set(num, (current ?? 0) + 1);
  });
  return counts;
}

// Stolen from Prettier: https://github.com/prettier/prettier/blob/797e93fc0a3a7f2ba2b510a1a246fc6bdbe89025/src/language-js/parser-babel.js#L18-L41
function babelOptions({
  languageId,
  useFlow,
}: {
  languageId: string;
  useFlow: boolean;
}): ParserOptions {
  const extraPlugins = getPlugins(languageId, useFlow);
  return {
    sourceType: "unambiguous",
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    allowUndeclaredExports: true,
    errorRecovery: true,
    // This causes expressions that are alaready parenthasized to be parsed to
    // `ParenthesizedExpression` which makes them easy for us to skip.
    createParenthesizedExpressions: true,
    plugins: [
      "doExpressions",
      "classProperties",
      "exportDefaultFrom",
      "functionBind",
      "functionSent",
      "classPrivateProperties",
      "throwExpressions",
      "classPrivateMethods",
      "v8intrinsic",
      "partialApplication",
      ["decorators", { decoratorsBeforeExport: false }],
      "privateIn",
      [
        "moduleAttributes",
        {
          // @ts-ignore
          version: "may-2020",
        },
      ],
      [
        "recordAndTuple",
        {
          // @ts-ignore
          syntaxType: "hash",
        },
      ],
      "decimal",
      ...extraPlugins,
    ],
    tokens: true,
    ranges: true,
  };
}
