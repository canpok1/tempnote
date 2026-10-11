# tempnote

使わなくなったら勝手に消えるメモ帳です。スプレッドシートを DB、Google Apps Script（GAS）をバックエンドにしています。

今は基盤だけで、画面にはバックエンドから取得した情報（動いている環境・データの置き場所・利用者・サーバー時刻）を表示します。

## 必要なもの

- Node.js 22
- Google アカウント（[Apps Script API](https://script.google.com/home/usersettings) を有効にしておく）

```sh
npm install
```

## ローカルで動かす

```sh
npm run dev
```

http://localhost:5173 を開きます。開発サーバーは全インターフェース（0.0.0.0）で待ち受けるので、devcontainer などのコンテナ内で起動しても、ポート 5173 を転送すればホストから開けます。バックエンドは Vite の開発サーバーの `/api` で動き、Google には接続しません。

## 本番環境を作る

1. 空のスプレッドシートを作り、URL の `/d/` と `/edit` の間にある ID を控える
2. clasp にログインする

   ```sh
   npx clasp login
   ```

3. 構築する

   ```sh
   npm run setup -- <スプレッドシートID>
   ```

   公開範囲は既定で「同じドメイン内」です。Google Workspace ではない無料アカウントで使うときは、Google アカウントを持つ全員に公開する `--allow-anyone` を付けます。

4. 表示された URL を、構築したアカウントで開いて権限を承認する

スクリプト ID とデプロイ ID は、git 管理外の `.clasp.json` と `.deploy.json` に保存されます。

## デプロイ

手元から:

```sh
npm run deploy
```

自動デプロイ: GitHub Actions が、main への push で `trial` 環境へ、`v` から始まるタグの push で `production` 環境へデプロイします。リポジトリの Settings > Environments で環境を作り、次を登録してください。登録していない環境へのデプロイは飛ばされます。

| 名前 | 種類 | 内容 |
| --- | --- | --- |
| `SCRIPT_ID` | シークレット | `npm run setup` が表示したスクリプト ID |
| `DEPLOYMENT_ID` | シークレット | `npm run setup` が表示したデプロイ ID |
| `CLASPRC_JSON` | シークレット | `~/.clasprc.json` の中身 |
| `ALLOW_ANYONE` | 変数（任意） | `true` のときだけ、Google アカウントを持つ全員に公開する |

## 構成

```
src/
  shared/          フロントとサーバーで共有する型（API の定義・例外・通信用の封筒）
  client/          React の画面
    transport/     サーバー呼び出し。本番は google.script.run、ローカルは fetch
  server/
    application/   ユースケースと、インフラ層に求めるインターフェース（ports）
    infrastructure/
      gas/         GAS 版の実装（SpreadsheetApp・Session など）
      local/       ローカル版の実装
    entry/         入口。GAS の doGet / api と、ローカルの /api が同じ dispatcher を呼ぶ
scripts/           setup・deploy・マニフェスト生成
```

アプリのコードは例外でエラーを扱います。`google.script.run` は例外のクラスを運べないため、通信の区間だけ `{ ok, data | error }` の封筒に詰め替えます（`src/shared/envelope.ts`）。
