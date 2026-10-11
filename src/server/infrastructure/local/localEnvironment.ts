import type { Environment } from "../../application/ports";

export const localEnvironment: Environment = {
  name: "local",
  describeStorage: () => "ローカルのメモリ",
  currentUserEmail: () => "local-user@example.com",
  now: () => new Date(),
};
