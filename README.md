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

## 検査する

| コマンド | 内容 |
| --- | --- |
| `npm run check` | 型チェック・lint・ユニットテスト・ビルドをまとめて実行する。push 前に流す |
| `npm run typecheck` | TypeScript の型チェック |
| `npm run lint` | Biome で lint とフォーマットを確認する。直すときは `npm run format` |
| `npm test` | Vitest のユニットテスト（`src/**/*.test.ts`）。`npm run test:watch` で監視しながら実行 |
| `npm run test:e2e` | Playwright の E2E テスト（`e2e/`）。開発サーバーを立ち上げてブラウザで画面を確かめる。初回は `npx playwright install chromium` が要る |

プルリクエストを作ると、GitHub Actions がこれらをすべて実行します（`.github/workflows/ci.yml`）。デプロイの前にも同じ検査を通し、失敗したらデプロイしません。

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

   `--name staging` のように名前を付けると、GAS の「デプロイを管理」にその名前で表示されます（省略時は `development`）。自動デプロイでは GitHub の環境名（`staging` / `production`）が付きます。

4. 表示された URL を、構築したアカウントで開いて権限を承認する

スクリプト ID とデプロイ ID は、git 管理外の `.clasp.json` と `.deploy.json` に保存されます。

## デプロイ

手元から:

```sh
npm run deploy
```

自動デプロイ: GitHub Actions が、main への push で `staging` 環境へ、`v` から始まるタグの push で `production` 環境へデプロイします。リポジトリの Settings > Environments で環境を作り、次を登録してください。登録していない環境へのデプロイは飛ばされます。

| 名前 | 種類 | 内容 |
| --- | --- | --- |
| `SCRIPT_ID` | シークレット | `npm run setup` が表示したスクリプト ID |
| `DEPLOYMENT_ID` | シークレット | `npm run setup` が表示したデプロイ ID |
| `CLASPRC_JSON` | シークレット | `~/.clasprc.json` の中身 |
| `ALLOW_ANYONE` | 変数（任意） | `true` のときだけ、Google アカウントを持つ全員に公開する |

### GAS のバージョン数

デプロイのたびに GAS のバージョンが1つ増え、1つのプロジェクトに作れるのは 200 個までです。バージョンは API から削除できないため、`npm run deploy` は残りが 20 個以下になると警告を出します（GitHub Actions ではジョブの警告として表示）。警告が出たら、GAS エディタの「プロジェクト履歴」から古いバージョンを削除してください。デプロイ中のバージョンは削除できません。

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
e2e/               Playwright の E2E テスト。ローカルの開発サーバーに対して動かす
scripts/           setup・deploy・マニフェスト生成
```

ユニットテストは対象のファイルの隣に `*.test.ts` として置きます。

アプリのコードは例外でエラーを扱います。`google.script.run` は例外のクラスを運べないため、通信の区間だけ `{ ok, data | error }` の封筒に詰め替えます（`src/shared/envelope.ts`）。
