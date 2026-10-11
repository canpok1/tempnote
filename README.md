# tempnote

使わなくなったら勝手に消えるメモ帳です。スプレッドシートを DB、Google Apps Script（GAS）をバックエンドにしています。

トップで「メモ帳を作る」を押すと推測されにくい ID のメモ帳ができ、その URL を知っている人なら誰でも開けます。メモ帳には Markdown のメモを100件まで書けます（本文は1件5万文字まで）。保存は保存ボタンを押したときだけで、閲覧画面には最後に更新した日時と人のメールアドレスを出します。複数の人が同じメモを同時に編集したときは、後から保存した人に「他の人が先に更新した」と知らせて保存しません（入力は消しません）。最後に開いてから30日たったメモ帳は、中のメモごと自動で消えます（日数と削除の間隔は「設定を変える」で変えられます）。

見た目は [Pico CSS](https://picocss.com/) を土台にしています（判断の経緯は `docs/adr/0001-pico-css-for-styling.md`）。

Markdown はブラウザ側で [marked](https://marked.js.org/) で HTML にし、[DOMPurify](https://github.com/cure53/DOMPurify) でサニタイズしてから表示します。メモの中のリンクは新しいタブで開きます。

| URL | 画面 |
| --- | --- |
| `?`（パラメータ無し） | トップ |
| `?id=<メモ帳ID>` | メモ帳 |
| `?id=<メモ帳ID>&memo=<メモID>` | メモ閲覧 |
| `?id=<メモ帳ID>&memo=<メモID>&mode=edit` | メモ編集（`memo` が無ければ新規メモ） |

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

http://localhost:5173 を開きます。開発サーバーは全インターフェース（0.0.0.0）で待ち受けるので、devcontainer などのコンテナ内で起動しても、ポート 5173 を転送すればホストから開けます。バックエンドは Vite の開発サーバーの `/api` で動き、Google には接続しません。データはメモリに持つので、開発サーバーを再起動すると消えます。

E2E テスト用に、開発サーバーにだけ `POST /__dev/advance-clock`（本文 `{"days": 31}` の日数だけサーバーの時計を進める）、`POST /__dev/delete-expired`（定期の自動削除を今すぐ実行する）、`POST /__dev/settings`（本文 `{"expiryDays": "7"}` のように設定を書き換える。値を `null` にすると既定値に戻す）があります。

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

4. 表示された URL を、構築したアカウントで開いて権限を承認する。この最初のアクセスで、設定シート `settings` と、期限切れのメモ帳を消す時間トリガー（既定は毎日3時ごろ）ができる

スクリプト ID とデプロイ ID は、git 管理外の `.clasp.json` と `.deploy.json` に保存されます。

## 設定を変える

スプレッドシートの `settings` シートの `value` 列を書き換えます。1以上の整数でない値や空欄は既定値として扱います。行を消しても、次に画面を開いたときに既定値で書き足されます。

| `key` | 既定値 | 内容 |
| --- | --- | --- |
| `expiryDays` | `30` | 最後に開いてからこの日数がたったメモ帳を、中のメモごと削除する。次の削除の実行から効く |
| `cleanupIntervalDays` | `1` | 期限切れのメモ帳を探して削除する間隔（日）。3時ごろに実行する。次に画面が開かれたとき、または次の削除の実行の後にトリガーを作り直す |

トリガーには間隔を読み出す手段が無いため、作ったときの間隔をスクリプトのプロパティ `cleanupIntervalDays` に控え、設定と食い違えば作り直します。

## デプロイ

権限の増える変更（新しい GAS のサービスを使うなど）をデプロイした後は、その環境の権限を承認し直してください。一度承認した後に増えた権限は、URL を開いても承認画面が出ません。構築したアカウントで Apps Script エディタを開き、関数（`deleteExpiredNotebooks` など）を一度「実行」すると承認ダイアログが出ます。承認するまで、時間トリガーなどの新しい処理は「権限がありません」というエラーで失敗します。

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
  shared/          フロントとサーバーで共有するもの（API の定義・例外・通信用の封筒・上限値）
  client/          React の画面
    screens/       画面ごとのコンポーネント。どれを出すかは route.ts が URL のパラメータから決める
    transport/     サーバー呼び出し。本番は google.script.run、ローカルは fetch
    navigation/    URL のパラメータと履歴。本番は google.script.url / history、ローカルは location / history
  server/
    domain/        メモ帳・メモとそのルール
    application/   ユースケースと、インフラ層に求めるインターフェース（ports）
    infrastructure/
      gas/         GAS 版の実装（SpreadsheetApp・LockService など）
      local/       ローカル版の実装。データはメモリに持ち、開発サーバーを再起動すると消える
    entry/         入口。GAS の doGet / api と、ローカルの /api が同じ dispatcher を呼ぶ
e2e/               Playwright の E2E テスト。ローカルの開発サーバーに対して動かす
scripts/           setup・deploy・マニフェスト生成
docs/adr/          設計の判断の記録（ADR）
```

ユニットテストは対象のファイルの隣に `*.test.ts` として置きます。

アプリのコードは例外でエラーを扱います。`AppError` のサブクラス（`ConflictError` / `NotFoundError` / `LimitExceededError` / `ValidationError`）をサーバーで throw すると、画面で同じクラスとして catch できます（`src/shared/errors.ts`）。`google.script.run` は例外のクラスを運べないため、通信の区間だけ `{ ok, data | error }` の封筒に詰め替え、受け取った側でコードから同じクラスに戻します（`src/shared/envelope.ts`）。

GAS の画面は iframe の中で動くため、`location` や `history` を直接触っても利用者が見ている URL は変わりません。画面は URL を `src/client/navigation/` だけを通して読み書きします。iframe の外へ出るリンク（`<a href>`）も使えないので、画面の移動はボタンで行います。

### データの置き場所

本番では、`npm run setup` に渡したスプレッドシートにアプリ自身がシートを作ります。手で作るものはありません。

| シート | 1行の中身 | 列 |
| --- | --- | --- |
| `notebooks` | メモ帳1冊 | `id`・`createdAt`・`lastAccessedAt` |
| `settings` | 設定1項目（「設定を変える」） | `key`・`value`・`description` |
| `nb_<メモ帳ID>` | メモ1件 | `id`・`title`・`body`・`createdAt`・`updatedAt`・`updatedBy` |

- 列は位置ではなく1行目のヘッダー名で読みます。シートやヘッダーが無ければ、最初に使ったときに作ります
- メモ帳のシートは作るときに6列・ヘッダー1行に縮めます。既定の 1000行×26列 のままだと、スプレッドシート全体の1000万セルの上限に約380冊で届くためです
- セルはすべて書式なしテキストにします。日時や ID が日付・数値に変換されないようにするためです
- 書き込みは `LockService` で直列化します

ローカル版とスプレッドシート版の Repository には同じテスト（`src/server/application/repositoryContract.ts`）を当てています。スプレッドシート版は `SpreadsheetApp` を真似たフェイク（`src/server/infrastructure/gas/fakeSpreadsheet.ts`）の上で動かします。

### 層の依存の向き

層をまたぐ import は Biome の `noRestrictedImports` で縛っています（`biome.json` の `overrides`）。違反すると `npm run lint` が失敗します。

| 場所 | import してはいけないもの |
| --- | --- |
| `shared/` | `client/`・`server/` |
| `client/` | `server/` |
| `server/domain/` | ほかのすべての層（`shared/` だけ使える） |
| `server/application/` | `infrastructure/`・`entry/` |
| `server/infrastructure/gas/` と `entry/gas.ts` | ローカル用の実装、`entry/` |
| `server/infrastructure/local/` と `entry/local.ts` | GAS 用の実装、`entry/` |
