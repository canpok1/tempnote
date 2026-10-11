import { type Envelope, unwrap } from "../../shared/envelope";
import { googleScript } from "../googleScript";
import type { Transport } from "./index";

export const gasTransport: Transport = (method, input) =>
  new Promise<Envelope>((resolve, reject) => {
    googleScript().run.withSuccessHandler(resolve).withFailureHandler(reject).api(method, input);
  }).then((envelope) => unwrap(envelope) as never);
