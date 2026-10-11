import { describe, expect, it, vi } from "vitest";
import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { MAX_MEMOS_PER_NOTEBOOK } from "../../shared/limits";
import type { Memo } from "../domain/memo";
import type { Notebook } from "../domain/notebook";
import type { Ports } from "./ports";
import { createUseCases } from "./useCases";

const NB = "0123456789abcdef0123456789abcdef";
const MEMO = "fedcba9876543210fedcba9876543210";

const notebook: Notebook = {
  id: NB,
  createdAt: "2026-10-01T00:00:00.000Z",
  lastAccessedAt: "2026-10-01T00:00:00.000Z",
};
const memo: Memo = {
  id: MEMO,
  title: "買い物",
  body: "- 牛乳",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
  updatedBy: "",
};

const setup = (initial: { notebooks?: Notebook[]; memos?: Memo[] } = {}) => {
  const notebooks = new Map((initial.notebooks ?? []).map((n) => [n.id, n]));
  const memos = [...(initial.memos ?? [])];
  let now = new Date("2026-10-11T00:00:00.000Z");
  let nextId = 0;
  const ports: Ports = {
    notebooks: {
      create: (n) => notebooks.set(n.id, n),
      find: (id) => notebooks.get(id) ?? null,
      update: (n) => notebooks.set(n.id, n),
    },
    memos: {
      list: () => memos,
      find: (_, id) => memos.find((m) => m.id === id) ?? null,
      save: (_, m) => {
        const i = memos.findIndex((x) => x.id === m.id);
        if (i >= 0) memos[i] = m;
        else memos.push(m);
      },
    },
    clock: { now: () => now },
    user: { email: () => "a@example.com" },
    ids: { generate: () => String(nextId++).padStart(32, "0") },
    lock: { run: vi.fn((task) => task()) },
  };
  return {
    useCases: createUseCases(ports),
    ports,
    notebooks,
    memos,
    setNow: (iso: string) => {
      now = new Date(iso);
    },
  };
};

describe("createNotebook", () => {
  it("新しい ID でメモ帳を作り、ロックの中で保存する", () => {
    const { useCases, notebooks, ports } = setup();
    const id = "0".repeat(32);

    expect(useCases.createNotebook()).toEqual({ notebookId: id });
    expect(notebooks.get(id)).toEqual({
      id,
      createdAt: "2026-10-11T00:00:00.000Z",
      lastAccessedAt: "2026-10-11T00:00:00.000Z",
    });
    expect(ports.lock.run).toHaveBeenCalledTimes(1);
  });
});

describe("listMemos", () => {
  it("メモの一覧を本文抜きで返す", () => {
    const { useCases } = setup({ notebooks: [notebook], memos: [memo] });

    expect(useCases.listMemos({ notebookId: NB })).toEqual([
      { id: MEMO, title: "買い物", updatedAt: "2026-10-02T00:00:00.000Z" },
    ]);
  });

  it("最終アクセス日時を今の時刻にする", () => {
    const { useCases, notebooks, setNow } = setup({ notebooks: [notebook] });
    setNow("2026-10-11T12:00:00.000Z");

    useCases.listMemos({ notebookId: NB });

    expect(notebooks.get(NB)?.lastAccessedAt).toBe("2026-10-11T12:00:00.000Z");
  });

  it("無いメモ帳は NotFoundError", () => {
    const { useCases } = setup();

    expect(() => useCases.listMemos({ notebookId: NB })).toThrow(NotFoundError);
  });

  it("形の違う ID は Repository に問い合わせずに NotFoundError", () => {
    const { useCases, ports } = setup();

    expect(() => useCases.listMemos({ notebookId: "../x" })).toThrow(NotFoundError);
    expect(() => useCases.listMemos(undefined as never)).toThrow(NotFoundError);
    expect(ports.lock.run).not.toHaveBeenCalled();
  });
});

describe("getMemo", () => {
  it("メモを返し、メモ帳の最終アクセス日時を進める", () => {
    const { useCases, notebooks } = setup({ notebooks: [notebook], memos: [memo] });

    expect(useCases.getMemo({ notebookId: NB, memoId: MEMO })).toEqual(memo);
    expect(notebooks.get(NB)?.lastAccessedAt).toBe("2026-10-11T00:00:00.000Z");
  });

  it("無いメモは NotFoundError", () => {
    const { useCases } = setup({ notebooks: [notebook] });

    expect(() => useCases.getMemo({ notebookId: NB, memoId: MEMO })).toThrow(NotFoundError);
  });
});

describe("saveMemo", () => {
  it("memoId が無ければ新しいメモを作り、更新者を記録する", () => {
    const { useCases, memos } = setup({ notebooks: [notebook] });

    const saved = useCases.saveMemo({ notebookId: NB, title: "t", body: "b" });

    expect(saved).toEqual({
      id: "0".repeat(32),
      title: "t",
      body: "b",
      createdAt: "2026-10-11T00:00:00.000Z",
      updatedAt: "2026-10-11T00:00:00.000Z",
      updatedBy: "a@example.com",
    });
    expect(memos).toEqual([saved]);
  });

  it.each([null, ""])("memoId が %j でも新しいメモとして作る", (memoId) => {
    const { useCases, memos } = setup({ notebooks: [notebook] });

    useCases.saveMemo({ notebookId: NB, memoId: memoId as never, title: "t", body: "b" });

    expect(memos).toHaveLength(1);
  });

  it("memoId があれば既存のメモを書き換える", () => {
    const { useCases, memos } = setup({ notebooks: [notebook], memos: [memo] });

    useCases.saveMemo({ notebookId: NB, memoId: MEMO, title: "t", body: "b" });

    expect(memos).toEqual([
      { ...memo, title: "t", body: "b", updatedAt: "2026-10-11T00:00:00.000Z", updatedBy: "a@example.com" },
    ]);
  });

  it("100件あるメモ帳には新しいメモを作れない", () => {
    const full = Array.from({ length: MAX_MEMOS_PER_NOTEBOOK }, (_, i) => ({ ...memo, id: String(i) }));
    const { useCases } = setup({ notebooks: [notebook], memos: full });

    expect(() => useCases.saveMemo({ notebookId: NB, title: "t", body: "b" })).toThrow(LimitExceededError);
  });

  it("無いメモの更新は NotFoundError", () => {
    const { useCases } = setup({ notebooks: [notebook] });

    expect(() => useCases.saveMemo({ notebookId: NB, memoId: MEMO, title: "t", body: "b" })).toThrow(NotFoundError);
  });

  it("本文が文字列でなければロックを取らずに ValidationError", () => {
    const { useCases, ports } = setup({ notebooks: [notebook] });

    expect(() => useCases.saveMemo({ notebookId: NB, title: "t" } as never)).toThrow(ValidationError);
    expect(ports.lock.run).not.toHaveBeenCalled();
  });
});
