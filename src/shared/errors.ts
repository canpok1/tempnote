// アプリ全体で使う例外。ドメイン層・ユースケースはサブクラスを throw し、画面は同じクラスで catch する。
// サーバーとフロントの間はコードだけが運ばれるので、受け取った側で toAppError を使って同じクラスに戻す。

export type ErrorCode = "CONFLICT" | "NOT_FOUND" | "LIMIT_EXCEEDED" | "INVALID" | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** 他の人が先に更新していた */
export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message);
    this.name = "ConflictError";
  }
}

/** 対象が存在しない */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/** 件数や文字数の上限を超えた */
export class LimitExceededError extends AppError {
  constructor(message: string) {
    super("LIMIT_EXCEEDED", message);
    this.name = "LimitExceededError";
  }
}

/** 入力が不正 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super("INVALID", message);
    this.name = "ValidationError";
  }
}

/** コードから対応するサブクラスを作り直す。対応するサブクラスが無いコード（INTERNAL）は AppError のまま */
export const toAppError = (code: ErrorCode, message: string): AppError => {
  switch (code) {
    case "CONFLICT":
      return new ConflictError(message);
    case "NOT_FOUND":
      return new NotFoundError(message);
    case "LIMIT_EXCEEDED":
      return new LimitExceededError(message);
    case "INVALID":
      return new ValidationError(message);
    default:
      return new AppError(code, message);
  }
};
