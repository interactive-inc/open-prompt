---
name: test-stories
description: ユーザーストーリーからE2Eテストを作成・更新するスキル。.docs/experience/stories/のストーリーに基づいてPlaywrightテストを生成する。
disable-model-invocation: true
---

# 指示

このスキルが呼び出されたら、以下の手順を実行する。


## 初期セットアップ確認


### playwright.config.ts

存在しない場合は作成。`stories` プロジェクトの設定:

- `video: "off"`
- `screenshot: "off"`


### .gitignore

以下のエントリがなければ追加:

```
test-results/
playwright-report/
```


## 開発サーバーの起動

```bash
# サーバーが起動していなければ起動
lsof -i :5173 2>/dev/null | grep -q LISTEN || bun run dev &
sleep 3
```


## ストーリーファイルの読み込み

```bash
# 全ストーリーファイルを一覧
ls .docs/experience/stories/*.md
```


## 不足テストの特定

```bash
# ストーリーファイル一覧
ls .docs/experience/stories/*.md | xargs -I {} basename {} .md | sort > /tmp/stories.txt

# 既存テスト一覧
ls tests/stories/*.e2e.ts 2>/dev/null | xargs -I {} basename {} .e2e.ts | sort > /tmp/story-tests.txt

# 不足テスト
comm -23 /tmp/stories.txt /tmp/story-tests.txt
```


## テストの作成（並列処理）

不足テストが複数ある場合、**サブエージェントを並列起動**してテストを作成する。


### 並列処理の方針

- 3ストーリー以上の場合: Task ツールで複数のサブエージェントを同時起動
- 各サブエージェントに 2-3 ストーリーを割り当て
- サブエージェントはストーリーを読み、agent-browser で構造確認、テスト作成


### サブエージェントへの指示例

```
以下のストーリーのE2Eテストを作成してください:
- .docs/experience/stories/domestic-ticket-purchase.md
- .docs/experience/stories/navigation.md

手順:
1. ストーリーファイルを読み込む
2. FrontMatter（persona: または test-aspect:）を確認
3. 各ステップで agent-browser を使ってページ構造を確認
4. tests/stories/<story-name>.e2e.ts にテストを作成

テンプレート:
import { expect, test } from "@playwright/test"

test.describe("チケット購入 @persona:domestic", () => {
  test("ホームからチケットページへ遷移できる", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByRole("link", { name: "チケットガイド", exact: true }).click()
    await expect(page).toHaveURL(/\/ticket/)
  })
})

FrontMatterによる分類:
- persona: 国内来園者 → @persona:domestic
- test-aspect: 多言語対応 → @test-aspect:i18n
```


### 命名規則

- ストーリー: `.docs/experience/stories/domestic-ticket-purchase.md`
- テスト: `tests/stories/domestic-ticket-purchase.e2e.ts`


## テストの実行と修正

```bash
bunx playwright test --project=stories
```

失敗したテストがあれば修正する。


## 完了確認

```bash
# 不足テストがないことを確認
comm -23 /tmp/stories.txt /tmp/story-tests.txt

# 全テスト通過を確認
bunx playwright test --project=stories
```

出力がなく、全テストが通過すれば完了。
