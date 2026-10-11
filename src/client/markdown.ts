// Markdown をブラウザ側で HTML にし、XSS 対策としてサニタイズする。
// メモは URL を知っている誰でも書けるので、本文に書かれた HTML やスクリプトは必ず DOMPurify を通す。

import DOMPurify from "dompurify";
import { marked } from "marked";

// GAS の画面は iframe の中なので、リンクをそのまま開くと iframe の中身が置き換わって画面が壊れる。リンクは新しいタブで開く
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.hasAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export const renderMarkdown = (markdown: string): string =>
  DOMPurify.sanitize(marked.parse(markdown, { async: false, gfm: true, breaks: true }));
