import * as assert from "assert";
import { findParens, Parens } from "../../parse";
import { repeat } from "../../utils";

function makeSnapshot(
  input: string,
  languageId: string = "javascript",
  useFlow: boolean = false
): string | null {
  const parens = findParens(input, languageId, useFlow);
  if (parens === null) {
    return null;
  }
  let output = "";
  input.split("").forEach((char, i) => {
    const openParens = parens.open.get(i);
    if (openParens !== undefined) {
      output += repeat("₍", openParens);
    }
    output += char;

    const closeParens = parens.close.get(i + 1);
    if (closeParens !== undefined) {
      output += repeat("₎", closeParens);
    }
  });
  return output;
}

suite("Unit Test Suite", () => {
  test("Parser tests", () => {
    assert.equal(makeSnapshot("1 + 1 * 1"), "1 + ₍1 * 1₎");
  });
  test("Ignore parenthesized expressions", () => {
    assert.equal(makeSnapshot("1 + (1 * 1)"), "1 + (1 * 1)");
  });
  test("Ignore associative operators", () => {
    assert.equal(makeSnapshot("1 + 1 + 1"), "1 + 1 + 1");
    assert.equal(makeSnapshot("1 * 1 * 1"), "1 * 1 * 1");
    assert.equal(makeSnapshot("1 && 1 && 1"), "1 && 1 && 1");
    assert.equal(makeSnapshot("1 || 1 || 1"), "1 || 1 || 1");
    assert.equal(makeSnapshot("1 ?? 1 ?? 1"), "1 ?? 1 ?? 1");
    assert.equal(makeSnapshot("1 & 1 & 1"), "1 & 1 & 1");
    assert.equal(makeSnapshot("1 | 1 | 1"), "1 | 1 | 1");
  });

  // Parser config tests
  test("Flow languageId", () => {
    assert.notEqual(
      makeSnapshot("type FooT = {| foo: string |};", "flow", false),
      null
    );
  });
  test("Flow as default for js", () => {
    assert.notEqual(
      makeSnapshot("type FooT = {| foo: string |};", "javascript", true),
      null
    );
    assert.notEqual(
      makeSnapshot("type FooT = {| foo: string |};", "javascriptreact", true),
      null
    );
  });
  test("Typescript cannot parse Flow", () => {
    assert.equal(
      makeSnapshot("type FooT = {| foo: string |};", "typescript"),
      null
    );
  });
  test("TypeScript", () => {
    assert.notEqual(
      makeSnapshot("interface FooT { foo: string };", "typescript"),
      null
    );
  });

  test("JSX", () => {
    assert.equal(makeSnapshot("<Bar />", "typescript"), null);
    assert.equal(makeSnapshot("<Bar />", "javascript"), null);
    assert.equal(makeSnapshot("<Bar />", "typescriptreact"), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "javascriptreact"), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "flow"), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "javascript", true), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "javascriptreact", true), "<Bar />");
  });
});
