import type { Navigation, Params } from "./index";

const read = (): Params => Object.fromEntries(new URLSearchParams(window.location.search));

export const browserNavigation: Navigation = {
  current: async () => read(),
  push: (params) => {
    const query = new URLSearchParams(params).toString();
    window.history.pushState(null, "", query ? `?${query}` : window.location.pathname);
  },
  onChange: (listener) => {
    const handler = () => listener(read());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  },
};
