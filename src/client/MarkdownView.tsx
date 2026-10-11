import { renderMarkdown } from "./markdown";

// 閲覧画面と編集画面のプレビューで同じ見た目にするため、Markdown の表示はここにまとめる
export const MarkdownView = ({ markdown, label }: { markdown: string; label?: string }) => (
  <article
    className="markdown"
    aria-label={label}
    // renderMarkdown が DOMPurify でサニタイズ済み
    // biome-ignore lint/security/noDangerouslySetInnerHtml: サニタイズした HTML を表示するため
    dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
  />
);
