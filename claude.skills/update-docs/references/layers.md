# 層の役割

product/ 内のレイヤー構造。

| 層 | 何を記述するか | 必須 |
|----|---------------|------|
| interface/ | 機能・画面・導線・API | ○ |
| domain/ | 概念・ルール・用語 | ○ |
| application/ | 振る舞い・ユースケース | ○ |
| infrastructure/ | DB設計・外部連携・運用 | ○ |

## product/ 外

| ディレクトリ | 何を記述するか | 必須 |
|-------------|---------------|------|
| glossary.md | 用語集 | ○ |
| experience/ | ペルソナ・ストーリー | 任意 |
| architecture/ | 技術選定・ADR | ○ |

## 実装との対応

- interface/ → コンポーネント、ルート
- domain/ → schema.ts、型定義
- application/ → API routes、サービス
- infrastructure/ → DB設定、外部サービス接続
