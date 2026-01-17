---
name: infer-design-rules
description: Analyze existing code to extract patterns and conventions, then document them as design guidelines. Use this skill when you want to derive consistent rules from a codebase and keep design documentation in sync with actual implementation.
---

# Infer Design Rules

デザインガイドラインを参照した開発と、決定事項の追記を行う。

## ガイドラインの場所

`.claude/skills/ui-design/SKILL.md`

## 開発時の基本方針

- ページやコンポーネント作成・修正時はデザインガイドラインを参照
- ガイドラインにないパターンが必要な場合はユーザーに確認
- 決定事項はデザインガイドラインに追記

## 注目する観点

デザインガイドラインには以下のような観点が含まれる:

- スペーシング
- コンポーネント粒度
- UIライブラリの活用
- ページ構造
- レイアウトパターン
- ローディング状態
- リスト/テーブル表示
- ダイアログ/モーダル

## ガイドライン更新手順

1. 会話履歴からデザインに関する決定事項を抽出
2. `.claude/skills/ui-design/SKILL.md` を読み込み
3. 新しい内容を適切なセクションに追記
4. 重複や矛盾がないか確認
5. ユーザーに追記内容を提示して確認を得る
6. 承認後、ファイルを更新

## 抽出対象

会話から以下のようなデザイン決定を抽出する:

- コンポーネントの使い方 (Field、Item、Card等)
- スペーシングルール (gap、space-y等)
- フォーム構造パターン
- CSS変数やカスタムユーティリティ
- 禁止事項や推奨事項
- shadcn-uiコンポーネントの使用方法

## 追記フォーマット

既存のセクションに追記するか、新しいセクションを作成する。

```markdown
## セクション名

説明文。

```tsx
// コード例
```
```

## 注意事項

- 既存のルールと矛盾する場合はユーザーに確認
- コード例は簡潔に
- 「なぜそうするか」の理由も記録
- 新しいパターンを採用したらガイドラインに記録
