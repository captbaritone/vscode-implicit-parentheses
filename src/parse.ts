import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { File as FileAST, Node } from "@babel/types";
import { ParserOptions, ParserPlugin } from "@babel/parser";

type ParenLocations = Map<number, number>;

const CONFUSING = new Set([
  "BinaryExpression",
  "LogicalExpression",
  "UnaryExpression",
  "ConditionalExpression",
]);

export function findParens(
  text: string,
  plugins: ParserPlugin[]
): { open: ParenLocations; close: ParenLocations } | null {
  const openParens: number[] = [];
  const closeParens: number[] = [];

  function addParens(node: Node) {
    if (node.start === null || node.end === null) {
      return;
    }
    openParens.push(node.start);
    closeParens.push(node.end);
  }

  let ast;
  try {
    ast = parser.parse(
      text,
      babelOptions({ sourceType: "unambiguous", extraPlugins: plugins })
    );
  } catch (e) {
    console.error(e);
    // TODO: Should we clear decorations?
    return null;
  }

  traverse(ast, {
    enter(path) {
      if (!CONFUSING.has(path.type) || !CONFUSING.has(path.parent.type)) {
        // People can figure these out probably
        return;
      }
      if (isUnaryNot(path.node) && isUnaryNot(path.parent)) {
        // !! is an idiom that people can figure out
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

function groupLineNumbers(numbers: number[]) {
  const counts: Map<number, number> = new Map();
  numbers.forEach((num) => {
    let current = counts.get(num);
    counts.set(num, (current ?? 0) + 1);
  });
  return counts;
}

function isUnaryNot(node: Node) {
  return node.type === "UnaryExpression" && node.operator === "!";
}

// Stolen from Prettier: https://github.com/prettier/prettier/blob/797e93fc0a3a7f2ba2b510a1a246fc6bdbe89025/src/language-js/parser-babel.js#L18-L41
function babelOptions({
  sourceType,
  extraPlugins = [],
}: {
  sourceType: "script" | "module" | "unambiguous";
  extraPlugins?: ParserPlugin[];
}): ParserOptions {
  return {
    sourceType,
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
