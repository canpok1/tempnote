import { googleScript } from "../googleScript";
import type { Navigation, Params } from "./index";

// setChangeHandler は1つしか登録できず外す手段も無いので、最初の登録時に1回だけ繋ぎ、ここから配る
const listeners = new Set<(params: Params) => void>();
let connected = false;

export const gasNavigation: Navigation = {
  current: () => new Promise((resolve) => googleScript().url.getLocation((location) => resolve(location.parameter))),
  push: (params) => googleScript().history.push(null, params, ""),
  replace: (params) => googleScript().history.replace(null, params, ""),
  onChange: (listener) => {
    if (!connected) {
      googleScript().history.setChangeHandler((event) => {
        for (const l of listeners) l(event.location.parameter);
      });
      connected = true;
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
