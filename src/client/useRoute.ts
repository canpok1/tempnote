import { useCallback, useEffect, useState } from "react";
import { navigation } from "./navigation";
import { parseRoute, type Route, toParams } from "./route";

/** 今の画面と、画面を移る関数。URL を読み終えるまでは route が null */
export const useRoute = () => {
  const [route, setRoute] = useState<Route | null>(null);

  useEffect(() => {
    let active = true;
    const off = navigation.onChange((params) => setRoute(parseRoute(params)));
    navigation.current().then((params) => {
      if (active) setRoute(parseRoute(params));
    });
    return () => {
      active = false;
      off();
    };
  }, []);

  // 履歴を積んだときに変更の通知が来るとは限らない（ブラウザの popstate は来ない）ので、自分で画面を切り替える
  const navigate = useCallback((next: Route) => {
    navigation.push(toParams(next));
    setRoute(next);
  }, []);

  return { route, navigate };
};

export type Navigate = (route: Route) => void;
