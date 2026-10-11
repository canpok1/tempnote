import { type Envelope, unwrap } from "../../shared/envelope";
import type { Transport } from "./index";

type GoogleScriptRun = {
  withSuccessHandler(handler: (value: Envelope) => void): GoogleScriptRun;
  withFailureHandler(handler: (error: Error) => void): GoogleScriptRun;
  api(method: string, input: unknown): void;
};

declare const google: { script: { run: GoogleScriptRun } };

export const gasTransport: Transport = (method, input) =>
  new Promise<Envelope>((resolve, reject) => {
    google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).api(method, input);
  }).then((envelope) => unwrap(envelope) as never);
