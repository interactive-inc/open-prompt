---
applyTo: "**/docs/**/routes/*.md"
---

# `docs/**/routes/*.md` - ページの定義

ページの要件を定義。

```
---
features:
  - feature-a
  - feature-b
---
# [ページ名]

[ページの目的と概要を1-2文で]

- [ファイル名]()

## UI/UX

UI/UXに関する最低限の情報。

## 補足A

[必要に応じて補足情報]
```

## Fontmatter

- `features`: ページに関連する機能のリスト。機能は`docs/products/*/features/*.md`に定義されている必要があります。
