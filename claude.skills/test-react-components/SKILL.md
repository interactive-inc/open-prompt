---
name: test-react-components
description: "app/components の単体テストを作成・実行・修正する。React Testing Library + happy-dom を使用。Use when: コンポーネントのテスト作成、テスト実行、テスト修正を依頼された時。"
---

# Test Components

`app/components/` のReactコンポーネント単体テストを作成・実行・修正する。


## ワークフロー


### Phase 0: 戦略確認

**必ず最初に [戦略](/.claude/strategies/test-pure-components.md) を読む。**

戦略ファイルにはテスト対象の分類、探索方法、テストパターンが定義されている。


### Phase 1: セットアップ確認

依存関係がインストール済みか確認。

```bash
bun pm ls | grep -E "(testing-library|happy-dom)"
```

未インストールの場合:

```bash
bun add -D @testing-library/react @testing-library/dom happy-dom
```

`tests/setup-dom.ts` と `bunfig.toml` が存在することを確認。


### Phase 2: テスト対象の探索

**全ディレクトリを探索してテスト可能なコンポーネントを特定する。**

`components.json` の `aliases.ui` ディレクトリ（shadcn/ui 公式）は除外する。

```bash
# 除外パターン定義（戦略ファイルと同期）
EXCLUDE_HOOKS="useLoaderData\|useParams\|useSearchParams\|useNavigate\|useLocation\|useFetcher\|useMatches\|useLang\|useHref\|useHome\|useTranslationTag\|useTranslationData\|useParkingTranslationTag\|useUrlParams\|useUrlParamArray\|useAnchorSmoothScroller\|useSectionScrollNavigation\|useExcludedPage\|useKlookUrl\|useIsMobile\|useTicketStock"

# テスト不可のフックを使用しているコンポーネント数
grep -rl "$EXCLUDE_HOOKS" app/components --include="*.tsx" | grep -v "\.test\.tsx" | wc -l

# テスト可能なコンポーネント（ui/ と フック使用を除外）
all_files=$(find app/components -name "*.tsx" -not -name "*.test.tsx" -not -path "*/ui/*" | sort)
hook_files=$(grep -rl "$EXCLUDE_HOOKS" app/components --include="*.tsx" | grep -v "\.test\.tsx" | sort)
comm -23 <(echo "$all_files") <(echo "$hook_files")

# テストがないファイル（ui/ を除外）
find app/components -name "*.tsx" -not -name "*.test.tsx" -not -path "*/ui/*" | while read f; do
  test -f "${f%.tsx}.test.tsx" || echo "Missing: $f"
done
```


### Phase 3: ユーザー確認

探索結果をユーザーに提示し、以下を確認する：

- 探索対象から漏れているディレクトリはないか
- テスト対象外として除外すべきコンポーネントはないか
- 優先的にテストすべきコンポーネントはあるか

**AskUserQuestion を使用して確認すること。**


### Phase 4: テスト作成

戦略のテストパターンに従ってテストを作成。


### Phase 5: テスト実行・修正

```bash
# コンポーネントテストのみ実行
bun test app/components
```

失敗したテストを修正し、全テストがパスするまで繰り返す。


### Phase 6: 全体テスト確認

**必ず全体のテストを実行して、他のテストに影響がないことを確認する。**

```bash
# 全テスト実行
bun test
```

全テストがパスすることを確認する。失敗した場合は原因を調査し修正する。

よくある問題:
- グローバル環境（window, document）を上書きするテストが他のテストに影響を与える
- `beforeAll` / `afterAll` で環境を保存・復元していない


## 除外フック一覧

戦略ファイルで定義された除外対象フック:


### React Router 直接依存

- `useLoaderData`
- `useParams`
- `useSearchParams`
- `useNavigate`
- `useLocation`
- `useFetcher`
- `useMatches`


### プロジェクト固有フック（Router間接依存）

- `useLang` → useParams依存
- `useHref` → useLocation依存
- `useHome` → useLocation依存
- `useTranslationTag` → useLocation, useMatches依存
- `useTranslationData` → useLocation依存
- `useParkingTranslationTag` → useLocation, useMatches依存
- `useUrlParams` → useLocation依存
- `useUrlParamArray` → useUrlParams依存
- `useAnchorSmoothScroller` → useLocation依存
- `useSectionScrollNavigation` → useLocation依存
- `useExcludedPage` → useLocation, useLang依存
- `useKlookUrl` → useTranslationTag依存


### ブラウザAPI / 外部API依存

- `useIsMobile` → window.innerWidth依存
- `useTicketStock` → 外部API依存


## テスト作成ルール

- `bun:test` から `test` と `expect` を使用
- `@testing-library/react` から `render`, `screen` を使用
- テストタイトルは日本語
- ファイル名: `*.test.tsx`
- 同じディレクトリに配置
- 1テスト1アサーション


## テンプレート

```typescript
import { test, expect } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Button } from "./button"

test("正常系：デフォルトのボタンをレンダリングする", () => {
  render(<Button>Click me</Button>)
  const button = screen.getByRole("button", { name: "Click me" })
  expect(button).toBeDefined()
})

test("正常系：variant=orange でスタイルが適用される", () => {
  render(<Button variant="orange">Submit</Button>)
  const button = screen.getByRole("button")
  expect(button.className).toContain("bg-orange")
})

test("正常系：disabled 属性が適用される", () => {
  render(<Button disabled>Disabled</Button>)
  const button = screen.getByRole("button")
  expect(button.hasAttribute("disabled")).toBe(true)
})
```


## Link を含むコンポーネント

react-router の `Link` を使用するコンポーネントは `MemoryRouter` でラップする。

```typescript
import { MemoryRouter } from "react-router"

test("正常系：リンクがレンダリングされる", () => {
  render(
    <MemoryRouter>
      <DocLink href="/test">リンク</DocLink>
    </MemoryRouter>
  )
  expect(screen.getByRole("link")).toBeDefined()
})
```


## クエリ優先順位

1. `getByRole` - アクセシビリティロール
2. `getByLabelText` - フォーム要素
3. `getByText` - テキストコンテンツ
4. `getByTestId` - 最終手段


## よくあるエラー

**要素が見つからない:**

```
Unable to find an element with the role "button"
```

→ `screen.debug()` でDOMを確認

**document is not defined:**

→ `tests/setup-dom.ts` と `bunfig.toml` を確認

**requestAnimationFrame is not defined:**

→ `tests/setup-dom.ts` に以下を追加:

```typescript
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
globalThis.ResizeObserver = window.ResizeObserver
```
