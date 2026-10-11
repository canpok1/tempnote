import { type Envelope, unwrap } from "../../shared/envelope";
import type { Transport } from "./index";

export const httpTransport: Transport = async (method, input) => {
  const res = await fetch(`/api/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? null),
  });
  const envelope = (await res.json()) as Envelope;
  return unwrap(envelope) as never;
};
