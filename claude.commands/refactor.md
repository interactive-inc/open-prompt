---
description: Check if staged files comply with coding rules before commit
---

# Check Rules Compliance

変更ファイルがコーディングルールに準拠しているか確認する。

## Steps

1. 変更ファイルの一覧を取得する
   - `git status --short` - すべての変更
   - `git diff --name-only` - unstaged の変更
   - `git diff --cached --name-only` - staged の変更
2. 変更されたファイルの拡張子やパスから、適用されるルールを特定する
   - ルールファイル: `.claude/rules`
3. 各ファイルの内容を確認し、ルール違反がないかチェックする
4. 違反があれば修正する
5. すべてのファイルがルールに準拠していることを確認して完了

## Caution

- ルールに明記されていない事項は修正しない
- 軽微な違反でも修正する
