import { useCallback, useEffect, useState } from "react";
import { navigation } from "./navigation";
import { parseRoute, type Route, toParams } from "./route";

/** 今の画面と、画面を移る関数。URL を読み終えるまでは route が null */
export const useRoute = () => {
  const [route, setRoute] = useState<Route | null>(null);

  useEffect(() => {
    let active = true;
    const off = navigation.onChange((params) => setRoute(parseRoute(params)));
    // GAS では読み終わる前に戻る・進むの通知が来ることがあるので、先に決まった画面を古い URL で上書きしない
    navigation.current().then((params) => {
      if (active) setRoute((prev) => prev ?? parseRoute(params));
    });
    return () => {
      active = false;
      off();
    };
  }, []);

  // 履歴を積んだときに変更の通知が来るとは限らない（ブラウザの popstate は来ない）ので、自分で画面を切り替える
  const navigate = useCallback((next: Route, options?: NavigateOptions) => {
    if (options?.replace) navigation.replace(toParams(next));
    else navigation.push(toParams(next));
    setRoute(next);
  }, []);

  return { route, navigate };
};

export type NavigateOptions = {
  /** 履歴を積まずに今の画面を置き換える。保存後の編集画面のように、戻るで戻ってほしくない画面から移るときに使う */
  replace?: boolean;
};

export type Navigate = (route: Route, options?: NavigateOptions) => void;
