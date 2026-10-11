// アプリ全体で使う例外。サーバーで throw したものを、フロントで同じクラスとして catch できる。

export type ErrorCode = "NOT_FOUND" | "INVALID" | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
