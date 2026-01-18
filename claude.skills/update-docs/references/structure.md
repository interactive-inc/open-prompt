# 構成

## 単一製品

```
.docs/
  glossary.md                # 用語集
  experience/                # 誰のために作るか（Web のみ / Web + API）
    stories/
      {story}.md             # ユーザーストーリー
    personas.md              # ペルソナ
  product/
    overview.md              # なぜこの製品を作るのか
    interface/               # UI/画面/API関連
      sitemap.md             # サイトマップ（Web のみ / Web + API）
      api.md                 # API設計（API のみ / Web + API）
      features/
        {feature}.md         # 機能ごとの概要・目的
      pages/
        {route}.md           # 画面設計（Web のみ / Web + API）
    domain/                  # ドメイン層
      actors.md              # アクター（ロール）
      relationships.md       # 概念の関係
      models/
        {model}.md           # 集約ルート + 不変条件
    application/             # アプリケーション層
      policies/              # 横断的な制約やルール
        permissions.md       # 認証/認可
        {policy}.md          # 制約ごとにファイル作成
      services/
        {aggregate}.md       # 集約ごとのサービス
        workflows.md         # 複数サービスにまたがるワークフロー（任意）
      processes.md           # バックグラウンド処理
    infrastructure/          # インフラストラクチャ層
      database.md            # スキーマ設計の意図
      operations.md          # 運用（監視、デプロイ、アラート）
      integrations/
        {service}.md         # 外部サービス連携
  architecture/
    overview.md              # 技術選定と理由
    decisions/
      {decision}.md          # 設計判断（ADR）
```

## 複数製品

```
.docs/
  glossary.md                # 共通用語集
  experience/                # 共通（Web のみ / Web + API）
  products/
    {product}/               # 製品ごとのディレクトリ
      overview.md
      interface/
      domain/
      application/
      infrastructure/
  architecture/              # 共通アーキテクチャ
```

各製品ディレクトリは単一製品の product/ と同じ構造。
