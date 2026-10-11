import type { Status } from "../../shared/api";
import type { Environment } from "./ports";

export const createUseCases = (env: Environment) => ({
  getStatus: (): Status => ({
    environment: env.name,
    storage: env.describeStorage(),
    user: env.currentUserEmail(),
    serverTime: env.now().toISOString(),
  }),
});

export type UseCases = ReturnType<typeof createUseCases>;
