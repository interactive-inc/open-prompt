---
name: update-issue
description: Issueの説明文を確認・更新する。「Issueを更新」「Issueの内容を追記」などのリクエスト時に使用。
---

# Update Issue

Issueの説明文を確認し、必要に応じて更新する。

## ワークフロー

### ステップ1: ブランチからIssue番号を特定

```bash
git branch --show-current
# ブランチ名の先頭の数字がIssue番号
# 例: "123-fix-bug" → Issue #123
```

### ステップ2: Issueの内容を取得

```bash
gh issue view <issue番号>
```

### ステップ3: 更新内容を提案

Issueの説明文に追記・修正が必要な場合、AskUserQuestionで確認する。

- 更新案を提示し「この内容でIssueを更新しますか?」と確認
- ユーザーが承認した場合のみ `gh issue edit --body` で更新

## シンプルなテンプレート

```markdown
## 概要

[作業の目的・背景]

## 対応内容

- [ ] タスク1
- [ ] タスク2

## 備考
```
