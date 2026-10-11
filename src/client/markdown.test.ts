// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("見出しやリストを HTML にする", () => {
    const html = renderMarkdown("# 見出し\n\n- 1\n- 2");

    expect(html).toContain("<h1>見出し</h1>");
    expect(html).toContain("<li>1</li>");
  });

  it("本文に書かれた script 要素を消す", () => {
    const html = renderMarkdown("before\n\n<script>alert(1)</script>\n\nafter");

    expect(html).not.toContain("<script");
    expect(html).toContain("after");
  });

  it("イベント属性と javascript: の URL を消す", () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">\n\n[link](javascript:alert(1))');

    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });

  it("リンクは新しいタブで開く", () => {
    expect(renderMarkdown("[例](https://example.com)")).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">例</a></p>\n',
    );
  });
});
