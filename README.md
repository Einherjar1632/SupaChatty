# Supabase + Next.js チャットアプリサンプル

このプロジェクトは、SupabaseとNext.jsを使用して構築されたチャットアプリケーションのサンプルです。

## 主な機能

- ログイン認証 (Supabase Auth)
- リアルタイムチャット (Supabase Realtime)
  - SupabaseのINSERTイベントを検知し予め購読しておいたチャット画面に自動描画します
- 添付ファイルのアップロード (Supabase Storage)
  - アップロードされたファイルは次回のファイルアップロード時に自動的に削除されます
- バックエンド機能 (Supabase Edge Functions)

## 技術スタック

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)

## セットアップ

1. リポジトリをクローン
2. 依存関係をインストール: `npm install`
3. Supabaseプロジェクトを作成し、環境変数を設定
4. Supabaseでの設定:
   - `chat` テーブルを作成 (chat.tsxの型を参照)
   - `chat` テーブルに対してselect権限とinsert権限を付与
   - `chat` テーブルのRealtime機能をオンにする
5. アプリケーションを実行: `npm run dev`

## Supabaseテーブル設定

`chat` テーブルの構造 (chat.tsxの型に基づく):

- id: uuid (主キー)
- created_at: timestamp
- user_id: text
- chat_text: text
- attachment_url: text

必ず上記のテーブルを作成し、適切な権限設定とRealtime機能の有効化を行ってください。

## ライセンス

[MIT](https://choosealicense.com/licenses/mit/)