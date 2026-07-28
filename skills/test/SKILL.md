---
name: test
description: "Route development verification to a subcommand: `unit` for bun:test unit tests, `a11y` for WCAG 2.2 review, `visual` for before/after screenshot checks, `diff` for two-source UI overlay comparison"
argument-hint: "[unit|a11y|visual|diff]"
user-invocable: true
disable-model-invocation: false
---

> このスキルを更新するときは [CLAUDE.md](../dev/CLAUDE.md) の方針に従う。

開発時の検証の入口。何を検証したいかでサブコマンドに振り分ける。

# 振り分け

`/product:test {入力}` は入力の種類で振り分ける。

- `unit` ⇒ [commands/unit.md](commands/unit.md)（ライブラリ関数・React コンポーネントの単体テストを作成・実行・修正する）
- `a11y` ⇒ [commands/a11y.md](commands/a11y.md)（コードなら WCAG 2.2 レベル A の静的レビュー、URL なら axe-core + Playwright の実行テスト）
- `visual` ⇒ [commands/visual.md](commands/visual.md)（自分の UI 変更が実際に描画されているかをスクリーンショットで確認する）
- `diff` ⇒ [commands/diff.md](commands/diff.md)（Figma と実装、本番とローカルなど 2 ソースを重ねて差分を言語化する）

# 選び分けの基準

コードの正しさを検証するのが unit、仕様への準拠を検証するのが a11y、見た目を検証するのが visual と diff。

visual と diff はどちらも見た目の検証だが目的が違う。自分が今変えた箇所が反映されているかのセルフチェックが visual、基準（デザインカンプ・本番・リファクタ前）と比べて意図しない差が出ていないかの比較レビューが diff。
