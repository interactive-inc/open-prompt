---
name: check-issue
description: main以外のブランチで作業開始時に、ブランチ名から関連するGitHub Issueを特定し作業内容を理解する。Issueが空または不足している場合はユーザーに確認してから更新する。「このブランチのissueは？」「作業内容を確認」などのリクエスト時に使用。
---

# Check Issue

main以外のブランチで作業する際に、関連するGitHub Issueを特定して作業内容を理解する。

## ワークフロー

### 1. ブランチ名からIssue番号を特定

```bash
git branch --show-current
# ブランチ名の先頭の数字がIssue番号
# 例: "2-update-react-draft" → Issue #2
```

### 2. Issueの内容を取得

```bash
gh issue view <issue番号>
```

### 3. 内容を確認

Issueの本文（body）が空または不足している場合：
- AskUserQuestionツールでユーザーに作業内容を確認
- `.github/ISSUE_TEMPLATE/`があれば適切なテンプレートを提案（詳細は [references/issue_templates.md](references/issue_templates.md)）
- テンプレートがなければシンプルな形式で作成

### 4. Issueを更新（必要な場合）

ユーザーの確認後、`gh issue edit`で更新。

## シンプルなテンプレート

ISSUE_TEMPLATEがないリポジトリでは以下を使用：

```markdown
## 概要
[作業の目的・背景]

## 対応内容
- [ ] タスク1
- [ ] タスク2

## 備考
```
