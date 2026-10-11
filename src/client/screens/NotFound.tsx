import type { Navigate } from "../useRoute";

/** メモ帳やメモが無いときの画面。message はサーバーが返した「〜が見つかりません」 */
export const NotFound = ({ message, navigate }: { message: string; navigate: Navigate }) => (
  <section>
    <h2>{message}</h2>
    <p>URL が間違っているか、削除されたか、30日間開かれずに自動で削除されたものです。</p>
    <button type="button" onClick={() => navigate({ screen: "top" })}>
      トップへ
    </button>
  </section>
);
