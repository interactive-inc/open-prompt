---
name: check-docs
description: .docs/ の仕様書を操作する。「仕様を確認」「ドキュメント更新」「〇〇の仕様は？」などで起動。
---

# 仕様書スキル

`.docs/` の仕様書を検索・更新する。

## 引数

- `--update`: 仕様書を更新する（デフォルト: PRで変更されたファイルのみ）
- `--update --full`: 全ファイルを探索して仕様書を最新化
- なし / 質問文: 仕様書から情報を検索して回答

## モード判定

引数またはユーザーの発言から判定:

- **更新モード**: `--update` または「更新して」「同期して」「書き換えて」
- **検索モード**: それ以外（「〇〇の仕様は？」「〇〇について教えて」など）

---

## 検索モード

仕様書から情報を探して回答する。

### 手順

1. **構成確認**: [構成](references/structure.md) を読んで全体像を把握
2. **対象特定**: ユーザーの質問から関連するファイルを推測
   - ドメイン用語 → `glossary.md`, `domain/`
   - 画面・UI → `interface/pages/`
   - API → `application/`
   - 技術構成 → `architecture/`, `infrastructure/`
3. **ファイル読み込み**: 該当する `.docs/` ファイルを読む
4. **回答**: 仕様書の内容を元に回答

### 見つからない場合

仕様書に記載がない場合:

1. コードを直接確認して回答
2. 「仕様書に未記載のため、コードから確認しました」と補足
3. 必要に応じて `--update` での仕様書更新を提案

---

## 更新モード

コード変更を仕様書に反映する。

### Phase 0: 構成確認

**必ず最初に [構成](references/structure.md) を読む。**

**重要なルール:**

- リファレンスに定義されているファイル名・ディレクトリ名のみ使用可
- 独自のファイル名（例: overview.md を各層に追加）は禁止
- ディレクトリ構成の変更・統合は禁止
- プロジェクトに不要なファイル・ディレクトリは省略してよい

`.docs/` が存在しない場合:

1. 構成リファレンスに従ってディレクトリを作成
2. 製品パターン（Web + API / API のみ / Web のみ）を判断
3. 各層のリファレンス（[interface](references/files/interface.md) 等）を読む
4. リファレンスに定義されたファイルのみ作成

`.docs/` が存在する場合:

1. 既存の構成を確認
2. 構成リファレンスと一致しているか検証
3. リファレンスにないファイルがあれば削除または移動

### Phase 1: 準備

**ブランチ確認**

mainブランチ以外の場合:

```bash
gh pr view --json number,title,body,baseRefName
```

PRが見つかったら、関連Issueを特定:

```bash
gh pr view --json body | grep -oE '#[0-9]+'
gh issue view <number> --json title,body
```

Issueから開発の背景を読み取る。見つからない場合は無視。

### Phase 2: コード探索（並列）

**対象ファイルの決定**

```bash
# --full の場合
find src -type f -name "*.ts" -o -name "*.tsx"

# デフォルト（差分のみ）
git diff main...HEAD --name-only
```

**並列探索**

Explore エージェントを並列起動して以下を調査:

- domain/: スキーマ、モデル、型定義を探索
- application/: APIルート、ユースケースを探索
- interface/: ルート定義、コンポーネントを探索
- infrastructure/: DB設定、外部連携を探索

各エージェントはファイル名とFrontMatter（更新日時）を収集。

### Phase 3: 書類更新（並列）

探索結果から更新が必要なファイルを特定し、general-purpose エージェントを並列起動:

- 各 .docs ファイルを担当するエージェントを起動
- コードから「なぜ」を抽出して書類に反映
- FrontMatter の updated-at を更新

**pages/ の網羅性チェック:**

`--full` の場合、全ルートファイルに対応するページドキュメントが存在することを確認:

```bash
# ルートファイル一覧
ls app/routes/

# 既存ページドキュメント
ls .docs/product/interface/pages/
```

不足しているページドキュメントがあれば作成する。

### Phase 4: 検証

生成された書類を確認:

- 矛盾がないか
- 仕様バグがないか
- 不整合がないか

### Phase 5: 質問

AskUserQuestion ツールで不明点を質問:

- コードから読み取れない設計意図
- 採用しなかった選択肢の理由
- ビジネス上の制約

---

## リファレンス

構成と書き方の詳細:

- [構成](references/structure.md) - ディレクトリ構成
- [製品パターン](references/product-patterns.md) - Web + API / API のみ / Web のみ
- [層の役割](references/layers.md) - 各レイヤーの責務
- [ルール](references/rules.md) - 記述ルール
- [FrontMatter](references/frontmatter.md) - メタデータ形式

各ファイルの書き方:

- [glossary](references/files/glossary.md)
- [overview](references/files/overview.md)
- [domain](references/files/domain.md)
- [application](references/files/application.md)
- [interface](references/files/interface.md)
- [infrastructure](references/files/infrastructure.md)
- [architecture](references/files/architecture.md)
- [experience](references/files/experience.md)

背景と設計思想は [README.md](README.md) を参照。
