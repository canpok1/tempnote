// ローカルの入口。Vite 開発サーバーの /api から呼ばれる（vite.config.ts）。

import { createUseCases } from "../application/useCases";
import { localEnvironment } from "../infrastructure/local/localEnvironment";
import { createDispatcher } from "./dispatcher";

export const dispatch = createDispatcher(createUseCases(localEnvironment));
