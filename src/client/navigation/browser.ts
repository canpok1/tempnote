import type { Navigation, Params } from "./index";

const read = (): Params => Object.fromEntries(new URLSearchParams(window.location.search));

const toUrl = (params: Params) => {
  const query = new URLSearchParams(params).toString();
  return query ? `?${query}` : window.location.pathname;
};

export const browserNavigation: Navigation = {
  current: async () => read(),
  push: (params) => window.history.pushState(null, "", toUrl(params)),
  replace: (params) => window.history.replaceState(null, "", toUrl(params)),
  onChange: (listener) => {
    const handler = () => listener(read());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  },
};
