import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../../shared/errors";
import type { Memo } from "../domain/memo";
import type { Notebook } from "../domain/notebook";
import type { Ports } from "./ports";
import { createUseCases } from "./useCases";

const ID = "0123456789abcdef0123456789abcdef";

const setup = (initial: { notebooks?: Notebook[]; memos?: Memo[] } = {}) => {
  const notebooks = new Map((initial.notebooks ?? []).map((n) => [n.id, n]));
  let now = new Date("2026-10-11T00:00:00.000Z");
  const ports: Ports = {
    notebooks: {
      create: (n) => notebooks.set(n.id, n),
      find: (id) => notebooks.get(id) ?? null,
      update: (n) => notebooks.set(n.id, n),
    },
    memos: { list: () => initial.memos ?? [] },
    clock: { now: () => now },
    ids: { generate: () => ID },
    lock: { run: vi.fn((task) => task()) },
  };
  return {
    useCases: createUseCases(ports),
    ports,
    notebooks,
    setNow: (iso: string) => {
      now = new Date(iso);
    },
  };
};

describe("createNotebook", () => {
  it("新しい ID でメモ帳を作り、ロックの中で保存する", () => {
    const { useCases, notebooks, ports } = setup();

    expect(useCases.createNotebook()).toEqual({ notebookId: ID });
    expect(notebooks.get(ID)).toEqual({
      id: ID,
      createdAt: "2026-10-11T00:00:00.000Z",
      lastAccessedAt: "2026-10-11T00:00:00.000Z",
    });
    expect(ports.lock.run).toHaveBeenCalledTimes(1);
  });
});

describe("listMemos", () => {
  const notebook: Notebook = {
    id: ID,
    createdAt: "2026-10-01T00:00:00.000Z",
    lastAccessedAt: "2026-10-01T00:00:00.000Z",
  };
  const memo: Memo = {
    id: "m1",
    title: "買い物",
    body: "- 牛乳",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    updatedBy: "",
  };

  it("メモの一覧を本文抜きで返す", () => {
    const { useCases } = setup({ notebooks: [notebook], memos: [memo] });

    expect(useCases.listMemos({ notebookId: ID })).toEqual([
      { id: "m1", title: "買い物", updatedAt: "2026-10-02T00:00:00.000Z" },
    ]);
  });

  it("最終アクセス日時を今の時刻にする", () => {
    const { useCases, notebooks, setNow } = setup({ notebooks: [notebook] });
    setNow("2026-10-11T12:00:00.000Z");

    useCases.listMemos({ notebookId: ID });

    expect(notebooks.get(ID)?.lastAccessedAt).toBe("2026-10-11T12:00:00.000Z");
  });

  it("無いメモ帳は NotFoundError", () => {
    const { useCases } = setup();

    expect(() => useCases.listMemos({ notebookId: ID })).toThrow(NotFoundError);
  });

  it("形の違う ID は Repository に問い合わせずに NotFoundError", () => {
    const { useCases, ports } = setup();

    expect(() => useCases.listMemos({ notebookId: "../x" })).toThrow(NotFoundError);
    expect(() => useCases.listMemos(undefined as never)).toThrow(NotFoundError);
    expect(ports.lock.run).not.toHaveBeenCalled();
  });
});
