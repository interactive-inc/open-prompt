
# Webアクセシビリティレビュー（WCAG 2.2 レベルA）

WCAG 2.2 レベルA準拠のためのコードレビュー・コーディングガイドライン。
レベルAはWCAGの最低限の適合レベルであり、すべてのWebサイトが満たすべき基本要件。

## 除外項目の扱い

対象プロジェクトで該当しない基準（動画を使っていない、複数ステップのフォームがない等）は、依頼時に除外項目として指定する。設定ファイルで恒久的に除外する仕組みは持たない。除外した項目と理由は出力に含め、機能追加時に再チェックが必要なことを明示する。

---

## 1. 知覚可能（Perceivable）

### 1.1.1 非テキストコンテンツ

```html
<!-- ✅ 正しい - 意味のある画像にはalt必須 -->
<img src="engineer.jpg" alt="現場で作業するエンジニア" />

<!-- ✅ 正しい - 装飾画像はalt空 -->
<img src="decoration.svg" alt="" />

<!-- ✅ 正しい - アイコンボタンはaria-label -->
<button aria-label="メニューを開く">
  <svg>...</svg>
</button>

<!-- ❌ 問題 - altなし -->
<img src="photo.jpg" />

<!-- ❌ 問題 - 意味のないalt -->
<img src="ceo.jpg" alt="画像" />
```

### 1.2.1〜1.2.3 メディアのアクセシビリティ

```html
<!-- ✅ 正しい - キャプション付き動画 -->
<video controls>
  <source src="interview.mp4" type="video/mp4" />
  <track kind="captions" src="interview-ja.vtt" srclang="ja" label="日本語" />
</video>

<!-- ✅ 正しい - テキスト代替（書き起こし）へのリンク -->
<video controls aria-describedby="video-transcript">...</video>
<div id="video-transcript">
  <h3>動画の書き起こし</h3>
  <p>...</p>
</div>

<!-- ✅ 正しい - 音声のみコンテンツにテキスト代替 -->
<audio controls aria-describedby="audio-transcript">
  <source src="podcast.mp3" type="audio/mpeg" />
</audio>
<div id="audio-transcript">
  <h3>音声の書き起こし</h3>
  <p>...</p>
</div>

<!-- ❌ 問題 - キャプション/代替なし -->
<video controls>
  <source src="interview.mp4" type="video/mp4" />
</video>
```

📋 **ユーザー確認が必要:**

- [ ] キャプションの内容は正確か
- [ ] 音声解説は映像を十分に説明しているか
- [ ] 書き起こしは音声/映像の内容を網羅しているか

### 1.3.1 情報及び関係性

```html
<!-- ✅ 正しい - セマンティックな構造 -->
<header>
  <nav aria-label="メインナビゲーション">...</nav>
</header>
<main>
  <h1>ページタイトル</h1>
  <section aria-labelledby="section1-heading">
    <h2 id="section1-heading">セクション見出し</h2>
  </section>
</main>
<footer>...</footer>

<!-- ✅ 正しい - フォームのラベル -->
<label for="email">メールアドレス</label>
<input type="email" id="email" name="email" />

<!-- ❌ 問題 - divで構造化 -->
<div class="header">...</div>
<div class="content">...</div>

<!-- ❌ 問題 - ラベルなしのinput -->
<input type="text" placeholder="お名前" />
```

### 1.3.2 意味のあるシーケンス

```html
<!-- ✅ 正しい - DOMの順序が視覚順序と一致 -->
<nav>
  <a href="/">ホーム</a>
  <a href="/about">会社概要</a>
  <a href="/contact">お問い合わせ</a>
</nav>

<!-- ❌ 問題 - CSSで並び替え（スクリーンリーダーと不一致） -->
<style>
  .reverse {
    flex-direction: row-reverse;
  }
</style>
```

### 1.3.3 感覚的な特徴

```html
<!-- ✅ 正しい - 視覚的位置に依存しない説明 -->
<p>「送信」ボタンをクリックしてください</p>
<p>お名前の入力欄は必須です</p>

<!-- ✅ 正しい - 位置＋要素名を併用 -->
<p>ページ右上の「お問い合わせ」リンクからご連絡ください</p>

<!-- ❌ 問題 - 位置のみに依存 -->
<p>右側のボタンをクリックしてください</p>
<p>上のリンクを参照</p>

<!-- ❌ 問題 - 色のみに依存 -->
<p>赤いテキストは必須項目です</p>
<p>緑のボタンで確定してください</p>
```

📋 **チェックポイント:**

- 「左」「右」「上」「下」などの位置表現のみで要素を特定していないか
- 「赤い」「青い」などの色のみで要素を特定していないか
- 形状（「丸いボタン」等）のみで要素を特定していないか

### 1.4.1 色の使用

```html
<!-- ✅ 正しい - 色＋アイコンで伝達 -->
<span class="error">
  <svg aria-hidden="true"><!-- エラーアイコン --></svg>
  入力内容に誤りがあります
</span>

<!-- ✅ 正しい - 必須項目の明示 -->
<label> お名前<span class="required">（必須）</span> </label>

<!-- ❌ 問題 - 色だけで必須を表現 -->
<label class="text-red">お名前</label>
```

### 1.4.2 音声の制御

```html
<!-- ✅ 正しい - 自動再生なし、controls付き -->
<video controls>
  <source src="intro.mp4" type="video/mp4" />
</video>

<!-- ✅ 正しい - 自動再生だがミュート＋制御あり -->
<video autoplay muted controls>
  <source src="background.mp4" type="video/mp4" />
</video>

<!-- ✅ 正しい - 音声も同様 -->
<audio controls>
  <source src="podcast.mp3" type="audio/mpeg" />
</audio>

<!-- ❌ 問題 - 音声ありで自動再生、制御なし -->
<video autoplay>
  <source src="intro.mp4" type="video/mp4" />
</video>

<!-- ❌ 問題 - controls属性なし -->
<audio autoplay>
  <source src="bgm.mp3" type="audio/mpeg" />
</audio>
```

📋 **ユーザー確認が必要:**

- [ ] 自動再生される音声/動画は3秒未満か
- [ ] 停止/一時停止/音量調整が可能か
- [ ] 背景音楽等がある場合、ユーザーが制御できるか

---

## 2. 操作可能（Operable）

### 2.1.1 キーボード操作

```html
<!-- ✅ 正しい - ネイティブ要素を使用 -->
<button type="button" onclick="openModal()">詳細を見る</button>
<a href="/contact">お問い合わせ</a>

<!-- ✅ 正しい - カスタム要素にキーボードサポート -->
<div role="button" tabindex="0" onclick="handleClick()" onkeydown="handleKeydown(event)">
  クリック
</div>
```

```typescript
// ✅ 正しい - Enterキーでも動作
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    handleClick()
  }
}

// ❌ 問題 - clickのみでキーボード不可
element.addEventListener("click", handler)
```

### 2.1.2 キーボードトラップなし

```typescript
// ✅ 正しい - モーダル内でフォーカストラップ（Escで解除可能）
function trapFocus(modal: HTMLElement) {
  const focusables = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal()
      return
    }
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  })
}
```

### 2.1.4 文字キーのショートカット

1文字のキーボードショートカットがある場合、無効化または再割り当て機能が必要。

```typescript
// ✅ 正しい - 修飾キー付きのショートカット
document.addEventListener("keydown", (e) => {
  // Ctrl+S で保存（修飾キー必須なのでOK）
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault()
    saveDocument()
  }
})

// ✅ 正しい - 1文字ショートカットを設定で無効化可能
const shortcuts = {
  enabled: true, // ユーザーが無効化可能
  keys: { n: "next", p: "prev" },
}

document.addEventListener("keydown", (e) => {
  if (!shortcuts.enabled) return
  if (document.activeElement?.tagName === "INPUT") return // 入力中は無効
  const action = shortcuts.keys[e.key]
  if (action) handleAction(action)
})

// ❌ 問題 - 1文字ショートカットを無効化できない
document.addEventListener("keydown", (e) => {
  if (e.key === "n") nextSlide() // 常に発火、無効化不可
})
```

📋 **チェックポイント:**

- 1文字ショートカットは修飾キー（Ctrl/Alt/Cmd）と組み合わせているか
- フォーム入力中はショートカットを無効化しているか
- ユーザーがショートカットを無効化/変更できるか

### 2.2.1 タイミング調整可能

時間制限のあるコンテンツには、延長・解除機能が必要。

```html
<!-- ✅ 正しい - セッションタイムアウト警告 -->
<dialog id="session-warning" role="alertdialog" aria-labelledby="warning-title">
  <h2 id="warning-title">セッションが間もなく切れます</h2>
  <p>残り <span id="countdown">60</span> 秒</p>
  <button onclick="extendSession()">セッションを延長する</button>
  <button onclick="logout()">ログアウト</button>
</dialog>
```

```typescript
// ✅ 正しい - 自動スライドショーを制御可能に
class Slideshow {
  private intervalId: number | null = null
  private isPaused = false

  start(interval = 5000) {
    this.intervalId = window.setInterval(() => {
      if (!this.isPaused) this.next()
    }, interval)
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  // ユーザーが時間間隔を調整可能
  setInterval(ms: number) {
    if (this.intervalId) clearInterval(this.intervalId)
    this.start(ms)
  }
}

// ❌ 問題 - 時間制限を延長できない
setTimeout(() => {
  window.location.href = "/logout" // 自動ログアウト、延長不可
}, 300000)
```

📋 **ユーザー確認が必要:**

- [ ] 時間制限の前に警告を表示しているか
- [ ] ユーザーが時間を延長できるか
- [ ] 本質的に時間制限が必要な場合（オークション等）は例外

### 2.2.2 一時停止、停止、非表示

自動的に動く・更新されるコンテンツは制御可能にする。

```html
<!-- ✅ 正しい - カルーセルに一時停止ボタン -->
<div class="carousel" role="region" aria-label="お知らせスライダー">
  <button class="carousel-control" aria-pressed="false" onclick="toggleCarousel(this)">
    <span class="visually-hidden">スライドを</span>
    一時停止
  </button>
  <div class="carousel-slides">...</div>
</div>
```

```typescript
// ✅ 正しい - 一時停止機能付きカルーセル
function toggleCarousel(button: HTMLButtonElement) {
  const isPaused = button.getAttribute("aria-pressed") === "true"
  button.setAttribute("aria-pressed", String(!isPaused))
  button.textContent = isPaused ? "一時停止" : "再生"

  if (isPaused) {
    carousel.resume()
  } else {
    carousel.pause()
  }
}

// ✅ 正しい - ホバー/フォーカスで自動停止
const carousel = document.querySelector(".carousel")
carousel?.addEventListener("mouseenter", () => pause())
carousel?.addEventListener("mouseleave", () => resume())
carousel?.addEventListener("focusin", () => pause())
carousel?.addEventListener("focusout", () => resume())
```

```css
/* ✅ 正しい - アニメーション軽減設定を尊重 */
@media (prefers-reduced-motion: reduce) {
  .carousel {
    animation: none;
  }
  .carousel-slides {
    transition: none;
  }
}
```

📋 **チェックポイント:**

- 5秒以上動くコンテンツに一時停止/停止機能があるか
- 自動更新コンテンツを一時停止/停止できるか
- prefers-reduced-motionを尊重しているか

### 2.3.1 3回の閃光、又は閾値以下

点滅・閃光コンテンツは1秒間に3回未満に制限。

```css
/* ✅ 正しい - 点滅は2回/秒以下 */
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.blink {
  animation: blink 1s infinite; /* 1秒に1回 = OK */
}

/* ✅ 正しい - アニメーション軽減設定で無効化 */
@media (prefers-reduced-motion: reduce) {
  .blink,
  .flash,
  .pulse {
    animation: none;
  }
}

/* ❌ 問題 - 高速点滅 */
.fast-blink {
  animation: blink 0.2s infinite; /* 1秒に5回 = 危険 */
}
```

```typescript
// ✅ 正しい - 動画の閃光チェック（コンテンツ制作時の考慮）
// 赤色の閃光は特に注意（光感受性発作のリスク）

// ✅ 正しい - ユーザー設定を確認
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

if (prefersReducedMotion) {
  disableAnimations()
}
```

📋 **チェックポイント:**

- 点滅/閃光は1秒間に3回未満か
- 閃光領域は画面の25%未満か
- prefers-reduced-motionで無効化されるか

### 2.4.1 ブロックスキップ

```html
<!-- ✅ 正しい - スキップリンク -->
<body>
  <a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>
  <header>...</header>
  <main id="main-content" tabindex="-1">...</main>
</body>
```

```css
/* スキップリンクのスタイル */
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 0;
  top: 0;
  z-index: 9999;
  background: #fff;
  padding: 8px 16px;
}
```

### 2.4.2 ページタイトル

```php
<!-- ✅ 正しい - 具体的なタイトル -->
<title>募集職種一覧 | 株式会社サンプル</title>

<!-- ❌ 問題 - 曖昧なタイトル -->
<title>ページ</title>
```

### 2.4.3 フォーカス順序

```html
<!-- ✅ 正しい - 論理的なフォーカス順序 -->
<form>
  <input type="text" name="name" />
  <input type="email" name="email" />
  <textarea name="message"></textarea>
  <button type="submit">送信</button>
</form>

<!-- ❌ 問題 - tabindexで順序を崩す -->
<input tabindex="3" />
<input tabindex="1" />
<input tabindex="2" />
```

### 2.4.4 リンクの目的

```html
<!-- ✅ 正しい - リンクの目的が明確 -->
<a href="/jobs/engineer">エンジニア職の詳細を見る</a>

<!-- ✅ 正しい - aria-labelで補足 -->
<a href="/jobs/engineer" aria-label="エンジニア職の詳細を見る"> 詳細を見る </a>

<!-- ❌ 問題 - 目的が不明 -->
<a href="/jobs/engineer">こちら</a>
<a href="/jobs/engineer">詳細</a>
```

### 2.5.1 ポインタのジェスチャ

マルチポイントジェスチャ（ピンチ、スワイプ等）には単純な代替手段を提供。

```html
<!-- ✅ 正しい - スワイプとボタン両方で操作可能 -->
<div class="carousel" role="region" aria-label="画像ギャラリー">
  <button class="prev" aria-label="前の画像">←</button>
  <div class="slides">...</div>
  <button class="next" aria-label="次の画像">→</button>
</div>

<!-- ✅ 正しい - ピンチズームの代替 -->
<div class="zoomable-image">
  <img src="map.jpg" alt="会社周辺地図" />
  <div class="zoom-controls">
    <button aria-label="拡大">+</button>
    <button aria-label="縮小">−</button>
  </div>
</div>
```

```typescript
// ✅ 正しい - スワイプとクリック両方に対応
class Carousel {
  constructor(element: HTMLElement) {
    // スワイプジェスチャ
    element.addEventListener("touchstart", (e) => this.handleTouchStart(e))
    element.addEventListener("touchend", (e) => this.handleTouchEnd(e))

    // ボタンによる代替操作
    element.querySelector(".prev")?.addEventListener("click", () => this.prev())
    element.querySelector(".next")?.addEventListener("click", () => this.next())

    // キーボード操作
    element.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.prev()
      if (e.key === "ArrowRight") this.next()
    })
  }
}

// ❌ 問題 - スワイプのみ、ボタン代替なし
element.addEventListener("touchmove", handleSwipe)
```

📋 **チェックポイント:**

- スワイプ操作にボタンの代替があるか
- ピンチズームに +/- ボタンがあるか
- ドラッグ&ドロップに代替手段があるか

### 2.5.2 ポインタのキャンセル

誤操作を防ぐため、アクションはポインタを離した時（mouseup/touchend）に発火。

```typescript
// ✅ 正しい - mouseupで発火（ドラッグで離脱するとキャンセル）
button.addEventListener("mouseup", (e) => {
  // ボタン上でマウスを離した場合のみ実行
  if (e.target === button) {
    submitForm()
  }
})

// ✅ 正しい - clickイベントはデフォルトでup時発火
button.addEventListener("click", () => {
  submitForm()
})

// ✅ 正しい - タッチでも同様
button.addEventListener("touchend", (e) => {
  e.preventDefault() // ダブルタップズーム防止
  submitForm()
})

// ❌ 問題 - mousedownで即座に発火（キャンセル不可）
button.addEventListener("mousedown", () => {
  submitForm() // 押した瞬間に実行、取り消せない
})

// ❌ 問題 - touchstartで即座に発火
button.addEventListener("touchstart", () => {
  deleteItem() // 誤タップでも即削除
})
```

```html
<!-- ✅ 正しい - ネイティブ要素は自動的に正しく動作 -->
<button type="submit">送信</button>
<a href="/next">次へ</a>

<!-- ⚠️ 注意 - カスタム要素はイベントハンドリングに注意 -->
<div role="button" tabindex="0">カスタムボタン</div>
```

📋 **チェックポイント:**

- mousedown/touchstartで破壊的アクションを実行していないか
- ドラッグで要素外に移動するとキャンセルできるか
- 重要な操作（削除等）は確認ダイアログがあるか

### 2.5.3 ラベルを含む名前

```html
<!-- ✅ 正しい - 表示テキストがアクセシブル名と一致 -->
<button>応募する</button>

<!-- ✅ 正しい - aria-labelが表示テキストを含む -->
<button aria-label="エンジニア職に応募する">応募する</button>

<!-- ❌ 問題 - 表示とaria-labelが不一致 -->
<button aria-label="submit application">応募する</button>
```

### 2.5.4 動きによる起動

デバイスの動き（シェイク、傾き等）による機能には代替手段を提供。

```html
<!-- ✅ 正しい - シェイクとボタン両方で操作可能 -->
<div class="undo-feature">
  <button onclick="undo()" aria-label="元に戻す">↩ 元に戻す</button>
  <p class="hint">または端末を振っても元に戻せます</p>
</div>
```

```typescript
// ✅ 正しい - 動き検出 + ボタンの代替手段
class UndoFeature {
  constructor() {
    // モーション検出（対応デバイスのみ）
    if ("DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", (e) => {
        if (this.isShakeDetected(e)) {
          this.undo()
        }
      })
    }
  }

  // ボタンからも呼び出し可能
  undo() {
    // 元に戻す処理
  }

  // 設定で無効化可能
  disableMotion() {
    this.motionEnabled = false
  }
}

// ✅ 正しい - 傾きによる操作の代替
// 傾けて移動するゲームにも方向キーを提供
const controls = {
  motion: true, // ユーザーが無効化可能
  keyboard: true,
}

// ❌ 問題 - 動き操作のみ、代替手段なし
window.addEventListener("devicemotion", handleShake)
// ボタン等の代替操作がない
```

📋 **チェックポイント:**

- 動き操作にボタン/キーボードの代替があるか
- ユーザーが動き操作を無効化できるか
- 意図しない動きで誤操作が起きないか

---

## 3. 理解可能（Understandable）

### 3.1.1 ページの言語

```html
<!-- ✅ 正しい -->
<html lang="ja">
  <!-- ✅ 正しい - 部分的に異なる言語 -->
  <p>お問い合わせは<span lang="en">contact@example.com</span>まで</p>
</html>
```

### 3.2.1 フォーカス時 / 3.2.2 入力時

```typescript
// ✅ 正しい - フォーカスで予期しない変化を起こさない
input.addEventListener("focus", () => {
  // ヒント表示などは可
  showHint()
})

// ❌ 問題 - フォーカスでページ遷移
input.addEventListener("focus", () => {
  window.location.href = "/other-page"
})

// ❌ 問題 - 選択時に自動送信（ユーザーに確認なし）
select.addEventListener("change", () => {
  form.submit()
})
```

### 3.2.6 一貫したヘルプ

ヘルプ機能（FAQ、お問い合わせ、チャット等）は全ページで同じ相対位置に配置する。

```html
<!-- ✅ 正しい - ヘルプ機能が全ページで同じ位置 -->
<footer>
  <a href="/faq">よくある質問</a>
  <a href="/contact">お問い合わせ</a>
</footer>

<!-- ✅ 正しい - ヘルプチャットが全ページで同じ位置 -->
<div class="help-chat" style="position: fixed; bottom: 20px; right: 20px;">
  <button aria-label="ヘルプチャットを開く">
    <svg aria-hidden="true"><!-- チャットアイコン --></svg>
  </button>
</div>

<!-- ❌ 問題 - ページによってヘルプの位置が異なる -->
<!-- トップページ: ヘッダーにヘルプリンク -->
<!-- 問い合わせページ: フッターにヘルプリンク -->
<!-- 採用ページ: サイドバーにヘルプリンク -->
```

📋 **チェックポイント:**

- ヘルプ機能（FAQ、お問い合わせ、チャット等）が全ページで同じ相対位置にあるか
- 複数のヘルプ手段がある場合、表示順序が一貫しているか

### 3.3.1 エラーの特定

```html
<!-- ✅ 正しい - エラー箇所と内容を明示 -->
<label for="email">メールアドレス</label>
<input type="email" id="email" aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" class="error" role="alert"> メールアドレスの形式が正しくありません </span>

<!-- ❌ 問題 - どこがエラーかわからない -->
<div class="error">入力内容に誤りがあります</div>
```

### 3.3.2 ラベル又は説明

```html
<!-- ✅ 正しい - ラベル＋説明文 -->
<label for="password">パスワード</label>
<input type="password" id="password" aria-describedby="password-hint" />
<span id="password-hint">8文字以上、英数字を含む</span>

<!-- ✅ 正しい - 必須項目の明示 -->
<label for="name">
  お名前
  <span aria-hidden="true">*</span>
  <span class="visually-hidden">（必須）</span>
</label>
<input type="text" id="name" required aria-required="true" />
```

### 3.3.7 冗長な入力項目

同じプロセス内で以前入力した情報を再度入力させない。

```html
<!-- ✅ 正しい - 以前入力した情報を自動入力 -->
<label for="shipping-address">配送先住所</label>
<input type="text" id="shipping-address" autocomplete="shipping street-address" />

<label>
  <input type="checkbox" id="same-address" />
  請求先住所と同じ
</label>

<!-- ✅ 正しい - セッション内で入力済みの情報を保持 -->
<input type="email" id="email" value="user@example.com" readonly />
<button type="button">変更する</button>

<!-- ❌ 問題 - 確認のため同じ情報を再入力させる -->
<label for="email">メールアドレス</label>
<input type="email" id="email" />
<label for="email-confirm">メールアドレス（確認）</label>
<input type="email" id="email-confirm" />
```

```typescript
// ✅ 正しい - フォーム間で入力データを共有
const userData = sessionStorage.getItem("userData")
if (userData) {
  const data = JSON.parse(userData)
  const nameInput = document.querySelector<HTMLInputElement>("#name")
  const emailInput = document.querySelector<HTMLInputElement>("#email")
  if (nameInput) nameInput.value = data.name
  if (emailInput) emailInput.value = data.email
}

// ✅ 正しい - ステップ間でデータを保持
function saveStepData(step: number, data: Record<string, string>) {
  sessionStorage.setItem(`form-step-${step}`, JSON.stringify(data))
}

function loadStepData(step: number) {
  const saved = sessionStorage.getItem(`form-step-${step}`)
  return saved ? JSON.parse(saved) : null
}
```

📋 **チェックポイント:**

- 同じセッション内で同じ情報を再入力させていないか
- autocomplete属性を適切に使用しているか
- 「同じ住所を使用」等のオプションがあるか
- 確認のための再入力（メール確認等）が本当に必要か

---

## 4. 堅牢（Robust）

### 4.1.2 名前・役割・値

すべてのUIコンポーネントは、支援技術が以下を取得できる必要がある：

- **名前（name）**: コンポーネントのアクセシブルな名前
- **役割（role）**: コンポーネントの種類・機能
- **値（value）**: 現在の状態や値

#### フォーム要素の基本

```html
<!-- ✅ 正しい - ラベルによる名前付け -->
<label for="username">ユーザー名</label>
<input type="text" id="username" name="username" />

<!-- ✅ 正しい - aria-labelによる名前付け -->
<input type="search" aria-label="サイト内検索" />

<!-- ✅ 正しい - aria-labelledbyで既存要素を参照 -->
<span id="phone-label">電話番号</span>
<span id="phone-hint">（ハイフンなし）</span>
<input type="tel" aria-labelledby="phone-label" aria-describedby="phone-hint" />

<!-- ✅ 正しい - チェックボックスの値 -->
<label>
  <input type="checkbox" name="agree" value="yes" />
  利用規約に同意する
</label>

<!-- ✅ 正しい - ラジオボタングループ -->
<fieldset>
  <legend>希望職種</legend>
  <label><input type="radio" name="job" value="engineer" /> エンジニア</label>
  <label><input type="radio" name="job" value="sales" /> 営業</label>
</fieldset>

<!-- ✅ 正しい - セレクトボックス -->
<label for="prefecture">都道府県</label>
<select id="prefecture" name="prefecture">
  <option value="">選択してください</option>
  <option value="okinawa">沖縄県</option>
</select>

<!-- ❌ 問題 - ラベルなし（名前がない） -->
<input type="text" placeholder="お名前" />

<!-- ❌ 問題 - for属性とidが不一致 -->
<label for="name">お名前</label>
<input type="text" id="fullname" />

<!-- ❌ 問題 - placeholderのみでラベルなし -->
<input type="email" placeholder="メールアドレス" />
```

#### カスタムウィジェット - タブ

```html
<!-- ✅ 正しい - カスタムコンポーネントにWAI-ARIA -->
<div role="tablist" aria-label="職種カテゴリ">
  <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">エンジニア</button>
  <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2">営業</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">エンジニアの募集内容...</div>
```

#### カスタムウィジェット - アコーディオン

```html
<!-- ✅ 正しい - アコーディオン -->
<button aria-expanded="false" aria-controls="accordion-content">よくある質問</button>
<div id="accordion-content" hidden>回答内容...</div>
```

```typescript
// ✅ 正しい - 状態変更時にaria属性を更新
function toggleAccordion(button: HTMLButtonElement) {
  const expanded = button.getAttribute("aria-expanded") === "true"
  const content = document.getElementById(button.getAttribute("aria-controls") || "")

  button.setAttribute("aria-expanded", String(!expanded))
  if (content) {
    content.hidden = expanded
  }
}
```

#### カスタムウィジェット - トグルスイッチ

```html
<!-- ✅ 正しい - トグルスイッチ -->
<button role="switch" aria-checked="false" aria-label="通知を受け取る" onclick="toggleSwitch(this)">
  <span class="switch-thumb"></span>
</button>

<!-- ✅ 正しい - チェックボックスベースのトグル -->
<label class="toggle">
  <input type="checkbox" role="switch" />
  <span class="toggle-slider"></span>
  ダークモード
</label>
```

```typescript
// ✅ 正しい - トグルスイッチの状態更新
function toggleSwitch(button: HTMLButtonElement) {
  const checked = button.getAttribute("aria-checked") === "true"
  button.setAttribute("aria-checked", String(!checked))
}
```

#### カスタムウィジェット - スライダー

```html
<!-- ✅ 正しい - ネイティブスライダーを優先 -->
<label for="salary">希望年収</label>
<input
  type="range"
  id="salary"
  min="300"
  max="1000"
  step="50"
  value="500"
  aria-valuetext="500万円"
/>
<output for="salary">500万円</output>

<!-- ✅ 正しい - カスタムスライダー -->
<div
  role="slider"
  tabindex="0"
  aria-label="音量"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="50"
  aria-valuetext="50%"
>
  <div class="slider-thumb" style="left: 50%"></div>
</div>
```

```typescript
// ✅ 正しい - スライダーの値更新
function updateSlider(slider: HTMLElement, value: number) {
  slider.setAttribute("aria-valuenow", String(value))
  slider.setAttribute("aria-valuetext", `${value}%`)
}
```

#### カスタムウィジェット - プログレスバー

```html
<!-- ✅ 正しい - ネイティブプログレス -->
<label for="upload">アップロード進捗</label>
<progress id="upload" value="70" max="100">70%</progress>

<!-- ✅ 正しい - カスタムプログレスバー -->
<div
  role="progressbar"
  aria-label="応募フォーム入力進捗"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="60"
>
  <div class="progress-fill" style="width: 60%"></div>
</div>

<!-- ✅ 正しい - 不確定なプログレス（ローディング） -->
<div role="progressbar" aria-label="読み込み中" aria-busy="true">
  <span class="spinner"></span>
</div>
```

#### 状態属性の一覧

```html
<!-- 展開/折りたたみ -->
<button aria-expanded="true">メニュー</button>

<!-- 選択状態 -->
<div role="tab" aria-selected="true">タブ1</div>
<div role="option" aria-selected="false">選択肢</div>

<!-- チェック状態 -->
<div role="checkbox" aria-checked="true">チェック済み</div>
<div role="checkbox" aria-checked="mixed">一部チェック</div>
<div role="switch" aria-checked="false">オフ</div>

<!-- 押下状態（トグルボタン） -->
<button aria-pressed="true">太字</button>

<!-- 無効状態 -->
<button aria-disabled="true">送信</button>
<input type="text" disabled aria-disabled="true" />

<!-- 必須状態 -->
<input type="text" aria-required="true" required />

<!-- エラー状態 -->
<input type="email" aria-invalid="true" aria-describedby="error" />
<span id="error">メールアドレスが正しくありません</span>

<!-- 読み取り専用 -->
<input type="text" aria-readonly="true" readonly value="変更不可" />

<!-- ビジー状態（処理中） -->
<div aria-busy="true">読み込み中...</div>
<div aria-live="polite" aria-busy="false">更新完了</div>
```

#### aria-label vs aria-labelledby

```html
<!-- aria-label: ラベルテキストを直接指定 -->
<!-- 使用場面: 可視ラベルがない場合 -->
<button aria-label="閉じる">×</button>
<nav aria-label="パンくずリスト">...</nav>

<!-- aria-labelledby: 既存要素のIDを参照 -->
<!-- 使用場面: 可視ラベルがある場合 -->
<h2 id="section-title">募集要項</h2>
<section aria-labelledby="section-title">...</section>

<!-- 複数要素を参照可能 -->
<span id="label">給与</span>
<span id="range">300万〜500万円</span>
<div aria-labelledby="label range">...</div>

<!-- ❌ 問題 - 両方指定すると aria-labelledby が優先される -->
<button aria-label="削除" aria-labelledby="btn-text">
  <span id="btn-text">Delete</span>
</button>
<!-- 読み上げ: "Delete" (aria-labelの"削除"は無視される) -->
```

#### よくある問題パターン

```html
<!-- ❌ 問題 - divでボタンを作るがroleなし -->
<div onclick="submit()">送信</div>

<!-- ✅ 修正 -->
<div role="button" tabindex="0" onclick="submit()" onkeydown="handleKey(event)">送信</div>
<!-- ベスト: ネイティブ要素を使用 -->
<button type="button" onclick="submit()">送信</button>

<!-- ❌ 問題 - roleはあるが状態属性なし -->
<div role="checkbox" onclick="toggle()">同意する</div>

<!-- ✅ 修正 -->
<div
  role="checkbox"
  tabindex="0"
  aria-checked="false"
  onclick="toggle(this)"
  onkeydown="handleKey(event)"
>
  同意する
</div>

<!-- ❌ 問題 - 状態変更時にaria属性を更新していない -->
<button aria-expanded="false" onclick="openMenu()">メニュー</button>
<!-- メニューが開いてもaria-expanded="false"のまま -->

<!-- ❌ 問題 - 不適切なrole -->
<a href="/contact" role="button">お問い合わせ</a>
<!-- リンクはリンクのまま使用すべき -->

<!-- ❌ 問題 - aria-label が表示テキストと矛盾 -->
<button aria-label="Search">検索</button>
<!-- 2.5.3違反: 表示は「検索」だがaria-labelは「Search」 -->
```

```typescript
// ❌ 問題 - 状態更新を忘れる
function toggleMenu(button: HTMLButtonElement) {
  const menu = document.querySelector(".menu")
  menu?.classList.toggle("open")
  // aria-expanded の更新を忘れている！
}

// ✅ 修正 - 状態を必ず更新
function toggleMenu(button: HTMLButtonElement) {
  const menu = document.querySelector(".menu")
  const isOpen = menu?.classList.toggle("open")
  button.setAttribute("aria-expanded", String(isOpen))
}
```

📋 **4.1.2 チェックポイント:**

- フォーム要素にはラベル（label, aria-label, aria-labelledby）があるか
- カスタムウィジェットに適切なroleがあるか
- 状態を持つ要素にaria属性（aria-expanded, aria-checked等）があるか
- 状態変化時にaria属性がプログラムで更新されるか
- 値を持つ要素（スライダー等）にaria-valuenow等があるか
- roleとネイティブHTML要素の機能が矛盾していないか

---

## チェックリスト

レビュー時に確認：

### 画像・メディア（1.1.1, 1.2.x）

- [ ] すべての画像にalt属性があるか
- [ ] 装飾画像はalt=""か
- [ ] アイコンボタンにaria-labelがあるか
- [ ] 動画にキャプション（track要素）があるか
- [ ] 音声/映像コンテンツにテキスト代替があるか
- [ ] 📋 キャプション/書き起こしの内容は正確か（要確認）

### 構造・セマンティクス

- [ ] 見出し階層が正しいか（h1→h2→h3）
- [ ] ランドマーク要素を使用しているか
- [ ] フォーム要素にlabelが関連付けられているか

### キーボード操作（2.1.x）

- [ ] すべての機能がキーボードで操作可能か
- [ ] フォーカス可視状態は明確か
- [ ] モーダルのフォーカストラップとEsc閉じは実装されているか
- [ ] 1文字ショートカットは無効化/変更可能か（2.1.4）

### タイミング・動き（2.2.x, 2.3.x）

- [ ] 時間制限コンテンツは延長可能か（2.2.1）
- [ ] 動くコンテンツは一時停止可能か（2.2.2）
- [ ] 点滅/閃光は1秒に3回未満か（2.3.1）
- [ ] prefers-reduced-motionを尊重しているか

### ポインタ操作（2.5.x）

- [ ] スワイプ等のジェスチャにボタンの代替があるか（2.5.1）
- [ ] クリックはmouseup/touchendで発火しているか（2.5.2）
- [ ] 表示テキストとアクセシブル名が一致しているか（2.5.3）
- [ ] 動き操作（シェイク等）に代替手段があるか（2.5.4）

### フォーム

- [ ] エラーメッセージは具体的か
- [ ] 必須項目は視覚とaria両方で示されているか
- [ ] aria-invalidとaria-describedbyを使用しているか
- [ ] 同じ情報を再入力させていないか（3.3.7）
- [ ] autocomplete属性を適切に使用しているか（3.3.7）

### ヘルプ機能（3.2.6）

- [ ] ヘルプ機能が全ページで同じ相対位置にあるか
- [ ] 複数のヘルプ手段の表示順序が一貫しているか

### 名前・役割・値（4.1.2）

- [ ] すべてのフォーム要素にアクセシブルな名前があるか（label, aria-label, aria-labelledby）
- [ ] カスタムウィジェットに適切なroleがあるか
- [ ] 状態を持つ要素にaria属性があるか（aria-expanded, aria-checked, aria-selected等）
- [ ] 状態変化時にaria属性をプログラムで更新しているか
- [ ] 値を持つ要素にaria-valuenow等があるか（スライダー、プログレスバー）
- [ ] roleとネイティブHTML要素の機能が矛盾していないか
- [ ] aria-labelと表示テキストが一致しているか（2.5.3との関連）

### 感覚的な特徴（1.3.3）

- [ ] 位置（左右上下）のみで要素を説明していないか
- [ ] 色のみで要素を特定していないか
- [ ] 形状のみで要素を特定していないか

### 音声の制御（1.4.2）

- [ ] autoplay音声/動画にcontrols属性があるか
- [ ] 自動再生の場合、muted属性があるか
- [ ] 📋 自動再生は3秒未満か（要確認）

### その他

- [ ] html要素にlang属性があるか
- [ ] ページタイトルは具体的か
- [ ] 色だけに依存していないか（1.4.1）

---

## Output Format

```markdown
## アクセシビリティレビュー結果

### ⏭️ 除外項目

依頼時に指定された除外項目、および該当コンテンツがないため対象外とした項目：

- 【基準番号】項目名 - 除外理由

> ⚠️ 機能追加時（動画、フォームフロー等）は、該当項目を再チェックしてください。

### ✅ 良い点

-

### ⚠️ 問題点

- 【基準番号】問題の説明
  - 該当箇所: `ファイル:行番号`
  - 修正案:

### 📝 改善提案

-
```
