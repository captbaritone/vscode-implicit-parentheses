import * as assert from "assert";
import { findParens } from "../../parse";
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
  test("Ignore assignment mixed with other operators", () => {
    assert.equal(makeSnapshot("1 = 1 * 1"), "1 = 1 * 1");
  });

  test("Cast to bool idiom", () => {
    assert.equal(makeSnapshot("!!foo"), "!!foo");
    assert.equal(makeSnapshot("+!!foo"), "+₍!!foo₎");
  });

  test("Ignore identical operators if they are left-to-right associative", () => {
    assert.equal(makeSnapshot("1 + 1 + 1"), "1 + 1 + 1");
    assert.equal(makeSnapshot("1 * 1 * 1"), "1 * 1 * 1");
    assert.equal(makeSnapshot("1 && 1 && 1"), "1 && 1 && 1");
    assert.equal(makeSnapshot("1 || 1 || 1"), "1 || 1 || 1");
    assert.equal(makeSnapshot("1 ?? 1 ?? 1"), "1 ?? 1 ?? 1");
    assert.equal(makeSnapshot("1 & 1 & 1"), "1 & 1 & 1");
    assert.equal(makeSnapshot("1 | 1 | 1"), "1 | 1 | 1");
    assert.equal(makeSnapshot("1 - 1 - 1"), "1 - 1 - 1");
    assert.equal(makeSnapshot("1 - 1 - 1"), "1 - 1 - 1");
  });

  test("Don't ignore identical operators if they are right-to-left associative", () => {
    assert.equal(makeSnapshot("1 ** 1 ** 1"), "1 ** ₍1 ** 1₎");
    assert.equal(makeSnapshot("a = b = c"), "a = ₍b = c₎");
    assert.equal(makeSnapshot("a ??= b ??= c"), "a ??= ₍b ??= c₎");
  });

  test("Nested Ternary", () => {
    assert.equal(makeSnapshot("a ? b ? c : d : e"), "a ? ₍b ? c : d₎ : e");
    assert.equal(makeSnapshot("a ? b : c ? d : e"), "a ? b : ₍c ? d : e₎");
    // assert.equal(makeSnapshot("a ? b : c ? d : e"), "1 ** ₍1 ** 1₎");
  });

  // Parser config tests
  test("Flow languageId", () => {
    assert.doesNotThrow(() =>
      makeSnapshot("type FooT = {| foo: string |};", "flow", false)
    );
  });
  test("Flow as default for js", () => {
    assert.doesNotThrow(() =>
      makeSnapshot("type FooT = {| foo: string |};", "javascript", true)
    );
    assert.doesNotThrow(() =>
      makeSnapshot("type FooT = {| foo: string |};", "javascriptreact", true)
    );
  });
  test("Typescript cannot parse Flow", () => {
    assert.throws(() =>
      makeSnapshot("type FooT = {| foo: string |};", "typescript")
    );
  });
  test("TypeScript", () => {
    assert.doesNotThrow(() =>
      makeSnapshot("interface FooT { foo: string };", "typescript")
    );
  });

  test("JSX", () => {
    assert.throws(() => makeSnapshot("<Bar />", "typescript"));
    assert.throws(() => makeSnapshot("<Bar />", "javascript"));
    assert.equal(makeSnapshot("<Bar />", "typescriptreact"), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "javascriptreact"), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "flow"), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "javascript", true), "<Bar />");
    assert.equal(makeSnapshot("<Bar />", "javascriptreact", true), "<Bar />");
  });
});
