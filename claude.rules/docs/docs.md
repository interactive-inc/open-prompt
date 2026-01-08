---
paths: "docs/**/*.md"
---

# Docs Management

製品仕様を管理するドキュメント。

## Directory Layout

```
docs/
├── products/
│   └── {product-id}/
│       ├── index.md
│       ├── features/{feature}.md
│       ├── pages/{page}.md
│       ├── terms/{term}.md
│       └── notes/{note}.md
├── terms/{term}.md
└── notes/{note}.md
```

## Tools

### Reading

- `Grep` - キーワード検索
- `Read` - ファイル読み込み
- `mcp__docs__list-files` - ディレクトリ内の一覧（title, description 付き）

`list-files` は全体を把握したいときに使う。検索は `Grep` を使う。

### Writing

**Edit 禁止。必ず `mcp__docs__write-file` を使う。**

- Edit → `updated-at` が更新されない
- Write → `updated-at` が更新されない
- `mcp__docs__write-file` → `updated-at` が自動更新される

```
mcp__docs__write-file
  path: "jobantenna/terms/user"
  markdown: "# ユーザー\n\n..."
```

削除は `rm` を使用。

## Workflow

1. `Grep` で関連ファイルを検索
2. `Read` で既存の仕様を確認
3. 対話で要件を確認
4. 書き込み前に内容を提示: 「以下の内容で書き込みます」
5. ユーザーの承認を待つ
6. `mcp__docs__write-file` で更新

## Anti-Hallucination

- 知らない用語 → terms を読む
- 仮定 → 読み込みで検証
- 新しい概念 → 確認後に terms へ書く
