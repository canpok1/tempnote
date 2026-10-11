# 0002. ファビコンはリポジトリの PNG を GitHub から配る

- ステータス: 採用
- 日付: 2026-10-11

## コンテキスト

GAS の画面は iframe の中で動き、ブラウザのタブに出るのは外側（script.google.com）のページのファビコン。画面の HTML に `<link rel="icon">` を書いても無視され、`HtmlOutput.setFaviconUrl` に画像の URL を渡す方法しかない。URL は拡張子で画像の種類を示す必要がある。GAS 自身は画像を配れない（ContentService はテキストしか返せない）。リポジトリは公開していて、誰でも clone して自分の環境に構築できる前提。

## 決定

ロゴの SVG から作った PNG を `assets/favicon.png` に置き、`raw.githubusercontent.com` の URL を `setFaviconUrl` に渡す。URL はビルド時に決める。GitHub Actions では `GITHUB_REPOSITORY`、手元では `package.json` の `repository` からリポジトリを決め、`FAVICON_URL` で上書きできる。

## 結果

GAS 側に置くものは増えず、clone した人の環境でも自分のリポジトリから配られる。リポジトリを非公開にすると読めなくなるので、そのときは `FAVICON_URL` で公開された場所を指す。`main` ブランチの画像を指すため、ロゴを変えると production にも main へ入った時点で反映される。

## 検討した代替案

- data URL を `setFaviconUrl` に渡す: 外部に頼らずに済むが、受け付けられるかが公式資料に無く、確かめられなかった
- Google ドライブに置いて共有リンクを使う: 環境ごとに手でアップロードと共有設定が要り、「空のスプレッドシートとコマンドだけで構築」から外れる
