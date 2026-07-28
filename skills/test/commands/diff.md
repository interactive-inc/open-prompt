# diff — 2ソースを重ねた UI 差分レビュー

`/product:test diff` は、2つの画像ソース（A / B）を重ねた3枚の比較画像を生成し、そこから目視できる差分を「色」「タイポ」「余白」「配置」などのカテゴリに整理してテキストで報告する。

ピクセル一致率の数値ではなく、設計者・実装者が次のアクションを決められる「言葉で読める差分レポート」を作ることが目的。

## 対応する比較パターン

A（reference、よく変えたくない側）と B（target、確認したい側）の組み合わせは自由。

- Figmaデザイン vs 実装ページ
- 本番/リリース済みページ vs ローカル環境
- 本番 vs ステージング / 開発環境
- リファクタ前 vs リファクタ後（片方をコミット前にスクショしておく）
- ブランチX vs ブランチY
- 既存ベースラインPNG vs 今のページ

A/B どちら側も、以下の入力から選べる:

- Figma URL（node-id 必須）
- 任意のページURL（playwright-cli でスクショ）
- 既に手元にあるPNGファイルパス

## 前提条件

Figmaノードを入力に使う場合のみ、環境変数 `FIGMA_TOKEN`（または `FIGMA_ACCESS_TOKEN`）を設定する。

```
FIGMA_TOKEN=figd_xxxxxxxxxxxx
```

取得先: https://www.figma.com/developers/api#access-tokens

URL同士 / PNG同士の比較では Figma トークンは不要。

## 出力先

生成物は `/tmp/product-test/ui-diff/<RUN>/` の下に保存する。`<RUN>` は `YYYY-MM-DD_HHMMSS` 形式のタイムスタンプディレクトリで、実行ごとに新規作成し過去ランは削除しない。`/tmp` 配下なので OS が自動で掃除する。

各実行の最初で新しい run dir を作る（過去ランは温存）:

```bash
RUN=$(date +%Y-%m-%d_%H%M%S)
mkdir -p /tmp/product-test/ui-diff/$RUN
# 以降、Step 1〜2 の出力先は /tmp/product-test/ui-diff/$RUN/
```

下流スクリプト（overlay-compose.ts / batch-overlay.ts / generate-report.ts）は引数として run dir を受け取る。

generate-report.ts は呼び出し時に2つの index.html を生成する:

- `<run dir>/index.html` ... そのランの詳細ビューア（従来どおり）
- `/tmp/product-test/ui-diff/index.html` ... ラン一覧ページ（新しいランほど上に並ぶ）

run dir 名がタイムスタンプ命名 (`YYYY-MM-DD_HHMMSS`) のときだけラン一覧を更新する。タイムスタンプ命名でない場合は警告して詳細ビューアのみ生成する。

ラン一覧だけ作り直したいときは `bun <skill_dir>/scripts/diff/generate-report.ts /tmp/product-test/ui-diff` のように ui-diff ルートを引数にすると、子ディレクトリを走査して一覧だけ再生成する。

## ワークフロー

ワークフロー開始時は AskUserQuestion で以下の決定木をたどる。ユーザー入力で明確に分岐先が決まっている場合は質問を省略してよい。

```
Q1. 比較タイプ
├─ A. デザイン vs ページ          → 単一ページ比較に固定（複数ページ不可）
└─ B. ページ vs ページ            → Q2 へ
                                   ├─ B1. 全ページ比較   → ベースURL × 2 + サイトマップ有無
                                   │                     （無ければ Claude が探索する）
                                   └─ B2. 指定ページ比較 → ベースURL × 2 + ページパス一覧
                                                          （主要ページはチェックボックスで提案）
```

### Q1: 何と何を比べたいか

質問文（推奨）: 「今回はどれを比較しますか？」

```
header: 比較対象
options:
  - label: デザイン と 実装ページ
    description: Figmaなどのデザインカンプと、ブラウザで描画されたページを重ねてズレを確認する
  - label: ページ同士
    description: 実装ページ同士を重ねる。本番 vs ローカル、リファクタ前後、ブランチ比較など
```

#### A. 「デザイン と 実装ページ」を選んだ場合（単一ページ固定）

複数ページ一括は受けない。Figma 側は1ノード（PC/SP 両方ならそれぞれ1ノード）、実装側は1URL固定。デザインカンプは画面単位で管理されているのが一般的で、複数画面をまとめて重ねても意味のある言語化にならないため。

質問文（推奨）:

```
header: デザインソース
question: 比較したいデザインを教えてください。Figma の URL（node-id 必須）か、手元のPNGファイルパスを使えます。
options:
  - label: Figma URL を入力する
    description: Figma の node-id 付き URL。FIGMA_TOKEN が設定済みなら自動で PNG 出力します
  - label: 手元の PNG を使う
    description: 既に書き出してある PNG ファイルのパスを渡す
```

```
header: 実装ページ
question: 比較したい実装ページの URL を教えてください。
（例: ローカルなら http://example.localhost/about/ など）
```

```
header: ビューポート
question: どのビューポートで比較しますか？
options:
  - label: PC と SP の両方 (Recommended)
  - label: PC のみ (1920幅)
  - label: SP のみ (375幅)
```

```
header: 除外項目
question: 差分として無視したい動的コンテンツはありますか？（複数選択可）
multiSelect: true
options:
  - label: 新着 / お知らせ一覧
  - label: 日付・タイムスタンプ
  - label: 画像スライダー / カルーセル
  - label: 特になし
```

ファイル命名: `a-pc.png` / `a-sp.png` / `b-pc.png` / `b-sp.png`（page 名なし）。generate-report.ts は1軸UI（上部タブのみ）でビューアを生成する。

#### B. 「ページ同士」を選んだ場合

続いて Q2 を聞く。

質問文（推奨）:

```
header: 比較範囲
question: ページ同士の比較は、サイト全体ですか？それとも特定のページだけですか？
options:
  - label: サイト全体（全ページを一括）
    description: ベースURLを2つもらって、サイトマップから全ページを撮って比較します
  - label: 特定のページだけ
    description: 主要ページ候補からチェックして選ぶ。任意のパスも追加できます
```

##### B1. サイト全体（全ページ）を選んだ場合

質問文（推奨）:

```
header: ソース A
question: 基準にしたい側（reference）のベースURLを教えてください。
（例: 本番環境 https://www.example.co.jp）
```

```
header: ソース B
question: 確認したい側（target）のベースURLを教えてください。
（例: ローカル http://example.localhost）
```

```
header: サイトマップ
question: サイトマップの URL は分かりますか？
options:
  - label: ある（URLを伝える）
    description: 例: https://www.example.co.jp/sitemap.xml
  - label: わからない / 用意がない
    description: Claude が sitemap.xml / robots.txt / トップページのリンクから自動で探索します
```

サイトマップが指定された場合は次のコマンドで URL 一覧を抽出する:

```bash
curl -sL "<sitemap-url>" | grep -oE '<loc>[^<]+</loc>' | sed -E 's#</?loc>##g' | sort -u
```

サイトマップが用意されていない場合は Claude が以下の順で探索する:

1. `https://<base>/sitemap.xml`
2. `https://<base>/sitemap_index.xml`（sitemap index 形式）
3. `https://<base>/wp-sitemap.xml`（WordPress 標準）
4. `https://<base>/robots.txt` を読み、`Sitemap:` 行を辿る
5. ホームページの内部リンクを再帰的に辿る（深さ1〜2、同一ホスト内のみ、`/wp-json/` `/feed/` 等は除外）

検出したパス一覧はチャットに提示して「この一覧で進めてよいか」を確認する。件数が多すぎる場合（30件以上）は AskUserQuestion で「主要ページのみに絞るか、全件で進めるか」を聞く。

その後、ビューポート・除外項目を上記 A と同じ形式で聞く。

##### B2. 特定のページだけを選んだ場合

質問文（推奨）:

```
header: ソース A
question: 基準にしたい側（reference）のベースURLを教えてください。
```

```
header: ソース B
question: 確認したい側（target）のベースURLを教えてください。
```

ベースURLが手に入ったら、対象ページパスのチェックリストを提示する。事前に下記でナビを覗いてプロジェクト実在のパスに絞っておくと親切:

```bash
curl -sL "<base>/" | grep -oE 'href="[^"#]+"' | sed -E 's/^href="//; s/"$//' | sort -u
```

質問文（推奨）:

```
header: 対象ページ
question: どのページを比較しますか？（複数選択可。「その他」でカンマ区切りのパスを追加できます）
multiSelect: true
options:
  - label: / （トップ）
  - label: /about/ （会社概要・私たちについて）
  - label: /service/ （サービス）
  - label: /product/ （製品）
  - label: /news/ （お知らせ・ニュース一覧）
  - label: /contact/ （お問い合わせ）
  - label: /faq/ （よくある質問）
  - label: /recruit/ （採用情報）
```

候補例（プロジェクト種別ごとの初期セット）:

- WordPress 系: `/`, `/about/`, `/company/`, `/news/`, `/contact/`, `/recruit/`, `/policy/`, `/product/`
- EC 系: `/`, `/category/`, `/product/<sample>/`, `/cart/`, `/login/`, `/register/`, `/mypage/`, `/contact/`
- 一般 LP・コーポレート: `/`, `/about/`, `/service/`, `/case/`, `/faq/`, `/contact/`

「その他」でカンマ区切りパス（`/blog/, /pricing/`）が指定された場合はそちらを優先採用する。最後に、A と同じ形式でビューポート・除外項目を聞く。

### ファイル命名規則

- 単一ページ比較（A: デザイン vs ページ、B2 で1ページのみ）: `a-pc.png` / `a-sp.png` / `b-pc.png` / `b-sp.png`
- 複数ページ比較（B1 / B2 で2ページ以上）: `a-<page>-<viewport>.png` / `b-<page>-<viewport>.png`（例: `a-top-pc.png`, `b-news-list-sp.png`）

どちらの命名でも下流スクリプトが対応する。複数ページのときは `<page>-<viewport>` を prefix として扱い、generate-report.ts がハイフンを解析してサイドバー＋タブの2軸UIを作る。page 名にもハイフンを含めて良い（最後のハイフン以降がビューポート扱い）。

### Step 1: ソース A と B のスクショを取得

A と B の取得は互いに独立なので、同じターンで並列に走らせる。Figma は `run_in_background`、playwright-cli は順序実行。

Figmaソースの場合:

```bash
bun <skill_dir>/scripts/diff/figma-export.ts "<figma-url-pc>" /tmp/product-test/ui-diff/$RUN/a-pc.png 1
bun <skill_dir>/scripts/diff/figma-export.ts "<figma-url-sp>" /tmp/product-test/ui-diff/$RUN/a-sp.png 1
```

スケールはページスクショと合わせるため原則 `1`。

ページURLソースの場合（playwright-cli）:

```bash
playwright-cli open <source-url>

# PC
playwright-cli resize 1920 1080
# 出現アニメーションを発火させるため末尾までスクロールしてから先頭へ戻す
playwright-cli eval "() => document.body.scrollHeight"
# 得られた scrollHeight を 800 刻み程度でスクロール
for y in 800 1600 2400 <scrollHeight>; do
  playwright-cli eval "() => { window.scrollTo(0, $y); }"
  sleep 0.3
done
playwright-cli eval "() => { window.scrollTo(0, 0); }"
sleep 0.3
playwright-cli screenshot --filename=/tmp/product-test/ui-diff/$RUN/a-pc.png --full-page

# SP
playwright-cli resize 375 812
playwright-cli reload
# 同様にスクロール後、先頭へ戻してから撮影
...
playwright-cli screenshot --filename=/tmp/product-test/ui-diff/$RUN/a-sp.png --full-page
```

URL同士の比較（A も B もページURL）の場合、A/B を別セッションで開くと並行して撮影できる:

```bash
# A セッション
playwright-cli -s=a open <url-a>
playwright-cli -s=a resize 1920 1080
... スクロール ...
playwright-cli -s=a screenshot --filename=/tmp/product-test/ui-diff/$RUN/a-pc.png --full-page
playwright-cli -s=a close

# B セッション
playwright-cli -s=b open <url-b>
playwright-cli -s=b resize 1920 1080
... スクロール ...
playwright-cli -s=b screenshot --filename=/tmp/product-test/ui-diff/$RUN/b-pc.png --full-page
playwright-cli -s=b close
```

重要: A/B は必ず同じビューポート幅・同じスクロール手順で撮る。幅や撮影条件が違うと以降の比較が無意味になる。

既存PNGを使う場合はコピーするだけ:

```bash
cp <既存パス> /tmp/product-test/ui-diff/$RUN/a-pc.png
```

どちらが SP/PC か迷ったときは `sips -g pixelWidth <path>` で幅を確認する。375前後ならSP、1920前後ならPC。

### Step 2: オーバーレイ画像の生成（1回目）

`scripts/diff/overlay-compose.ts` で3種類の画像を作る。引数は `<A-png> <B-png> <output-prefix>` の順で、フラグは任意。

```bash
bun <skill_dir>/scripts/diff/overlay-compose.ts \
  /tmp/product-test/ui-diff/$RUN/a-pc.png \
  /tmp/product-test/ui-diff/$RUN/b-pc.png \
  /tmp/product-test/ui-diff/$RUN/pc
```

prefix に `pc` を渡すと以下3ファイルが出力される（`/tmp/product-test/ui-diff/$RUN/` 直下）:

- `pc-overlay.png` — B の上に A を 50% 透明度で重ねた画像。位置ズレを探すための主画像
- `pc-difference.png` — 各ピクセルの RGB 差を白ほど強く描画した画像。差がある箇所を光らせて見つけやすくする
- `pc-side-by-side.png` — 左=A / 右=B で横並びにしたラベル付き画像。要素の有無・順序・トリミング把握用

利用できるフラグ:

- `--opacity=0.5` A を何%透過で重ねるか（0.0〜1.0、既定 0.5）
- `--offset-y=N` B が A より Npx 下にコンテンツがあるとき、B の上 Npx を飛ばして整列する（負値で逆方向）
- `--crop-top=N` 両方の画像の上から Npx を削ってから比較する（ヒーロー部除外用途）

SP も同様に実行する。幅が大きく違うと警告が出るので、スクショ側のビューポート幅を揃えること。

### Step 2-batch: 複数ページを一気に比較する場合

1〜数十ページを同じ A/B 比較で回したい場合（例: 本番 vs ローカル で主要ページを全部チェック、リファクタ影響を全ページ確認）は `batch-overlay.ts` を使う。

前提: `<page>-<viewport>` の命名で A/B 画像が揃っていること（playwright-cli で先にループ撮影する。Step 1 の playwright-cli 手順をページ分繰り返す）。

```bash
bun <skill_dir>/scripts/diff/batch-overlay.ts /tmp/product-test/ui-diff/$RUN \
  --pages=top,about,news,product,contact \
  --viewports=pc,sp
```

全 page × viewport の組み合わせで overlay-compose を順に実行し、最後に合否サマリを表示する。A/B 画像が片方でも欠けている組み合わせは `skip` として飛ばされる（停止はしない）。

ページごとに前処理を変えたい場合:

```bash
bun <skill_dir>/scripts/diff/batch-overlay.ts /tmp/product-test/ui-diff/$RUN \
  --pages=top,about,news \
  --viewports=pc,sp \
  --offset-map=top:60,news:30 \
  --crop-map=top:0
```

`--offset-map` / `--crop-map` は `page:value` 形式のカンマ区切り。指定のないページには `--offset-y` / `--crop-top`（全ページ共通）が適用される。両方指定がなければ 0。

ページ別の詳細な判断（上部ズレがあるか等）は Step 2.5 を各ページごとに回すのが正攻法だが、ページ数が多い場合は:

1. 一度 `batch-overlay.ts` を回してから HTML ビューア（Step 6）を開き、各ページの overlay を目視
2. 上部ズレが共通していれば `--offset-y=N` を全ページ適用して再実行
3. ページ特有のズレだけ `--offset-map=...` で個別指定

でまとめて処理できる。

Step 3（言語化）は、差分が大きい順または重要度が高い順に数ページを重点的に記述し、それ以外は「差分なし/軽微」と要約する。全ページについて9カテゴリ全部書こうとすると膨大になるため、レポートは「ページ別サマリ表 + 要注意ページだけ詳細」の形にまとめる（[../references/diff-report-template.md](../references/diff-report-template.md) の複数ページ版を参照）。

### Step 2.5: 上部ズレを検出してオフセット再実行（必要なら）

**重要**: スクリプトは左上原点で重ねているだけなので、ページ上部に数十px のズレがあると以降すべてが同じだけズレて見え、差分が埋もれる。1回目の `overlay` / `difference` 画像を Read して以下を判定する:

1. 上部数十〜数百px に A/B で高さの違う要素（ヘッダー、クッキーバー、通知バナー、サイト告知）があるか
2. ヒーロー画像やキービジュアルが A/B でまったく別物になっていて、そこだけで difference 画像が真っ白になっていないか

どちらも該当しなければそのまま Step 3 へ。該当するならフラグ付きで再実行する。

**パターン A: B だけ上部に余計な要素がある（例: B のみクッキーバー 60px）**

overlay 画像を Read して「B のコンテンツは A より約 60px 下にある」と読み取ったら:

```bash
bun <skill_dir>/scripts/diff/overlay-compose.ts \
  /tmp/product-test/ui-diff/$RUN/a-pc.png \
  /tmp/product-test/ui-diff/$RUN/b-pc.png \
  /tmp/product-test/ui-diff/$RUN/pc \
  --offset-y=60
```

B 全体を 60px 上寄せして整列するので、本文以降の真の差分だけが残る。

**パターン B: A だけ上部に余計な要素がある**

`--offset-y=-60` のように負値を指定すると、A を |60|px 上寄せする。

**パターン C: 上部そのものを比較対象外にしたい（ヒーローが全く別物）**

```bash
bun <skill_dir>/scripts/diff/overlay-compose.ts \
  /tmp/product-test/ui-diff/$RUN/a-pc.png \
  /tmp/product-test/ui-diff/$RUN/b-pc.png \
  /tmp/product-test/ui-diff/$RUN/pc \
  --crop-top=800
```

両方の上から 800px を削ったうえで比較する。difference 画像から騒音が消える。

**パターン D: どちらでもない強いズレ**

どちらのパターンにも当てはまらない、または overlay だけでは原因が掴めない場合は、playwright-cli の要素スクショ（`screenshot e<ref>`）でセクション単位に切って再取得するほうが早い。その場合は Step 1 に戻ってセクション画像を取り直し、prefix を変えて同じ流れを再実行する（例: `--filename=a-footer.png` / `b-footer.png` と prefix=`footer`）。

オフセット / クロップを使った場合、使った値は必ずレポートの「前処理」欄に記録する（Step 4）。

### Step 3: オーバーレイ画像を読み込んで差分を言語化する

ここが本スキルの核心。生成した3画像を Read で開き、目視できる差分を構造化して記述する。

画像を読む順番:

1. `*-side-by-side.png` で全体像を把握（何が足りない/多い/順序違い）
2. `*-overlay.png` で位置ズレ・サイズ違いを特定（A層と B層のズレを探す）
3. `*-difference.png` で光って見える領域＝色/タイポ/装飾の差

観点ごとに [../references/diff-categories.md](../references/diff-categories.md) のカテゴリに沿って記述する。カテゴリは次のとおり:

- 色（背景色・文字色・ボーダー色・アクセント色）
- タイポグラフィ（フォントサイズ・行間・字間・太さ・書体）
- 余白（padding・margin・gap・セクション間スペース）
- 配置とレイアウト（整列・フレックス方向・要素位置）
- サイズ（幅・高さ・アスペクト比）
- 要素の有無・構成（欠落・過剰・順序違い）
- 画像・アイコン（解像度・形状・トリミング）
- 装飾（角丸・シャドウ・ボーダー）
- 状態（撮影時のhover/focus/展開状態の差）

### Step 4: Markdownレポートとして出力

`/tmp/product-test/ui-diff/$RUN/report.md` に差分レポートを書き出す。テンプレートは [../references/diff-report-template.md](../references/diff-report-template.md)。

レポートに含めるもの:

- 比較対象（A / B のラベル、URL、ビューポート、撮影日時）
- 使った画像へのパス
- カテゴリ別の差分リスト。1件ずつ「対象」「A/B それぞれの状態」「量」「原因候補」「優先度」
- 差分なしのカテゴリは明示的に「差分なし」と書く
- 優先度は「高」（レイアウト崩壊・欠落要素）/「中」（余白や色のずれ）/「低」（微細な差・誤差範囲）

レポートはユーザーがそのまま修正タスクに落とせる粒度で書く。抽象的な「ズレている」ではなく「ヘッダーの見出しが A比で約12px下にズレている」のように場所と量を書く。

「原因候補」は比較パターンによって意味が変わる:

- Figma vs 実装: CSS のどのプロパティが実装側でズレている可能性があるか
- ローカル vs 本番 / ブランチ比較: どのコミット・設定・ビルドが差分の原因らしいか（例: 環境変数で画像URLが違う、キャッシュ、フィーチャーフラグ、DB データ差）
- リファクタ前後: 意図せず変わってしまった箇所はどの変更が原因らしいか

### Step 5: 最終報告

チャットに同じレポートの要約を流す。重要度「高」の差分件数、注目すべき3点、生成画像へのパスを明示する。

### Step 6: HTML ビジュアルビューアの生成（任意）

ユーザーが「ブラウザで比較したい」「スライダーで見たい」と希望した場合、または差分が多くて人が確認したほうが早い場合に限り、HTML レポートを生成する。毎回自動では作らない（画像だけで十分なケースが多く、HTML は補助）。

```bash
bun <skill_dir>/scripts/diff/generate-report.ts /tmp/product-test/ui-diff/$RUN
```

出力（同時に2ファイル）:

- `/tmp/product-test/ui-diff/$RUN/index.html` ... 当該ランの詳細ビューア
- `/tmp/product-test/ui-diff/index.html` ... 全ラン一覧（新しい順）

開き方（一覧から各ランへ）:

```bash
open /tmp/product-test/ui-diff/index.html
```

直接そのランを開きたいときは:

```bash
open /tmp/product-test/ui-diff/$RUN/index.html
```

HTML の機能:

- prefix がハイフンなし（`pc` / `sp` のみ）のときは、上部タブで viewport を切替する1軸UI
- prefix が `<page>-<viewport>`（`top-pc`, `news-list-sp` など）のときは、**左サイドバー = ページリスト / 上部タブ = ビューポート** の2軸UI
  - 同じページの PC / SP を上部タブでサッと切り替え、別ページに移るときだけ左サイドバーから選ぶ使い心地
  - ページ × ビューポートで欠けている組み合わせは「この組み合わせはありません」と表示
- 各ページ/ビューポートの中で4モード切替
  - **Slider** — A/B 画像を縦仕切りで重ねて、ドラッグで左右比較（`a-<prefix>.png` と `b-<prefix>.png` が両方あるときのみ有効）
  - **Overlay** — `<prefix>-overlay.png`
  - **Difference** — `<prefix>-difference.png`
  - **Side by side** — `<prefix>-side-by-side.png`
- Slider は画像の上を直接クリック / ドラッグしても動く

generate-report.ts は run dir を自動走査して `<prefix>-overlay.png` がある全ての prefix を検出し、ハイフンを解析して1軸 / 2軸を自動切替する。引数は run dir のみ。再実行で上書きされる。複数ページのバッチ実行後にこれを生成すると、サイト全体を1つのビューアで通し確認できる。

チャット報告のときは `file://...` のフルパスも添えると開きやすい。

## 運用上のコツ

ビューポート幅は A/B で必ず同じにする。375px と 390px のスクショを重ねても意味ある比較にならない。

ページ同士の比較でログイン状態や Cookie の差が絡む場合、playwright-cli の `state-save` / `state-load`（または `cookie-set`）で A/B 両環境の状態を揃える。

動的コンテンツ（日付、記事一覧、ランダム表示、時計）で差分が出るのは想定内。レポートの「除外項目」欄に明示して、そこは「差分なし」として扱う。どうしても必要なら `playwright-cli route` で API レスポンスを固定する手もある。

差分が出すぎる場合、A/B の撮影条件が本当に揃っているかを先に確認する。ヘッダーの吸着動作、クッキー同意モーダル、オートプレイ動画、A/Bテスト分岐などが原因で差が出ていることが多い。必要なら `playwright-cli screenshot e<ref>` で要素単位スクショに絞る。

環境差で画像パスが違う（ローカルの画像が 404 になる等）は、差分としてではなく「撮影セットアップの問題」として扱う。直してから再比較する。

overlay画像だけでは判断が難しい差分（計算値が必要）は、figma-check スキルや DevTools の実測に引き継ぐ。このスキルは視覚差分の言語化までをスコープとする。
