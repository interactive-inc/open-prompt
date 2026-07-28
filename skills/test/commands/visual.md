# visual — UI 変更の目視検証

`/product:test visual` は、UI の変更（CSS・レイアウト・トランジション等）を push した後、ブラウザで実際にレンダリングされた結果をスクリーンショットで確認し、期待通りに変更が反映されているか検証する。

## いつ使うか

- CSS / Tailwind のクラス変更後、「本当にボーダー見えてる？」「色変わってる？」を自分で確認したいとき
- 「修正しました」とオーナーに報告する前のセルフチェック
- トランジション・アニメーションの有無確認（GIF キャプチャ）

## ワークフロー

### 1. 対象ページの特定

変更したコンポーネントが表示されるページの URL を特定する。ローカル開発サーバーが起動していることを確認。

### 2. 変更前のキャプチャ（任意）

変更前の状態が必要な場合は、変更を revert してからキャプチャする。

```
git stash
# キャプチャ実行
git stash pop
```

### 3. スクリーンショット取得

`mcp__claude-in-chrome__` ツール群を使う。

1. `tabs_context_mcp` で現在のタブを確認
2. `tabs_create_mcp` または `navigate` で対象ページを開く
3. ページ読み込み完了を待つ
4. `computer` でスクリーンショットを取得（screenshot アクション）
5. 特定要素にフォーカスが必要な場合は `javascript_tool` でスクロールやクリックしてから撮影

### 4. 検証ポイント

変更内容に応じて以下を確認する:

- **ボーダー**: 線が見えているか、色・太さが正しいか
- **背景色**: 期待した色が付いているか、テーマ（ライト/ダーク）で両方確認
- **レイアウト**: 要素の配置、余白、カラム数が期待通りか
- **トランジション/アニメーション**: `gif_creator` で操作前後を録画して動きを確認
- **レスポンシブ**: `resize_window` でビューポートを変えて確認

### 5. 結果報告

検証結果を簡潔にまとめる:

```
✅ ボーダー: border-border が各セクション間に表示されている
✅ 背景色: アクティブ項目に bg-sidebar-accent が反映
❌ トランジション: 開閉時に高さのアニメーションが見られない
```

## トランジション・アニメーションの検証

CSS トランジションやアニメーションは静止画では確認できない。

1. `gif_creator` を使って操作の前後を GIF で録画
2. 録画中に対象要素をクリック/ホバーしてトランジションを発火させる
3. 録画ファイル名は内容がわかるものにする（例: `accordion-transition.gif`）
4. GIF を確認して、期待したアニメーションが含まれているか判定

## DevTools による補助確認

スクリーンショットだけでは分からない場合:

1. `javascript_tool` で `getComputedStyle()` を実行し、実際に適用されている CSS 値を確認
2. `read_console_messages` でエラーがないか確認

```javascript
// 例: ボーダーの実際の値を確認
const el = document.querySelector('[data-slot="collapsible-content"]');
const style = getComputedStyle(el);
console.log('height:', style.height);
console.log('transition:', style.transition);
console.log('overflow:', style.overflow);
```

## 出力先

- スクリーンショット・GIF: `/tmp/product-test/visual/`
- 比較対象がある場合は `before-` / `after-` プレフィックスを付ける
