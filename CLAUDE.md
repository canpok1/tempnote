# CLAUDE.md

スプレッドシートを DB、GAS をバックエンドにしたメモ帳アプリ。使い方・構成・デプロイ手順は `README.md` が正本。ここには README に書いていない、コードを変えるときの決まりだけを置く。

## 言語

ドキュメント・コードコメント・コミットメッセージ・PR は日本語で書く。

## 検査

- push 前に `npm run check`（型チェック・Biome・ユニットテスト・ビルド）を通す。画面を変えたら `npm run test:e2e` も流す
- 整形は `npm run format` で直す。手で合わせない
- ユニットテストは対象の隣に `*.test.ts` で置く。E2E は `e2e/` に置き、ローカルの開発サーバーに対して動かす。GAS には繋がない

## 層の依存

`src/server/` は domain / application / infrastructure / entry の層に分ける。本番（GAS）とローカルの違いは infrastructure の実装の差し替えだけで吸収し、application は `ports.ts` のインターフェースにだけ依存する。

層をまたぐ import の制限は `biome.json` の `overrides` で強制している（一覧は README の「層の依存の向き」）。lint で止められたら import の向きを直す。ルールを緩めない。層やディレクトリを足したときは `biome.json` と README の表を両方更新する。

## エラーは例外で扱う

- サーバーでも画面でも、失敗は `src/shared/errors.ts` の `AppError` のサブクラスを throw して表す。`{ ok, error }` のような結果オブジェクトを戻り値で返さない
- 通信用の封筒（`src/shared/envelope.ts`）は dispatcher と transport の中だけで使う。ユースケースや画面に持ち込まない
- エラーの種類を足すときは、`ErrorCode`・サブクラス・`toAppError` の対応を揃える。揃えないと画面で別のクラスとして届く

## API を足す

`src/shared/api.ts` の `Api` に型を足し、ユースケースと `src/server/entry/dispatcher.ts` の振り分けを足す。振り分け表は `Record<ApiMethod, ...>` なので、足し忘れると型チェックで落ちる。画面からは `src/client/transport/` の `callApi` だけで呼ぶ。

## 見た目

- Pico CSS を土台にする。まず HTML の要素と Pico の class（`secondary`・`outline` など）で表し、足りない分だけ `src/client/style.css` に書く
- 色は Pico の CSS 変数（`--pico-*`）から取る。色を直接書くとダークモードで読めなくなる

## GAS の制約

- サーバー側のコードは GAS の V8 で動く。`src/server/entry/gas.ts` から辿れるコード（`shared/`・domain・application を含む）で Node の API を使わない
- GAS から呼べるのは直下の関数だけ。`doGet`・`api` 以外の入口（時間トリガーの関数など）を足すときは、`src/server/entry/gas.ts` で export したうえで `vite.server.config.ts` の `exposed` にも足す
- 画面は iframe の中で動くため、`location` / `history` を直接触っても利用者の URL は変わらない。URL の読み書きは `src/client/navigation/` を通す。iframe の外へ出る `<a href>` は使わず、画面の移動はボタンで行う
- `appsscript.json` は `scripts/write-manifest.mjs` が生成する。公開範囲などを変えるときはそちらを直す。新しい GAS のサービス（トリガーなど）を使うと必要な権限が増え、デプロイ後に各環境で再承認が要る（URL を開くだけでは承認画面が出ないので、エディタで関数を一度実行して承認する）

## 環境ごとの値

リポジトリは誰でも clone して自分の環境に構築できる前提で公開する。スクリプト ID・デプロイ ID・スプレッドシート ID・認証情報をコミットしない。手元の値は git 管理外の `.clasp.json` / `.deploy.json`、自動デプロイの値は GitHub の Environments（`staging` / `production`）のシークレットに置く。

## git

- PR は squash マージ（リポジトリがマージコミットを許可していない）
- 手順やコマンド、ディレクトリ構成を変えたら README も同じ PR で直す
