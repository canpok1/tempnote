// ローカルの入口。Vite 開発サーバーの /api から呼ばれる（vite.config.ts）。

import { createUseCases } from "../application/useCases";
import { createLocalPorts } from "../infrastructure/local/localPorts";
import { createDispatcher } from "./dispatcher";

export const dispatch = createDispatcher(createUseCases(createLocalPorts()));
