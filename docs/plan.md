# フレームワークなしで作る Todo アプリ ―― Bun + SQLite でバックエンドを一周する

## はじめに

この教材は、『JavaScript Primer』の Todo アプリ（フロントエンドだけで動くもの）に、**自分で書いたバックエンド** を足していくハンズオンです。

普段は Rails や Next.js が隠してくれている部分、つまり次のような部分を、ライブラリなしで一度自分の手で書きます。

- HTTP リクエストを受け取って、レスポンスを返す
- URL とメソッドを見て処理を振り分ける（ルーティング）
- 入力をチェックして、エラーを正しいステータスコードで返す
- SQL を書いて、データベースに保存する
- ログインしたユーザーを Cookie とセッションで見分ける

ねらいは「フレームワークなしで作れるようになること」そのものではありません。**フレームワークが何を肩代わりしてくれているのかを説明できるようになること** です。各章の最後に「Rails / Next.js だとどこに当たるか」をまとめているので、実務のコードと結びつけながら進めてください。

### この教材で作るもの

```text
ブラウザ（public/ … 今の Todo アプリ）
   │  fetch("/api/todos")
   ▼
Bun のサーバー（server.js + server/）
   ├── 静的ファイル配信 … index.html や src/*.js を返す
   ├── ルーティング     … /api/todos を各処理へ振り分ける
   ├── バリデーション   … 入力をチェックして 400 などを返す
   └── リポジトリ       … SQL を発行する
          │
          ▼
SQLite（todo.sqlite … 1 つのファイル）
```

完成すると、ディレクトリはこうなります（第12章時点。第13章でログイン関連のファイルが増えます）。

```text
todo-app/
├── package.json
├── .gitignore
├── .env.example                 # 環境変数のサンプル（第11章）
├── server.js                    # 入口：サーバーを起動するだけ
├── server/
│   ├── app.js                   # ルーティングと各 API の処理
│   ├── http.js                  # HttpError・JSON の読み取りなど HTTP の共通処理
│   ├── static.js                # public/ のファイルを返す
│   ├── todoValidation.js        # 入力チェック
│   ├── db.js                    # SQLite への接続とテーブル作成
│   ├── todoRepository.js        # SQL（SQLite 版）
│   └── inMemoryTodoRepository.js# メモリ版（第5章で作り、テストで使い続ける）
├── scripts/
│   └── backup.js                # バックアップ
├── test/
│   ├── todoRepository.test.js
│   └── app.test.js
├── public/                      # フロントエンド（今の Todo アプリをここへ移す）
│   ├── index.html / index.css / index.js
│   └── src/
│       ├── api/todoApi.js       # 第8章で追加：サーバーと通信する
│       ├── model/ … view/ … App.js
└── docs/plan.md                 # この教材
```

### 使う技術

| 技術 | 役割 | 外部ライブラリ |
| --- | --- | --- |
| Bun 1.3 | JavaScript の実行環境・HTTP サーバー・テストランナー・パスワードハッシュ | なし（Bun に内蔵） |
| `bun:sqlite` | SQLite を操作する | なし（Bun に内蔵） |
| SQLite 3 | データベース（1 ファイル） | なし（macOS に `sqlite3` コマンドが入っている） |
| 素の JavaScript | フロントエンド（今の Todo アプリ） | なし |

`npm install` するものは 1 つもありません。

### 前提

- 『JavaScript Primer』を読み、Todo アプリと Ajax アプリを作り終えている
- `curl` コマンドを叩いたことがある（なくても大丈夫。都度説明します）
- 手元の環境：Bun 1.3.14、SQLite 3.54（`bun --version` と `sqlite3 --version` で確認できます）

### 進め方

各章は、次の流れで進みます。

1. **この章のゴール**：何ができるようになるか
2. **解説**：手を動かす前に知っておくこと
3. **ハンズオン**：実際に書く
4. **動作確認**：`curl` やブラウザで確かめる
5. **理解度チェック**：自分の言葉で説明できるか確認する（答えは折りたたんであります）
6. **チャレンジ**（任意）：余裕があれば
7. **Rails / Next.js だと**：実務のどこに当たるか
8. **コミット**：章の区切りでコミットする

進めるときのコツです。

- **コードはコピペせず、手で打つ** ことをおすすめします。打ちながら「この行は何のため？」と考えるのが一番の学習になります
- 「課題」になっているところは、**まず自分で書いてみてから** 解答例を開いてください
- 理解度チェックは、**声に出して説明できるか** で判定してください。説明できなければ、その章の解説に戻ります
- 詰まったら、次の 3 つをそろえて質問してください。答えやすくなります
  - どの章のどの手順か
  - 実行したコマンドと、出たエラーメッセージ（そのまま貼る）
  - 自分で試したこと

### 目次

- 第1章 準備：プロジェクトの形を整える
- 第2章 HTTP の基本と、最小のサーバー
- 第3章 静的ファイルを配信する
- 第4章 API を設計して、ルーティングを書く
- 第5章 CRUD API を作る（メモリ版）
- 第6章 SQL の基本を SQLite で練習する
- 第7章 API を SQLite につなぐ
- 第8章 フロントエンドを API につなぐ
- 第9章 エラー処理とバリデーションを固める
- 第10章 テストを書く
- 第11章 セキュリティと設定
- 第12章 バックアップと復元
- 第13章 発展：ログインとセッション
- 第14章 発展：デプロイの考え方
- 付録 A　Rails / Next.js との対応表
- 付録 B　curl・sqlite3 チートシート
- 付録 C　HTTP ステータスコード早見表
- 付録 D　トラブルシューティング

---

## 第1章 準備：プロジェクトの形を整える

### この章のゴール

- フロントエンド（`public/`）とバックエンド（`server/`）の置き場所を分ける
- Git で履歴を取り始める
- データベースのファイルを、うっかりコミットしない設定を入れる

### 解説

今の `todo-app` は、js-primer-todo をコピーしただけの状態です。ここにサーバーのコードを足していくと、ブラウザに配るファイルとサーバーだけで動くファイルが混ざってしまいます。

そこで、**ブラウザに配ってよいファイルは全部 `public/` に入れる** というルールにします。サーバーは `public/` の中身だけを返すので、サーバーのコードや DB のファイルがブラウザから見られることはありません（第3章で、これを破ろうとする攻撃も試します）。

`.gitignore` には、SQLite のファイル（`*.sqlite`）を入れておきます。DB にはユーザーのデータが入るので、**GitHub に上げてしまうと全世界に公開されます**。これは実際によく起きる事故です。

### ハンズオン

#### 1. Git を始める

```sh
cd ~/develop/todo-app
git init
```

#### 2. フロントエンドを `public/` へ移す

```sh
mkdir public
mv index.html index.css index.js src public/
```

移したあとの形はこうです。

```text
todo-app/
├── docs/plan.md
└── public/
    ├── index.html
    ├── index.css
    ├── index.js
    └── src/
```

#### 3. `package.json` を作る

`npm init` や `bun init` は使わず、必要なものだけを手で書きます。

```json
{
  "name": "todo-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch server.js",
    "start": "bun server.js",
    "test": "bun test"
  }
}
```

- `"type": "module"`：このプロジェクトの `.js` を ECMAScript モジュール（`import` / `export`）として扱う宣言です
- `"dev"`：`--watch` を付けると、ファイルを保存するたびにサーバーが自動で再起動します
- `"private": true`：間違って npm に公開しないための安全装置です

#### 4. `.gitignore` を作る

```gitignore
# SQLite のデータベースファイル（個人データが入るので絶対にコミットしない）
*.sqlite
*.sqlite-wal
*.sqlite-shm

# バックアップ
backups/

# 環境変数
.env

node_modules/
```

`*.sqlite-wal` と `*.sqlite-shm` は、第7章で出てくる SQLite の作業用ファイルです。

#### 5. 最初のコミット

```sh
git add .
git commit -m "chore: js-primer-todo をもとにプロジェクトを作成"
```

### 動作確認

```sh
git status        # nothing to commit, working tree clean と出れば OK
git log --oneline # コミットが 1 つある
```

### 理解度チェック

<details>
<summary>Q1. なぜ、フロントエンドのファイルを <code>public/</code> にまとめたのですか？</summary>

サーバーが「`public/` の中身だけをブラウザに返す」というルールにするためです。ブラウザに見せてよいファイルと、見せてはいけないファイル（サーバーのコード・DB・設定）を、フォルダで物理的に分けておけば、うっかり公開する事故を防げます。

</details>

<details>
<summary>Q2. <code>*.sqlite</code> を <code>.gitignore</code> に入れないと、何が起きますか？</summary>

`git add .` で DB ファイルがコミットされ、push すると中のデータ（あとで作るユーザーのメールアドレスやパスワードのハッシュも含む）がリポジトリに残ります。一度 push すると、ファイルを消しても Git の履歴には残り続けます。

</details>

### Rails / Next.js だと

- Rails の `public/`、Next.js の `public/` も、同じく「そのまま配信されるファイル」の置き場所です
- Rails は `rails new` の時点で `.gitignore` に `/db/*.sqlite3` などを入れてくれます。今回はそれを自分で書きました

---

## 第2章 HTTP の基本と、最小のサーバー

### この章のゴール

- HTTP のリクエストとレスポンスが、何でできているか説明できる
- `Bun.serve` で、リクエストを受けてレスポンスを返すサーバーを書ける
- `curl -i` でレスポンスの中身（ステータス・ヘッダー・ボディ）を確認できる

### 解説

#### HTTP は「テキストのやりとり」

ブラウザとサーバーは、HTTP という決まりに沿ったテキストをやりとりしています。たとえば、Todo を作るリクエストは、中身を見るとこんなテキストです。

```http
POST /api/todos HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Content-Length: 25

{"title":"牛乳を買う"}
```

| 部分 | 例 | 意味 |
| --- | --- | --- |
| リクエスト行 | `POST /api/todos HTTP/1.1` | **メソッド**（何をしたいか）と **パス**（何に対して） |
| ヘッダー | `Content-Type: application/json` | 付帯情報。ボディの形式、Cookie など |
| 空行 | | ここからボディ |
| ボディ | `{"title":"牛乳を買う"}` | 送るデータ（GET では普通は空） |

サーバーが返すレスポンスも、同じ形です。

```http
HTTP/1.1 201 Created
Content-Type: application/json;charset=utf-8
Location: /api/todos/1

{"id":1,"title":"牛乳を買う","completed":false}
```

1 行目の `201` が **ステータスコード** です。百の位で、大まかな意味が決まっています。

| 範囲 | 意味 | 例 |
| --- | --- | --- |
| 2xx | 成功 | 200 OK、201 Created、204 No Content |
| 3xx | 別の場所を見て | 301、302、304 |
| 4xx | **クライアント（送った側）が悪い** | 400 Bad Request、401、404 Not Found |
| 5xx | **サーバーが悪い** | 500 Internal Server Error |

4xx と 5xx の区別は大事です。「入力が間違っている」のに 500 を返すと、サーバーのバグなのか、使い方の間違いなのかが分からなくなります。この教材では、最後まで **4xx と 5xx を正しく使い分ける** ことにこだわります。

#### `Request` と `Response` は、fetch と同じもの

Bun でサーバーを書くときは、`Request` オブジェクトを受け取って、`Response` オブジェクトを返します。これは、ブラウザの `fetch` で使う `Request` / `Response` と **同じ Web 標準の仕組み** です。

```text
ブラウザ: fetch(request)  ──────▶  サーバー: fetch(request) { return response }
          ◀──────────────────────  response
```

Ajax アプリで `response.ok` や `response.json()` を使ったのと同じオブジェクトを、今度はサーバー側で **作る** 立場になります。

### ハンズオン

#### 1. 最小のサーバー

プロジェクトのルートに `server.js` を作ります。

```js
// server.js
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    console.log(request.method, url.pathname);
    return new Response("Hello, Bun!");
  },
});

console.log(`サーバーを起動しました: ${server.url}`);
```

- `Bun.serve` にオブジェクトを渡すと、HTTP サーバーが起動します
- `fetch` は、**リクエストが来るたびに Bun が呼ぶ関数** です。js-primer の `addEventListener` に渡したコールバックと同じで、「いつ呼ぶか」は Bun が決め、「何をするか」を私たちが書きます
- `request.url` は `"http://localhost:3000/hello?x=1"` のような完全な URL の文字列なので、`new URL()` でパースしてから `pathname`（`/hello`）を取り出します

起動します。

```sh
bun run dev
```

`サーバーを起動しました: http://localhost:3000/` と出れば成功です。止めるときは `Ctrl + C` です。

> `error: Failed to start server. Is port 3000 in use?` と出たら、ほかのアプリ（別のプロジェクトの開発サーバーなど）がすでに 3000 番を使っています。そのアプリを止めるか、`port: 3000` を `3001` などに変えてください。以降の手順の `3000` も、同じ番号に読み替えます。第11章で、ポートを環境変数で切り替えられるようにします。

### 動作確認

**別のターミナル** を開いて、`curl` で叩きます。

```sh
curl http://localhost:3000/
# Hello, Bun!

curl -i http://localhost:3000/
```

`-i` を付けると、レスポンスのステータスとヘッダーも表示されます。

```http
HTTP/1.1 200 OK
content-type: text/plain;charset=utf-8
Date: ...
Content-Length: 11

Hello, Bun!
```

`new Response("文字列")` だけで、Bun がステータス 200 と `Content-Type: text/plain` を付けてくれたことが分かります。

`-v` にすると、**送ったリクエスト** も見えます（`>` が送った側、`<` が受け取った側）。

```sh
curl -v http://localhost:3000/hello
```

サーバーのターミナルには `GET /hello` とログが出ているはずです。ブラウザで `http://localhost:3000/` を開いても、同じログが出ます（ブラウザは勝手に `/favicon.ico` も取りに来ることがあります）。

#### 2. JSON を返す

`fetch` の中身を書き換えます。

```js
fetch(request) {
  const url = new URL(request.url);
  console.log(request.method, url.pathname);
  return Response.json({ message: "Hello, Bun!", path: url.pathname });
},
```

```sh
curl -i http://localhost:3000/hello
```

`Response.json()` は、`JSON.stringify` してから `Content-Type: application/json` を付けてくれる便利メソッドです。

### 課題 2-1：パスで返す内容を変える

次のようなサーバーにしてください。

| パス | 返すもの |
| --- | --- |
| `/hello` | `Hello!`（テキスト、200） |
| `/time` | `{ "now": "2026-10-10T04:00:00.000Z" }`（JSON、現在時刻） |
| それ以外 | `Not Found`（テキスト、**404**） |

ヒント：ステータスは `new Response("本文", { status: 404 })` のように第 2 引数で指定します。

<details>
<summary>解答例</summary>

```js
// server.js
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    console.log(request.method, url.pathname);

    if (url.pathname === "/hello") {
      return new Response("Hello!");
    }
    if (url.pathname === "/time") {
      return Response.json({ now: new Date().toISOString() });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`サーバーを起動しました: ${server.url}`);
```

```sh
curl -i http://localhost:3000/nothing   # HTTP/1.1 404 Not Found
```

これが、もう **ルーティング** です。第4章で、これを整理された形に育てます。

</details>

### 理解度チェック

<details>
<summary>Q1. HTTP リクエストは、どんな部品でできていますか？</summary>

リクエスト行（メソッド・パス・バージョン）、ヘッダー、空行、ボディです。レスポンスも同じ形で、1 行目がステータス行（バージョン・ステータスコード・理由）になります。

</details>

<details>
<summary>Q2. 入力が間違っているリクエストに、500 を返すと何が困りますか？</summary>

500 は「サーバーが悪い」という意味なので、呼び出し側は自分の入力を直せばいいと気づけません。逆にサーバーの運用側は、本当のバグ（500）と使い方の間違い（4xx）が混ざって、監視やログで本物の障害を見つけにくくなります。

</details>

<details>
<summary>Q3. <code>Bun.serve</code> の <code>fetch</code> は、誰がいつ呼びますか？</summary>

Bun が、HTTP リクエストを受け取るたびに呼びます。私たちは「何をするか」（レスポンスの作り方）だけを書きます。js-primer で、View が `onUpdateTodo` を呼ぶタイミングを決めていたのと同じ、コールバックの関係です。

</details>

### Rails / Next.js だと

- **Next.js の Route Handler**（`app/api/todos/route.ts`）は、`export async function GET(request) { return Response.json(...) }` と書きます。**受け取るのも返すのも、今日書いた `Request` / `Response` と同じもの** です。Next.js はその上に「ファイルの置き場所で URL を決める」仕組みを足しています
- **Rails** では、Puma（アプリサーバー）が HTTP を受け取り、Rack という共通の約束に沿って Rails に渡します。`Bun.serve` は、この Puma と Rack の役割を 1 つでやっているイメージです

### コミット

```sh
git add .
git commit -m "feat: Bun.serve で最小のサーバーを作成"
```

---

## 第3章 静的ファイルを配信する

### この章のゴール

- サーバーから `public/` のファイルを返して、ブラウザで Todo アプリを動かす
- `Content-Type` が何のためにあるか説明できる
- **パストラバーサル** 攻撃を自分で試し、防げる

### 解説

#### なぜサーバーからファイルを返すのか

js-primer の Todo アプリは、`<script type="module">` を使っています。ECMAScript モジュールは、`index.html` をダブルクリックして開く（`file://`）と、セキュリティ上の理由で読み込めません。だから js-primer では `npx @js-primer/local-server` を使っていました。

今回は、自分のサーバーがその役目も担います。`GET /` には `public/index.html` を、`GET /src/App.js` には `public/src/App.js` を返します。

#### `Content-Type` が大事な理由

ブラウザは、ファイルの拡張子ではなく、**レスポンスの `Content-Type` ヘッダー** を見て中身を判断します。特にモジュールの JavaScript は、`Content-Type` が JavaScript になっていないと実行してくれません。

Bun では `new Response(Bun.file("パス"))` のようにファイルを渡すと、拡張子から `Content-Type` を自動で付けてくれます。

| 拡張子 | Bun が付ける Content-Type |
| --- | --- |
| `.html` | `text/html;charset=utf-8` |
| `.css` | `text/css;charset=utf-8` |
| `.js` | `text/javascript;charset=utf-8` |

#### パストラバーサル

URL のパスをそのままファイルのパスにつなげると、`../` で `public/` の外に出られてしまいます。

```text
GET /../package.json
  → public/../package.json
  → package.json が丸見え（.env や DB ファイルでも同じことが起きる）
```

実は `new URL()` は `/../` をパースの時点で正規化してくれるので、そのままでは届きません。ところが、`/` を `%2f` とエンコードした `..%2f` は正規化されずに通り抜けます。日本語のファイル名を扱うために `decodeURIComponent` でデコードすると、そこで初めて `../` に戻ります。

```text
GET /..%2fpackage.json
  → new URL() の pathname:   "/..%2fpackage.json"   （まだ安全そうに見える）
  → decodeURIComponent 後:   "/../package.json"     （ここで穴があく）
```

なので、**デコードしたあとで、組み立てたパスが本当に `public/` の中にあるか** を確認します。

### ハンズオン

#### 1. `server/static.js` を作る

```js
// server/static.js
import { resolve, sep } from "node:path";

export async function serveStatic(publicDir, pathname) {
  const root = resolve(publicDir);

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    // %E3%81 のように壊れたエンコードはデコードに失敗する
    return new Response("Bad Request", { status: 400 });
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = resolve(root, relativePath);

  // public の外を指していたら（../ など）拒否する
  if (!filePath.startsWith(root + sep)) {
    return new Response("Not Found", { status: 404 });
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(file);
}
```

1 行ずつ見ていきます。

- `resolve(publicDir)`：`"public"` を `/Users/yuta/develop/todo-app/public` のような絶対パスにします
- `decodedPath.slice(1)`：先頭の `/` を取ります。`resolve(root, "/src/App.js")` のように `/` から始まるパスを渡すと、`root` が無視されてしまうからです
- `resolve(root, relativePath)`：`..` を解決したうえで、最終的な絶対パスを作ります
- `startsWith(root + sep)`：`sep` は区切り文字（macOS では `/`）です。なぜ `root` だけでなく `sep` まで付けるのかは、理解度チェックで考えます
- `Bun.file(filePath)`：ファイルを表すオブジェクトです。この時点ではまだ読み込みません。`exists()` は、フォルダを指したときも `false` を返します

#### 2. `server.js` から使う

```js
// server.js
import { serveStatic } from "./server/static.js";

const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    return await serveStatic("public", pathname);
  },
});

console.log(`サーバーを起動しました: ${server.url}`);
```

### 動作確認

```sh
bun run dev
```

ブラウザで `http://localhost:3000/` を開きます。いつもの Todo アプリが表示され、追加・完了・削除が動けば成功です。まだデータはブラウザのメモリにしかないので、リロードすると消えます。

`curl` で `Content-Type` も確かめます。

```sh
curl -sI http://localhost:3000/src/App.js | grep -i content-type
# content-type: text/javascript;charset=utf-8
```

`-I` は、ボディなしでヘッダーだけを取るオプションです。

#### パストラバーサルを試す

`--path-as-is` を付けると、curl が `../` を勝手に整理せず、そのまま送ります。

```sh
curl -i --path-as-is "http://localhost:3000/../package.json"
curl -i --path-as-is "http://localhost:3000/..%2fpackage.json"
```

どちらも `404` になれば、守れています。

### 課題 3-1：わざと穴をあけてみる

`server/static.js` の `if (!filePath.startsWith(root + sep)) {` の行を、一時的に `if (false) {` に変えて保存してください。もう一度 `..%2fpackage.json` を叩くと、何が返ってきますか？

確認できたら、**必ず元に戻してください**。

<details>
<summary>答え</summary>

`package.json` の中身が 200 で返ってきます。同じ方法で `.env` や `todo.sqlite` も取られてしまいます。「`new URL()` が `..` を消してくれるから大丈夫」と思っていると、エンコードで簡単にすり抜けられる、ということを体感してもらう課題でした。

</details>

### 理解度チェック

<details>
<summary>Q1. ブラウザは、ファイルが JavaScript かどうかを何で判断していますか？</summary>

レスポンスの `Content-Type` ヘッダーです。URL の拡張子ではありません。モジュールの JavaScript は、`Content-Type` が JavaScript でないと実行されません。

</details>

<details>
<summary>Q2. <code>filePath.startsWith(root)</code> ではなく、<code>startsWith(root + sep)</code> にしているのはなぜですか？</summary>

`root` が `/app/public` のとき、`/app/public-secret/key.txt` も `startsWith("/app/public")` では `true` になってしまうからです。区切り文字まで含めて `/app/public/` で始まるかを見れば、「`public` フォルダの中」だけに限定できます。

</details>

<details>
<summary>Q3. <code>decodeURIComponent</code> をしなければ、パストラバーサルの心配はなくなりますか？</summary>

`..%2f` のままなら `../` にはならないので、この攻撃は通りません。ただし、`%E3%81%82.txt`（`あ.txt`）のような日本語やスペースを含むファイル名を配信できなくなります。正しい対策は「デコードしたうえで、行き先が `public/` の中かを確認する」ことです。

</details>

### Rails / Next.js だと

- Rails も Next.js も、`public/` の配信はフレームワーク（本番では Nginx や CDN）がやってくれます。パストラバーサルの対策も、それらに組み込まれています
- 実務で「静的ファイルは CDN に置く」のは、速さだけでなく、こうした処理をアプリのサーバーから切り離す意味もあります

### コミット

```sh
git add .
git commit -m "feat: public/ の静的ファイルを配信する"
```

---

## 第4章 API を設計して、ルーティングを書く

### この章のゴール

- REST の考え方で、Todo API の URL・メソッド・ステータスコードを設計できる
- リクエストを適切な処理へ振り分ける **ルーター** を書ける
- エラーを 1 か所で受け止めて、正しいステータスの JSON に変換できる

### 解説

#### REST：URL は「名詞」、メソッドは「動詞」

API を設計するとき、URL には **操作の対象（リソース）** を、メソッドには **何をするか** を書くのが REST の考え方です。

```text
❌ POST /api/createTodo      ❌ POST /api/deleteTodo?id=1
⭕️ POST /api/todos           ⭕️ DELETE /api/todos/1
```

この教材で作る API の全体像です。**この表が、ここから先の設計図** になります。

| 操作 | メソッド | パス | 成功時 | 主な失敗 |
| --- | --- | --- | --- | --- |
| 一覧 | `GET` | `/api/todos` | 200 + Todo の配列 | ― |
| 作成 | `POST` | `/api/todos` | **201** + 作った Todo + `Location` ヘッダー | 400 |
| 1 件取得 | `GET` | `/api/todos/:id` | 200 + Todo | 404 |
| 更新 | `PATCH` | `/api/todos/:id` | 200 + 更新後の Todo | 400、404 |
| 削除 | `DELETE` | `/api/todos/:id` | **204**（本文なし） | 404 |

Todo は、JSON で次の形にそろえます。

```json
{ "id": 1, "title": "牛乳を買う", "completed": false, "createdAt": "2026-10-10T04:10:16.328Z" }
```

エラーのときは、どの API でも同じ形で返します。形がそろっていれば、フロントエンドは 1 か所で処理できます。

```json
{ "error": { "message": "title を入力してください" } }
```

#### 覚えておきたい 4 つの言葉

- **PATCH と PUT**：PATCH は「送った項目だけを変える（部分更新）」、PUT は「丸ごと置き換える」です。チェックボックスで `completed` だけを変えたいので PATCH を使います
- **201 Created**：「作りました」。作ったものの URL を `Location` ヘッダーで返すのが慣習です
- **204 No Content**：「成功したけど、返す本文はない」。削除の成功によく使います
- **405 Method Not Allowed**：「その URL はあるけど、そのメソッドは使えない」。使えるメソッドを `Allow` ヘッダーで返します。404（そもそも URL がない）とは区別します

#### べき等性

同じリクエストを何回送っても、結果の状態が同じになる性質を **べき等** といいます。

- `GET`・`PUT`・`DELETE` はべき等です。`DELETE /api/todos/1` を 2 回送ると、2 回目は 404 になりますが、「id 1 がない」という状態は同じです
- `POST` はべき等ではありません。2 回送ると Todo が 2 つできます。フォームの二重送信で同じデータが 2 件できるのは、このためです

### ハンズオン

#### 1. HTTP の共通部品：`server/http.js`

```js
// server/http.js
export class HttpError extends Error {
  constructor(status, message, { headers, ...options } = {}) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
    this.headers = headers;
  }
}

export function errorResponse(status, message, headers) {
  return Response.json({ error: { message } }, { status, headers });
}

export function methodNotAllowed(allowedMethods) {
  return new HttpError(405, "このメソッドは使えません", {
    headers: { Allow: allowedMethods.join(", ") },
  });
}
```

`HttpError` は、**「このエラーは、このステータスで返してほしい」という情報を持ったエラー** です。処理の途中で `throw new HttpError(404, "...")` すれば、あとでまとめてレスポンスに変換できます。

`{ headers, ...options } = {}` は、第 3 引数のオブジェクトから `headers` だけを取り出し、残り（`cause` など）を `options` にまとめる書き方です。js-primer で学んだ分割代入と残余引数の組み合わせです。

#### 2. 静的ファイルも `HttpError` を投げるようにする

第3章では `new Response("Not Found", { status: 404 })` を直接返していました。エラーの返し方を 1 か所に集めるため、`throw` に変えます。

```diff
 // server/static.js
 import { resolve, sep } from "node:path";
+import { HttpError } from "./http.js";

 export async function serveStatic(publicDir, pathname) {
   const root = resolve(publicDir);

   let decodedPath;
   try {
     decodedPath = decodeURIComponent(pathname);
-  } catch {
-    // %E3%81 のように壊れたエンコードはデコードに失敗する
-    return new Response("Bad Request", { status: 400 });
+  } catch (error) {
+    throw new HttpError(400, "URL が正しくありません", { cause: error });
   }

   const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
   const filePath = resolve(root, relativePath);

   // public の外を指していたら（../ など）拒否する
   if (!filePath.startsWith(root + sep)) {
-    return new Response("Not Found", { status: 404 });
+    throw new HttpError(404, "ファイルが見つかりません");
   }

   const file = Bun.file(filePath);
   if (!(await file.exists())) {
-    return new Response("Not Found", { status: 404 });
+    throw new HttpError(404, "ファイルが見つかりません");
   }
   return new Response(file);
 }
```

`cause` は、Ajax アプリでも使った「元のエラーを残したまま、新しいエラーで包む」ためのオプションです。

#### 3. ルーター：`server/app.js`

```js
// server/app.js
import { HttpError, errorResponse, methodNotAllowed } from "./http.js";
import { serveStatic } from "./static.js";

// /api/todos/123 にマッチして、123 の部分を取り出す
const TODO_PATH = /^\/api\/todos\/(\d+)$/;

export function createApp({ publicDir = "public" } = {}) {
  // /api/todos
  async function handleTodos(request) {
    switch (request.method) {
      case "GET":
        return Response.json([]); // 第5章で、本物の一覧を返すようにする
      default:
        throw methodNotAllowed(["GET"]);
    }
  }

  // /api/todos/:id
  async function handleTodo(request, id) {
    switch (request.method) {
      case "GET":
        return Response.json({ id }); // 第5章で、本物の Todo を返すようにする
      default:
        throw methodNotAllowed(["GET"]);
    }
  }

  return async function handleRequest(request) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/api/todos") {
        return await handleTodos(request);
      }
      const match = pathname.match(TODO_PATH);
      if (match) {
        return await handleTodo(request, Number(match[1]));
      }
      if (pathname.startsWith("/api/")) {
        throw new HttpError(404, "API が見つかりません");
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        throw methodNotAllowed(["GET", "HEAD"]);
      }
      return await serveStatic(publicDir, pathname);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.message, error.headers);
  }
  // 想定外のエラーは中身をクライアントに見せず、サーバーのログにだけ残す
  console.error(error);
  return errorResponse(500, "サーバーでエラーが発生しました");
}
```

ポイントを 4 つ見ていきます。

**(1) `createApp` は「関数を返す関数」**

`createApp()` を呼ぶと、`handleRequest` という関数が返ってきます。設定（今は `publicDir`、第5章からはデータの保存先）を最初に 1 回だけ渡しておき、あとはリクエストごとに `handleRequest(request)` を呼ぶ、という形です。中の関数から外側の引数が見えるのは、js-primer で学んだ **クロージャ** の仕組みです。

**(2) 正規表現でパスから id を取り出す**

```text
/^\/api\/todos\/(\d+)$/
  ^ と $       … 文字列の最初から最後までぴったり
  \/           … スラッシュ（正規表現の中ではエスケープする）
  (\d+)        … 数字 1 文字以上。( ) で囲んだ部分が match[1] に入る
```

`/api/todos/abc` は `\d+` にマッチしないので、下の `pathname.startsWith("/api/")` に進んで 404 になります。

**(3) `try` の中では `return await`**

```js
try {
  if (pathname === "/api/todos") {
    return await handleTodos(request);   // ← await が必須
  }
  ...
} catch (error) {
  return toErrorResponse(error);
}
```

Ajax アプリで学んだ落とし穴が、ここでそのまま出てきます。`handleTodos` は async 関数なので、中で `throw` すると **reject された Promise** が返ってきます。`await` せずに `return handleTodos(request)` と書くと、Promise をそのまま返した時点で `try` を抜けてしまい、あとから reject されても `catch` は動きません。

`return await` にしておけば、その場で結果を待つので、reject は `catch` に届きます。

**(4) エラーの変換は 1 か所**

`HttpError` なら、持っているステータスで返します。それ以外（コードのバグなど）は 500 にして、**詳しい中身はクライアントに見せず、サーバーのログにだけ出します**。エラーメッセージにはファイルのパスや SQL が含まれることがあり、攻撃者にヒントを与えてしまうからです。

#### 4. `server.js` を `createApp` に切り替える

```js
// server.js
import { createApp } from "./server/app.js";

const app = createApp();

const server = Bun.serve({
  port: 3000,
  fetch: app,
});

console.log(`サーバーを起動しました: ${server.url}`);
```

`fetch: app` は、関数を **呼ばずに、関数そのものを渡しています**。js-primer で `addEventListener("submit", this.#submitEventListener)` と書いたのと同じで、「リクエストが来たら、この関数を呼んで」と Bun に預けています。

### 動作確認

```sh
curl -i http://localhost:3000/api/todos        # 200 []
curl -i http://localhost:3000/api/todos/42     # 200 {"id":42}
curl -i http://localhost:3000/api/todos/abc    # 404 {"error":{"message":"API が見つかりません"}}
curl -i -X DELETE http://localhost:3000/api/todos   # 405、Allow: GET
curl -i http://localhost:3000/                  # 200 index.html（ブラウザでも今までどおり動く）
```

`-X DELETE` は、メソッドを指定するオプションです。

### 課題 4-1：ヘルスチェック API を足す

`GET /api/health` で `{ "status": "ok" }` を返してください。サーバーが生きているかを外から確認するための API で、実務でもよく作ります。`GET` 以外は 405 にします。

<details>
<summary>解答例</summary>

`handleRequest` の中、`/api/todos` の判定の前あたりに足します。

```js
if (pathname === "/api/health") {
  if (request.method !== "GET") {
    throw methodNotAllowed(["GET"]);
  }
  return Response.json({ status: "ok" });
}
```

`/api/` で始まる判定（404）より **前** に書かないと、404 になってしまう点に注意してください。ルーターは上から順に見ていくので、順番が意味を持ちます。

</details>

### 理解度チェック

<details>
<summary>Q1. 404 と 405 の違いは何ですか？</summary>

404 は「その URL のものがない」、405 は「URL はあるけど、そのメソッドは受け付けていない」です。405 のときは、使えるメソッドを `Allow` ヘッダーで知らせます。

</details>

<details>
<summary>Q2. <code>try</code> の中の <code>return await handleTodos(request)</code> から <code>await</code> を消すと、何が起きますか？</summary>

`handleTodos` の中で `throw new HttpError(405, ...)` しても、reject された Promise がそのまま `handleRequest` の外へ返り、`catch` を素通りします。その結果、`toErrorResponse` が呼ばれず、エラーが Bun まで届いてしまいます。`try` の中で Promise を返すときは、`return await` にします。

</details>

<details>
<summary>Q3. 想定外のエラーの中身を、なぜクライアントに返さないのですか？</summary>

エラーメッセージやスタックトレースには、ファイルのパス・SQL・ライブラリのバージョンなど、攻撃の手がかりになる情報が含まれることがあるからです。クライアントには「サーバーでエラーが発生しました」とだけ返し、詳細はサーバーのログで確認します。

</details>

### Rails / Next.js だと

| この章で書いたもの | Rails | Next.js |
| --- | --- | --- |
| `handleRequest` の `if` の並び | `config/routes.rb`（`resources :todos`） | `app/api/todos/route.ts` と `app/api/todos/[id]/route.ts` のフォルダ構成 |
| `handleTodos` の `switch (request.method)` | コントローラーの `index` / `create` アクション | `route.ts` の `export function GET` / `POST` |
| 正規表現の `(\d+)` | `params[:id]` | `params.id` |
| `toErrorResponse` | `rescue_from`、本番での例外ページ | `error.ts` や `try/catch` を自分で書く |

Rails の `resources :todos` 1 行は、この章の表（一覧・作成・取得・更新・削除）をまとめて作ってくれる、ということです。

### コミット

```sh
git add .
git commit -m "feat: API のルーティングとエラー処理の土台を作成"
```

---

## 第5章 CRUD API を作る（メモリ版）

### この章のゴール

- 「データの出し入れ」を **リポジトリ** という部品に分ける理由を説明できる
- リクエストボディの JSON を読み、入力をチェックして、Todo を作れる
- PATCH と DELETE を自分で実装できる

### 解説

#### いきなり DB を使わない理由

いきなり SQL まで書くと、「HTTP の問題」と「SQL の問題」が同時に起きて、どこで詰まっているのか分からなくなります。そこでこの章では、データを **サーバーのメモリ（ただの配列）** に置いて、HTTP の部分だけを完成させます。第7章で、保存先だけを SQLite に差し替えます。

#### リポジトリ：データの出し入れを担当する部品

データの保存方法を、`app.js` に直接書かずに、**リポジトリ** という部品に閉じ込めます。`app.js` は「どう保存されるか」を知らずに、次のメソッドを呼ぶだけにします。

| メソッド | 受け取るもの | 返すもの |
| --- | --- | --- |
| `findAll()` | なし | Todo の配列 |
| `findById(id)` | id | Todo、なければ `null` |
| `create({ title })` | タイトル | 作った Todo |
| `update(id, changes)` | id と、変えたい項目（`{ title?, completed? }`） | 更新後の Todo、なければ `null` |
| `remove(id)` | id | 消せたら `true`、なければ `false` |

この「約束」さえ守れば、中身が配列でも SQLite でもかまいません。js-primer で View が `onUpdateTodo` の **中身を知らずに呼べた** のと同じ考え方です。

```text
app.js ──(約束: findAll / create / ...)──▶ リポジトリ
                                           ├── メモリ版（この章）
                                           └── SQLite 版（第7章）
```

### ハンズオン

#### 1. メモリ版リポジトリ：`server/inMemoryTodoRepository.js`

```js
// server/inMemoryTodoRepository.js
export function createInMemoryTodoRepository() {
  let todos = [];
  let nextId = 1;

  function findAll() {
    return todos.map((todo) => ({ ...todo }));
  }

  function findById(id) {
    const todo = todos.find((todo) => todo.id === id);
    return todo ? { ...todo } : null;
  }

  function create({ title }) {
    const todo = {
      id: nextId++,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    return { ...todo };
  }

  function update(id, changes) {
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) return null;
    Object.assign(todo, changes);
    return { ...todo };
  }

  function remove(id) {
    const before = todos.length;
    todos = todos.filter((todo) => todo.id !== id);
    return todos.length < before;
  }

  return { findAll, findById, create, update, remove };
}
```

- `todos` と `nextId` は、`createInMemoryTodoRepository` の中の変数です。外からは、返した 5 つの関数を通してしか触れません（クロージャによるカプセル化。js-primer の `#items` と同じ目的です）
- `{ ...todo }` で **コピーを返している** のは、呼び出し側が返ってきたオブジェクトを書き換えても、保存されているデータが変わらないようにするためです
- `id` はサーバーが振ります。今まで js-primer の `TodoItemModel` で `todoIdx++` していた役目が、サーバーに移ります

#### 2. リクエストボディを読む：`readJsonBody`

`server/http.js` に足します。

```js
// server/http.js に追加
export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new HttpError(400, "リクエストボディが正しい JSON ではありません", {
      cause: error,
    });
  }
}
```

ここでも `return await` です。`await` がないと、壊れた JSON の `SyntaxError` が `catch` をすり抜けて、400 ではなく **500** になります（課題 5-3 で確かめます）。

#### 3. 入力チェック：`server/todoValidation.js`

```js
// server/todoValidation.js
import { HttpError } from "./http.js";

const TITLE_MAX_LENGTH = 100;

function parseTitle(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "title は文字列で指定してください");
  }
  const title = value.trim();
  if (title === "") {
    throw new HttpError(400, "title を入力してください");
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new HttpError(400, `title は ${TITLE_MAX_LENGTH} 文字以内で入力してください`);
  }
  return title;
}

function parseCompleted(value) {
  if (typeof value !== "boolean") {
    throw new HttpError(400, "completed は true か false で指定してください");
  }
  return value;
}

export function parseNewTodo(body) {
  return { title: parseTitle(body.title) };
}

export function parseTodoChanges(body) {
  return { completed: parseCompleted(body.completed) };
}
```

関数名を `validate〜` ではなく `parse〜` にしているのは、**チェックするだけでなく、使える形に整えて返す** からです（前後の空白を `trim` するなど）。「チェックを通ったデータだけが、整った形で先へ進む」ようにしておくと、後ろの処理で何度もチェックしなくて済みます。

> フロントエンドでも空文字チェックをしていますが、**サーバー側のチェックは省略できません**。API は curl などでフロントエンドを通さずに直接叩けるからです。フロントエンドのチェックは「使いやすさのため」、サーバーのチェックは「守るため」です。

#### 4. `app.js` で一覧・作成・1 件取得を実装する

```diff
 // server/app.js
-import { HttpError, errorResponse, methodNotAllowed } from "./http.js";
+import { HttpError, errorResponse, methodNotAllowed, readJsonBody } from "./http.js";
 import { serveStatic } from "./static.js";
+import { parseNewTodo } from "./todoValidation.js";

 // /api/todos/123 にマッチして、123 の部分を取り出す
 const TODO_PATH = /^\/api\/todos\/(\d+)$/;

-export function createApp({ publicDir = "public" } = {}) {
+export function createApp({ todoRepository, publicDir = "public" }) {
   // /api/todos
   async function handleTodos(request) {
     switch (request.method) {
       case "GET":
-        return Response.json([]); // 第5章で、本物の一覧を返すようにする
+        return Response.json(todoRepository.findAll());
+      case "POST": {
+        const body = await readJsonBody(request);
+        const todo = todoRepository.create(parseNewTodo(body));
+        return Response.json(todo, {
+          status: 201,
+          headers: { Location: `/api/todos/${todo.id}` },
+        });
+      }
       default:
-        throw methodNotAllowed(["GET"]);
+        throw methodNotAllowed(["GET", "POST"]);
     }
   }

   // /api/todos/:id
   async function handleTodo(request, id) {
     switch (request.method) {
-      case "GET":
-        return Response.json({ id }); // 第5章で、本物の Todo を返すようにする
+      case "GET": {
+        const todo = todoRepository.findById(id);
+        if (!todo) throw notFoundTodo(id);
+        return Response.json(todo);
+      }
+      // 課題 5-1・5-2 で PATCH と DELETE を足す
       default:
         throw methodNotAllowed(["GET"]);
     }
   }
```

ファイルの末尾（`toErrorResponse` の上）に、404 を作る小さな関数も足します。

```js
function notFoundTodo(id) {
  return new HttpError(404, `id: ${id} の Todo は見つかりません`);
}
```

`case "POST": { ... }` のように `{ }` で囲んでいるのは、`switch` の中で `const` を使うためです。囲まないと、`case` 同士で同じ名前の変数がぶつかることがあります。

#### 5. `server.js` でリポジトリを渡す

```js
// server.js
import { createApp } from "./server/app.js";
import { createInMemoryTodoRepository } from "./server/inMemoryTodoRepository.js";

const app = createApp({ todoRepository: createInMemoryTodoRepository() });

const server = Bun.serve({
  port: 3000,
  fetch: app,
});

console.log(`サーバーを起動しました: ${server.url}`);
```

**どのリポジトリを使うかを決めているのは `server.js` だけ** です。`app.js` は、渡されたものを使うだけです。このように、使う部品を外から渡すことを **依存性の注入（DI）** と呼びます。第10章のテストで、このありがたみが分かります。

### 動作確認

```sh
# 作成（-d でボディを送る。-H でヘッダーを付ける）
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"牛乳を買う"}'
# HTTP/1.1 201 Created
# Location: /api/todos/1
# {"id":1,"title":"牛乳を買う","completed":false,"createdAt":"..."}

curl http://localhost:3000/api/todos        # 一覧
curl -i http://localhost:3000/api/todos/1   # 1 件
curl -i http://localhost:3000/api/todos/99  # 404

# 入力エラー
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":"   "}'   # 400
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":'          # 400（JSON が壊れている）
```

最後に、`Ctrl + C` でサーバーを止めて、もう一度 `bun run dev` で起動してから一覧を取ってください。**データが消えています**。メモリに置いたデータは、プロセスが終わると消えるからです。これを解決するのが、第6章・第7章のデータベースです。

### 課題 5-1：PATCH を実装する

`PATCH /api/todos/:id` で、`{ "completed": true }` を受け取って更新し、更新後の Todo を返してください。

- ボディの読み取りとチェックは、`readJsonBody` と `parseTodoChanges` を使う
- 存在しない id なら 404
- 使えるメソッドの一覧（`Allow`）も更新する

<details>
<summary>解答例</summary>

```diff
-import { parseNewTodo } from "./todoValidation.js";
+import { parseNewTodo, parseTodoChanges } from "./todoValidation.js";
```

```js
// handleTodo の switch に追加
case "PATCH": {
  const body = await readJsonBody(request);
  const todo = todoRepository.update(id, parseTodoChanges(body));
  if (!todo) throw notFoundTodo(id);
  return Response.json(todo);
}
default:
  throw methodNotAllowed(["GET", "PATCH"]);
```

```sh
curl -i -X PATCH http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" -d '{"completed":true}'
```

</details>

### 課題 5-2：DELETE を実装する

`DELETE /api/todos/:id` で削除し、成功したら **204（本文なし）** を返してください。存在しない id なら 404 です。

ヒント：本文なしのレスポンスは `new Response(null, { status: 204 })` です。

<details>
<summary>解答例</summary>

```js
// handleTodo の switch に追加
case "DELETE": {
  const deleted = todoRepository.remove(id);
  if (!deleted) throw notFoundTodo(id);
  return new Response(null, { status: 204 });
}
default:
  throw methodNotAllowed(["GET", "PATCH", "DELETE"]);
```

```sh
curl -i -X DELETE http://localhost:3000/api/todos/1   # 204
curl -i -X DELETE http://localhost:3000/api/todos/1   # 2 回目は 404
```

</details>

### 課題 5-3：`return await` を外してみる

`readJsonBody` の `return await request.json();` を、一時的に `return request.json();` に変えて保存してください。壊れた JSON を送ると、ステータスはいくつになりますか？ サーバーのターミナルには何が出ますか？

確認できたら元に戻してください。

<details>
<summary>答え</summary>

**500** になり、サーバーのターミナルに `SyntaxError` が出力されます。`request.json()` が返した Promise は、`try` を抜けてから reject されるので、`catch` で `HttpError(400)` に変換されません。そのまま `handleRequest` の `catch` まで届き、想定外のエラーとして 500 になります。

</details>

### 課題 5-4：500 になる入力を探す

今のコードには、まだ **400 になるべきなのに 500 になる入力** があります。curl でいろいろ送って探してみてください。見つけたら、第9章で直します。

<details>
<summary>ヒントと答え</summary>

ヒント：`JSON.parse("null")` は、エラーにならずに `null` を返します。

答えの一つは、ボディが `null` のときです。

```sh
curl -i -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d 'null'
```

`readJsonBody` は `null` を返し、`parseNewTodo(null)` の中の `body.title` で `TypeError` が起きて 500 になります。

ちなみに `[]` や `"文字列"` を送ると、`body.title` が `undefined` になるので、たまたま 400（「title は文字列で指定してください」）になります。ただ、本当に伝えたいのは「JSON オブジェクトを送ってください」です。第9章では、これもまとめて直します。

</details>

### 理解度チェック

<details>
<summary>Q1. データの出し入れを、なぜ <code>app.js</code> に直接書かずにリポジトリに分けたのですか？</summary>

`app.js` が「どう保存するか」を知らずに済むようにするためです。約束（`findAll` / `create` / ...）だけを守れば、保存先を配列から SQLite に変えても `app.js` は変わりません。テストでは、本物の DB の代わりに別の実装を渡すこともできます。

</details>

<details>
<summary>Q2. フロントエンドで空文字をチェックしているのに、サーバーでもチェックするのはなぜですか？</summary>

API はフロントエンドを通さずに、curl などで直接呼べるからです。フロントエンドのチェックは利用者の使いやすさのため、サーバーのチェックはデータを守るためのもので、役割が違います。

</details>

<details>
<summary>Q3. 作成に 201、削除に 204 を返すのはなぜですか？ 全部 200 ではダメですか？</summary>

200 でも動きはしますが、201 は「新しく作った」、204 は「成功したが本文はない」という意味を、ステータスだけで伝えられます。呼び出し側は、204 なら `response.json()` を呼ばない、といった判断ができます（第8章で実際に使います）。

</details>

### Rails / Next.js だと

| この章で書いたもの | Rails | Next.js |
| --- | --- | --- |
| リポジトリ（`findAll` / `create` / ...） | Active Record のモデル（`Todo.all` / `Todo.create`） | Prisma・Drizzle などのクライアント |
| `parseNewTodo` | Strong Parameters（`params.require(:todo).permit(:title)`）と、モデルの `validates` | zod などのスキーマで `parse` |
| `readJsonBody` | Rails が自動で `params` に変換 | `await request.json()` |
| `todoRepository` を `createApp` に渡す | Rails は `Todo` クラスを直接呼ぶ（DI はあまりしない） | 同じく直接 import することが多い |

Rails のコントローラーで `@todo = Todo.find(params[:id])` と書いたとき、見つからなければ自動で 404 になるのは、`ActiveRecord::RecordNotFound` を Rails が 404 に変換してくれているからです。この章の `notFoundTodo` を、フレームワークがやってくれているわけです。

### コミット

```sh
git add .
git commit -m "feat: Todo の CRUD API をメモリ上に実装"
```

---

## 第6章 SQL の基本を SQLite で練習する

### この章のゴール

- データベース・テーブル・行・列という言葉で、データの置き場所を説明できる
- `CREATE TABLE`・`INSERT`・`SELECT`・`UPDATE`・`DELETE` を書ける
- 制約（`NOT NULL`・`CHECK` など）とトランザクションの役割が分かる

### 解説

#### SQLite は「1 ファイルのデータベース」

PostgreSQL や MySQL は、データベース用のサーバー（プロセス）を別に立てて、アプリはネットワーク越しに接続します。SQLite は違っていて、**データベース全体が 1 つのファイル** です。アプリが直接そのファイルを読み書きするので、サーバーを立てる必要がありません。

```text
PostgreSQL / MySQL:  アプリ ──ネットワーク──▶ DB サーバー ──▶ ファイル群
SQLite:              アプリ ──────────────────────────────▶ todo.sqlite（1 ファイル）
```

SQL の基本（`SELECT` / `INSERT` / `UPDATE` / `DELETE`）は、どの DB でもほとんど同じです。ここで身につけたことの大部分は、Rails で使っている DB にもそのまま通用します。

#### SQLite の型は少ない

SQLite が持っている型は、ほぼ次の 5 つだけです。

| 型 | 中身 |
| --- | --- |
| `INTEGER` | 整数 |
| `REAL` | 小数 |
| `TEXT` | 文字列 |
| `BLOB` | バイナリ（そのままのバイト列） |
| `NULL` | 値がない |

**真偽値（boolean）と日時の型がありません**。そこで、

- 真偽値は `INTEGER` の `0`（false）と `1`（true）で表す
- 日時は `TEXT` に ISO 8601 形式（`2026-10-10T04:10:16.328Z`）で入れる

というのが定番です。ISO 8601 の文字列は、文字列として並べ替えても時刻の順になるので、比較や並べ替えにもそのまま使えます。

### ハンズオン

練習用のファイルで遊びます（`*.sqlite` は `.gitignore` 済みなので、コミットされません）。

```sh
sqlite3 practice.sqlite
```

`sqlite>` というプロンプトが出たら、SQLite の中にいます。まず表示を見やすくします（`.` で始まるのは SQL ではなく、`sqlite3` コマンドの設定です）。

```sql
.headers on
.mode box
```

#### 1. テーブルを作る

```sql
CREATE TABLE todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

| 書き方 | 意味 |
| --- | --- |
| `PRIMARY KEY` | 行を一意に見分ける列。重複できない |
| `AUTOINCREMENT` | 新しい行に、自動で増える番号を振る。**消した番号は二度と使わない** |
| `NOT NULL` | 空（NULL）を許さない |
| `DEFAULT 0` | 値を指定しなければ 0 にする |
| `CHECK (completed IN (0, 1))` | 0 か 1 以外は入れられない |
| `strftime(...)` | 現在時刻（UTC）を ISO 8601 の文字列にする |

`.schema todos` で、作ったテーブルの定義を確認できます。

#### 2. 行を入れる・取り出す

```sql
INSERT INTO todos (title) VALUES ('牛乳を買う');
INSERT INTO todos (title) VALUES ('本を返す'), ('部屋を掃除する');

SELECT * FROM todos;
```

```text
╭────┬────────────────┬───────────┬──────────────────────────╮
│ id │     title      │ completed │        created_at        │
╞════╪════════════════╪═══════════╪══════════════════════════╡
│  1 │ 牛乳を買う     │         0 │ 2026-10-10T04:22:38.040Z │
│  2 │ 本を返す       │         0 │ 2026-10-10T04:22:38.040Z │
│  3 │ 部屋を掃除する │         0 │ 2026-10-10T04:22:38.040Z │
╰────┴────────────────┴───────────┴──────────────────────────╯
```

`id`・`completed`・`created_at` を指定していないのに、自動で入っています。

条件を付けて取り出します。

```sql
SELECT id, title FROM todos WHERE completed = 0 ORDER BY id DESC;
```

- `SELECT 列, 列`：取り出す列（`*` は全部）
- `WHERE`：条件
- `ORDER BY 列 DESC`：並べ替え（`DESC` は降順、`ASC` は昇順）

#### 3. 更新する・消す

```sql
UPDATE todos SET completed = 1 WHERE id = 1;
SELECT count(*) AS done_count FROM todos WHERE completed = 1;

DELETE FROM todos WHERE id = 2;
SELECT * FROM todos;
```

> **`UPDATE` と `DELETE` には、必ず `WHERE` を付けてください。** `DELETE FROM todos;` と書くと、全部の行が消えます。

#### 4. 制約に守ってもらう

わざと、おかしなデータを入れてみます。

```sql
INSERT INTO todos (title) VALUES (NULL);
-- Error: NOT NULL constraint failed: todos.title

INSERT INTO todos (title, completed) VALUES ('x', 2);
-- Error: CHECK constraint failed: completed IN (0, 1)
```

アプリ側のバリデーションにバグがあっても、**DB の制約が最後の砦** になります。アプリのチェックと DB の制約は、両方あるのが理想です。

#### 5. 型を確かめる

```sql
SELECT typeof(id), typeof(title), typeof(completed), typeof(created_at) FROM todos LIMIT 1;
```

`integer`・`text`・`integer`・`text` と出ます。`completed` は boolean ではなく整数、`created_at` は日時ではなく文字列です。

#### 6. トランザクションで「取り消し」を体験する

```sql
BEGIN;
DELETE FROM todos;               -- WHERE を付け忘れた！
SELECT count(*) AS in_tx FROM todos;          -- 0 件
ROLLBACK;                        -- なかったことにする
SELECT count(*) AS after_rollback FROM todos; -- 元の件数に戻っている
```

`BEGIN` から `COMMIT`（確定）または `ROLLBACK`（取り消し）までをひとまとまりにするのが **トランザクション** です。「全部成功するか、全部なかったことになるか」のどちらかにできます。たとえば「ユーザーを作って、初期データも入れる」ような処理で、途中で失敗して中途半端なデータが残るのを防げます。

#### 7. 作ったものを返してもらう（`RETURNING`）

```sql
INSERT INTO todos (title) VALUES ('本を買う') RETURNING id, title;
```

`RETURNING` を付けると、`INSERT`・`UPDATE` した行をその場で返してくれます。振られた `id` を知るために、もう一度 `SELECT` しなくて済みます。第7章で使います。

終わったら、`.quit` で抜けます。

### 課題 6-1：SQL を書く

練習用のテーブルに対して、次の SQL を書いてください。

1. 未完了（`completed = 0`）の Todo の件数
2. タイトルに「買」を含む Todo
3. 新しい順（`id` の大きい順）に 2 件
4. **すべての** Todo を完了にする（トランザクションの中で試して、最後は `ROLLBACK` しましょう）

<details>
<summary>解答例</summary>

```sql
-- 1
SELECT count(*) FROM todos WHERE completed = 0;

-- 2（% は「0 文字以上の何か」）
SELECT * FROM todos WHERE title LIKE '%買%';

-- 3
SELECT id, title FROM todos ORDER BY id DESC LIMIT 2;

-- 4
BEGIN;
UPDATE todos SET completed = 1;
SELECT * FROM todos;
ROLLBACK;
```

</details>

### 課題 6-2：消した id はどうなる？

id 2 を消したあとに `INSERT` すると、新しい行の id はいくつになりますか？ `SELECT name, seq FROM sqlite_sequence;` も実行して、理由を考えてください。

<details>
<summary>答え</summary>

2 ではなく、それまでの最大の次（この流れなら 4）になります。`AUTOINCREMENT` を付けたテーブルは、これまでに使った最大の番号を `sqlite_sequence` という内部テーブルに記録していて、消した番号を再利用しません。「id 2 の Todo」を指していた古いリンクやブックマークが、別の Todo を指してしまう事故を防げます。

</details>

### 理解度チェック

<details>
<summary>Q1. SQLite と PostgreSQL の、いちばん大きな違いは何ですか？</summary>

PostgreSQL は DB サーバーのプロセスを立てて、アプリがネットワーク越しに接続します。SQLite はデータベース全体が 1 つのファイルで、アプリが直接読み書きします。そのため SQLite はサーバーの準備がいらず、バックアップもファイル単位で扱えます（第12章）。

</details>

<details>
<summary>Q2. SQLite で、真偽値と日時はどう表しますか？</summary>

真偽値は `INTEGER` の 0 と 1、日時は `TEXT` に ISO 8601 形式の文字列で入れます。アプリとやりとりするときは、0/1 を `false`/`true` に変換する必要があります（第7章）。

</details>

<details>
<summary>Q3. アプリでバリデーションしているのに、DB にも制約を付けるのはなぜですか？</summary>

アプリのバリデーションにバグがあったときや、別のスクリプトや手作業で DB を直接いじったときにも、おかしなデータが入らないようにするためです。DB の制約は最後の砦です。

</details>

### Rails / Next.js だと

- Rails のマイグレーションで `t.boolean :completed, default: false, null: false` と書くと、SQLite では内部的に 0/1 の列が作られます。Active Record が `true`/`false` に変換してくれています
- `t.timestamps` が作る `created_at` / `updated_at` も、SQLite では文字列として保存されています
- `rails dbconsole` で入れるのが、今日使った `sqlite3`（DB が PostgreSQL なら `psql`）です

### コミット

この章はアプリのコードを変えていないので、コミットはありません。`practice.sqlite` は消してかまいません。

```sh
rm practice.sqlite
```

---

## 第7章 API を SQLite につなぐ

### この章のゴール

- `bun:sqlite` で、アプリから SQL を実行できる
- **プレースホルダー** を使う理由を、SQL インジェクションを実際に起こして説明できる
- DB の行（snake_case・0/1）と、API で返す形（camelCase・boolean）を変換できる
- サーバーを再起動しても、データが残る

### 解説

#### リポジトリを差し替えるだけ

第5章でリポジトリの約束を決めておいたので、やることは **SQLite 版のリポジトリを作って、`server.js` で渡すものを変える** だけです。`app.js` は 1 行も変えません。

#### SQL インジェクション

ユーザーから受け取った値を、文字列としてつなげて SQL を組み立てると、値の中に SQL を仕込まれてしまいます。

```js
const id = "1 OR 1=1"; // 攻撃者が送り込んだ値
db.run(`DELETE FROM todos WHERE id = ${id}`);
// 実際に実行される SQL: DELETE FROM todos WHERE id = 1 OR 1=1
// → 1=1 は常に真なので、全件削除
```

これを防ぐのが **プレースホルダー**（`?`）です。SQL の「形」と「値」を別々に DB へ渡すので、値の中身が SQL として解釈されることはありません。

```js
db.query("DELETE FROM todos WHERE id = ?").run(id);
// "1 OR 1=1" という「文字列の値」と id を比べるだけ → どの行にも一致しない
```

**ルール：SQL に値を入れるときは、必ずプレースホルダーを使う。テンプレートリテラル（`${}`）で SQL に値を埋め込まない。**

### ハンズオン

#### 1. SQL インジェクションを起こしてみる

プロジェクトのルートに、試し用のファイルを作ります（試したら消します）。

```js
// injection-demo.js
import { Database } from "bun:sqlite";

const db = new Database(":memory:");
db.run("CREATE TABLE todos (id INTEGER PRIMARY KEY, title TEXT NOT NULL)");

function reset() {
  db.run("DELETE FROM todos");
  db.run("INSERT INTO todos (title) VALUES ('牛乳を買う'), ('本を返す'), ('部屋を掃除する')");
}

// 攻撃者が送り込んだ値（本来は「消したい Todo の id」が入るはずの場所）
const id = "1 OR 1=1";

// ❌ 文字列をつなげて SQL を組み立てる
reset();
db.run(`DELETE FROM todos WHERE id = ${id}`);
console.log("文字列連結:", db.query("SELECT count(*) AS count FROM todos").get());

// ⭕️ プレースホルダーで値を渡す
reset();
db.query("DELETE FROM todos WHERE id = ?").run(id);
console.log("プレースホルダー:", db.query("SELECT count(*) AS count FROM todos").get());
```

```sh
bun injection-demo.js
```

```text
文字列連結: {
  count: 0,
}
プレースホルダー: {
  count: 3,
}
```

文字列連結のほうは、3 件すべてが消えました。`new Database(":memory:")` は、ファイルを作らずにメモリ上だけで動く DB です。試し用やテスト用に便利です。

確認できたら消しておきます。

```sh
rm injection-demo.js
```

> 今回の API は、ルーターの正規表現（`\d+`）で数字しか通さないので、二重に守られています。それでも、リポジトリは「呼び出し側が正しい値を渡してくれるはず」と当てにせず、**自分の責任でプレースホルダーを使います**。

#### 2. DB の接続とテーブル作成：`server/db.js`

```js
// server/db.js
import { Database } from "bun:sqlite";

export function openDatabase(filename) {
  const db = new Database(filename, { create: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
  return db;
}
```

- `{ create: true }`：ファイルがなければ作ります
- `CREATE TABLE IF NOT EXISTS`：テーブルがまだなければ作ります。起動するたびに呼んでも安全です
- `PRAGMA journal_mode = WAL`：**WAL モード**（Write-Ahead Logging）にします。書き込みをまず `todo.sqlite-wal` という別ファイルに追記して、あとで本体へまとめて反映する方式です。読み込みと書き込みがお互いを待たずに済むので、Web アプリでは定番の設定です。その代わり、ファイルが `todo.sqlite`・`todo.sqlite-wal`・`todo.sqlite-shm` の 3 つになります。これは第12章のバックアップで大事になります

#### 3. SQLite 版リポジトリ：`server/todoRepository.js`

```js
// server/todoRepository.js

// DB の 1 行（snake_case・0/1）を、API で返す形（camelCase・boolean）に変換する
function toTodo(row) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export function createTodoRepository(db) {
  function findAll() {
    const rows = db
      .query("SELECT id, title, completed, created_at FROM todos ORDER BY id")
      .all();
    return rows.map(toTodo);
  }

  function findById(id) {
    const row = db
      .query("SELECT id, title, completed, created_at FROM todos WHERE id = ?")
      .get(id);
    return row ? toTodo(row) : null;
  }

  function create({ title }) {
    const row = db
      .query(
        "INSERT INTO todos (title) VALUES (?) RETURNING id, title, completed, created_at",
      )
      .get(title);
    return toTodo(row);
  }

  function update(id, changes) {
    const current = findById(id);
    if (!current) return null;

    const next = { ...current, ...changes };
    const row = db
      .query(
        "UPDATE todos SET title = ?, completed = ? WHERE id = ? RETURNING id, title, completed, created_at",
      )
      .get(next.title, next.completed ? 1 : 0, id);
    return toTodo(row);
  }

  function remove(id) {
    const result = db.query("DELETE FROM todos WHERE id = ?").run(id);
    return result.changes > 0;
  }

  return { findAll, findById, create, update, remove };
}
```

`bun:sqlite` の使い方をまとめます。

| 書き方 | 返すもの | 使いどころ |
| --- | --- | --- |
| `db.query(sql).all(値...)` | 行の配列 | 複数行の `SELECT` |
| `db.query(sql).get(値...)` | 最初の 1 行。なければ `null` | 1 行の `SELECT`、`RETURNING` 付きの `INSERT`/`UPDATE` |
| `db.query(sql).run(値...)` | `{ changes, lastInsertRowid }` | 結果の行がいらない `UPDATE`/`DELETE` |
| `db.run(sql)` | ― | 値を渡さない SQL（テーブル作成など） |

`?` の数だけ、`all` / `get` / `run` に値を順番に渡します。`db.query()` は、同じ SQL 文の解析結果をキャッシュして使い回してくれます。

設計のポイントも見ておきます。

- **`SELECT *` を使わず、列を書いている**：あとで DB に列を足したとき（第13章で `user_id` を足します）、意図しない列まで API で返してしまう事故を防ぎます
- **`toTodo` で変換を 1 か所に集めている**：「DB の都合（`created_at`・0/1）」が、リポジトリの外に漏れません。`app.js` もフロントエンドも、`createdAt` と `true`/`false` だけを知っていれば済みます
- **`remove` は `changes` を見る**：`DELETE` が実際に何行消したかが `changes` に入ります。0 なら、その id はなかったということです

#### 4. `server.js` でリポジトリを差し替える

```diff
 // server.js
 import { createApp } from "./server/app.js";
-import { createInMemoryTodoRepository } from "./server/inMemoryTodoRepository.js";
+import { openDatabase } from "./server/db.js";
+import { createTodoRepository } from "./server/todoRepository.js";

-const app = createApp({ todoRepository: createInMemoryTodoRepository() });
+const db = openDatabase("todo.sqlite");
+const app = createApp({ todoRepository: createTodoRepository(db) });
```

`inMemoryTodoRepository.js` は消さずに残しておきます。第10章のテストで使います。

### 動作確認

```sh
bun run dev
```

```sh
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -d '{"title":"牛乳を買う"}'
curl -X PATCH http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" -d '{"completed":true}'
curl http://localhost:3000/api/todos
```

プロジェクトのルートに `todo.sqlite`（と `-wal`・`-shm`）ができています。

```sh
ls todo.sqlite*
git status   # .gitignore のおかげで、DB ファイルは出てこない
```

**サーバーを `Ctrl + C` で止めて、もう一度起動してください。** 一覧を取ると、データが残っています。第5章との一番の違いです。

サーバーを動かしたまま、別のターミナルから DB を直接のぞくこともできます。

```sh
sqlite3 todo.sqlite "SELECT * FROM todos"
```

`completed` が `1`、`created_at` が文字列で入っているのが見えます。API では `true` と `createdAt` に変換されて返っていることと見比べてください。

### 課題 7-1：DB を直接書き換える

サーバーを動かしたまま、`sqlite3` で `UPDATE todos SET title = '直接書き換えた' WHERE id = 1;` を実行してから、`curl` で一覧を取ってください。何が返りますか？

<details>
<summary>答え</summary>

書き換えたタイトルが返ってきます。サーバーはデータを自分のメモリに持たず、リクエストのたびに DB を読んでいるからです。**データの正解は DB にある**、というのが、メモリ版との大きな違いです。

</details>

### チャレンジ 7-2：完了・未完了で絞り込む

`GET /api/todos?completed=true` で完了済みだけ、`?completed=false` で未完了だけを返せるようにしてください。`?completed=yes` のような値は 400 にします。

ヒント：

- クエリ文字列は `new URL(request.url).searchParams.get("completed")` で取れます（なければ `null`）
- リポジトリの `findAll` に `{ completed }` を渡せるようにします
- メモリ版のリポジトリも、同じ約束になるように直します（第10章のテストで、両方を同じように動かすためです）

<details>
<summary>解答例</summary>

```js
// server/todoValidation.js に追加
// ?completed=true / false / なし を、true / false / undefined に変換する
export function parseCompletedQuery(value) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new HttpError(400, "completed は true か false で指定してください");
}
```

```js
// server/app.js（handleTodos の GET）
case "GET": {
  const { searchParams } = new URL(request.url);
  const completed = parseCompletedQuery(searchParams.get("completed"));
  return Response.json(todoRepository.findAll({ completed }));
}
```

```js
// server/todoRepository.js
function findAll({ completed } = {}) {
  if (completed === undefined) {
    const rows = db
      .query("SELECT id, title, completed, created_at FROM todos ORDER BY id")
      .all();
    return rows.map(toTodo);
  }
  const rows = db
    .query(
      "SELECT id, title, completed, created_at FROM todos WHERE completed = ? ORDER BY id",
    )
    .all(completed ? 1 : 0);
  return rows.map(toTodo);
}
```

```js
// server/inMemoryTodoRepository.js
function findAll({ completed } = {}) {
  return todos
    .filter((todo) => completed === undefined || todo.completed === completed)
    .map((todo) => ({ ...todo }));
}
```

`app.js` の import に `parseCompletedQuery` を足すのも忘れずに。条件によって SQL を変えるとき、**値はプレースホルダーで渡し、SQL の形（`WHERE` を付けるかどうか）だけを分岐させている** 点に注目してください。

</details>

### 理解度チェック

<details>
<summary>Q1. プレースホルダーを使うと、なぜ SQL インジェクションが防げるのですか？</summary>

SQL の形（`DELETE FROM todos WHERE id = ?`）と値（`"1 OR 1=1"`）を別々に DB へ渡すからです。値はあくまで「比べる相手のデータ」として扱われ、SQL の一部として解釈されることがありません。

</details>

<details>
<summary>Q2. DB の行をそのまま返さず、<code>toTodo</code> で変換するのはなぜですか？</summary>

DB の都合（`created_at` という列名、真偽値を 0/1 で持つこと）を、リポジトリの外に漏らさないためです。API の形を DB の形から切り離しておけば、DB を変えても API を使う側（フロントエンド）に影響しません。

</details>

<details>
<summary>Q3. WAL モードにすると、ファイルはどうなりますか？</summary>

`todo.sqlite` に加えて、`todo.sqlite-wal`（書き込みの追記先）と `todo.sqlite-shm`（WAL の管理用）ができます。最新の変更が `-wal` 側にだけあることがあるので、本体のファイルだけをコピーしてもバックアップになりません（第12章）。

</details>

### Rails / Next.js だと

| この章で書いたもの | Rails | Next.js（Prisma の例） |
| --- | --- | --- |
| `db.query("SELECT ... WHERE id = ?").get(id)` | `Todo.find_by(id: id)` | `prisma.todo.findUnique({ where: { id } })` |
| `INSERT ... RETURNING` | `Todo.create!(title:)` | `prisma.todo.create({ data: { title } })` |
| `toTodo`（snake_case → camelCase） | 変換なし（Ruby も snake_case） | Prisma の `@map("created_at")` |
| プレースホルダー | `where("title = ?", title)`、ハッシュ条件 | Prisma は自動。`$queryRaw` のタグ付きテンプレート |
| `CREATE TABLE IF NOT EXISTS` | `db/migrate` + `db/schema.rb` | `prisma migrate` |

Rails で `Todo.where("title = '#{params[:title]}'")` と書くと、今日の SQL インジェクションがそのまま起きます。`where("title = ?", params[:title])` やハッシュ条件 `where(title: params[:title])` を使うのは、まさにプレースホルダーのためです。

### コミット

```sh
git add .
git commit -m "feat: Todo を SQLite に保存する"
```

---

## 第8章 フロントエンドを API につなぐ

### この章のゴール

- js-primer の Todo アプリを、ブラウザのメモリではなくサーバーの API で動かす
- `fetch` の結果に応じて、成功時とエラー時の表示を分けられる
- ブラウザの開発者ツール（Network タブ）で、通信の中身を確認できる

### 解説

#### 変わるのは Model だけ（ほぼ）

js-primer の Todo アプリは、Model（データ）と View（表示）を分けて作りました。そのおかげで、**変えるのは主に Model** です。

```text
今まで:  App ─▶ TodoListModel（配列を書き換えるだけ）
これから: App ─▶ TodoListModel ─▶ todoApi（fetch）─▶ サーバー ─▶ SQLite
```

View（`TodoListView`・`TodoItemView`）は、1 行も変えません。

#### サーバーの返事を待ってから、画面を変える

操作のたびに、次の順で進めます。

```text
チェックボックスをクリック
  → PATCH /api/todos/1 を送る
  → サーバーが 200 と更新後の Todo を返す
  → Model を書き換えて change イベント
  → 画面を描き直す
```

**サーバーが成功と言ってから画面を変える** ので、画面と DB の中身がずれません。エラーのときは画面を変えずに、メッセージを出します。

> 反対に、「先に画面を変えて、失敗したら元に戻す」やり方を **楽観的更新（Optimistic Update）** といいます。体感は速くなりますが、失敗時に元に戻す処理が必要になり、複雑になります。まずは、待ってから変えるやり方で作ります。

### ハンズオン

#### 1. 通信を担当する部品：`public/src/api/todoApi.js`

```js
// public/src/api/todoApi.js
async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    // サーバーが返した { error: { message } } を取り出す（取れなければステータスで代用）
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message ?? `HTTP ${response.status}`);
  }

  // 204 No Content には本文がないので、json() を呼ばない
  if (response.status === 204) {
    return null;
  }
  return await response.json();
}

export const todoApi = {
  fetchAll() {
    return request("/api/todos");
  },
  create({ title }) {
    return request("/api/todos", { method: "POST", body: { title } });
  },
  update({ id, completed }) {
    return request(`/api/todos/${id}`, { method: "PATCH", body: { completed } });
  },
  remove({ id }) {
    return request(`/api/todos/${id}`, { method: "DELETE" });
  },
};
```

Ajax アプリで学んだことが、そのまま詰まっています。

- `fetch` は 404 や 500 でも reject しないので、**`response.ok` を見て自分で `throw`** します
- サーバーが返したエラーメッセージ（`error.message`）を取り出して、`Error` に入れ直します。第4章でエラーの形をそろえたので、ここが 1 か所で済みます
- `fetch("/api/todos")` のように、`http://localhost:3000` を付けずに書いています。ページと API が **同じオリジン**（同じスキーム・ホスト・ポート）から配信されているので、パスだけで届きます

#### 2. `TodoItemModel`：id はサーバーが振る

```diff
 // public/src/model/TodoItemModel.js
-let todoIdx = 0;
-
 export class TodoItemModel {
   id;
   title;
   completed;

-  constructor({ title, completed }) {
-    this.id = todoIdx++;
+  constructor({ id, title, completed }) {
+    this.id = id;
     this.title = title;
     this.completed = completed;
   }
 }
```

#### 3. `TodoListModel`：API を呼んでから、自分の状態を変える

```js
// public/src/model/TodoListModel.js
import { EventEmitter } from "../EventEmitter.js";
import { todoApi } from "../api/todoApi.js";
import { TodoItemModel } from "./TodoItemModel.js";

export class TodoListModel extends EventEmitter {
  #items;

  constructor(items = []) {
    super();
    this.#items = items;
  }

  getTotalCount() {
    return this.#items.length;
  }

  getTodoItems() {
    return this.#items;
  }

  onChange(listener) {
    this.addEventListener("change", listener);
  }

  offChange(listener) {
    this.removeEventListener("change", listener);
  }

  emitChange() {
    this.emit("change");
  }

  async load() {
    const todos = await todoApi.fetchAll();
    this.#items = todos.map((todo) => new TodoItemModel(todo));
    this.emitChange();
  }

  async addTodo({ title }) {
    const todo = await todoApi.create({ title });
    this.#items.push(new TodoItemModel(todo));
    this.emitChange();
  }

  async updateTodo({ id, completed }) {
    const todo = await todoApi.update({ id, completed });
    const todoItem = this.#items.find((item) => item.id === id);
    if (!todoItem) return;

    todoItem.completed = todo.completed;
    this.emitChange();
  }

  async deleteTodo({ id }) {
    await todoApi.remove({ id });
    this.#items = this.#items.filter((item) => item.id !== id);
    this.emitChange();
  }
}
```

- 各メソッドが `async` になり、**API が成功してから** `#items` を書き換えて `emitChange()` します。API が失敗すると `await` の行で例外が投げられ、その下は実行されません。だから、失敗時に画面が変わることはありません
- `addTodo` は、引数を `TodoItemModel` ではなく `{ title }` で受け取るようにしました。id はサーバーが振るので、作る前の Todo はまだ `TodoItemModel` になれないからです
- 新しく `load()` を足しました。最初にサーバーから一覧を読み込みます

#### 4. `App`：失敗したらメッセージを出す

```js
// public/src/App.js
import { TodoListModel } from "./model/TodoListModel.js";
import { TodoListView } from "./view/TodoListView.js";
import { render } from "./view/html-util.js";

export class App {
  #todoListView = new TodoListView();
  #todoListModel = new TodoListModel();
  #formElement = document.querySelector("#js-form");
  #inputElement = document.querySelector("#js-form-input");
  #containerElement = document.querySelector("#js-todo-list");
  #todoItemCountElement = document.querySelector("#js-todo-count");
  #errorElement = document.querySelector("#js-error");
  #submitEventListener = (event) => {
    event.preventDefault();
    if (this.#inputElement.value.trim() === "") return;
    this.handleAdd(this.#inputElement.value);
  };
  #todoListModelChangeListener = () => {
    const todoItems = this.#todoListModel.getTodoItems();
    const todoListElement = this.#todoListView.createElement(todoItems, {
      onUpdateTodo: ({ id, completed }) => {
        this.handleUpdateTodo({ id, completed });
      },
      onDeleteTodo: ({ id }) => {
        this.handleDeleteTodo({ id });
      },
    });
    render(todoListElement, this.#containerElement);
    this.#todoItemCountElement.innerText = `Todoアイテム数: ${this.#todoListModel.getTotalCount()}`;
  };

  async handleLoad() {
    try {
      await this.#todoListModel.load();
      this.#clearError();
    } catch (error) {
      this.#showError(error);
    }
  }

  async handleAdd(title) {
    try {
      await this.#todoListModel.addTodo({ title });
      this.#inputElement.value = "";
      this.#clearError();
    } catch (error) {
      this.#showError(error);
    }
  }

  async handleUpdateTodo({ id, completed }) {
    try {
      await this.#todoListModel.updateTodo({ id, completed });
      this.#clearError();
    } catch (error) {
      this.#showError(error);
    }
  }

  async handleDeleteTodo({ id }) {
    try {
      await this.#todoListModel.deleteTodo({ id });
      this.#clearError();
    } catch (error) {
      this.#showError(error);
    }
  }

  #showError(error) {
    console.error(error);
    // サーバーから来た文字列なので、innerHTML ではなく textContent で入れる
    this.#errorElement.textContent = error.message;
  }

  #clearError() {
    this.#errorElement.textContent = "";
  }

  mount() {
    this.#todoListModel.onChange(this.#todoListModelChangeListener);
    this.#formElement.addEventListener("submit", this.#submitEventListener);
    this.handleLoad();
  }

  unmount() {
    this.#formElement.removeEventListener("submit", this.#submitEventListener);
    this.#todoListModel.offChange(this.#todoListModelChangeListener);
  }
}
```

変わったところを整理します。

- **入力欄を空にするのは、追加に成功してから** です。失敗したときに入力が消えると、もう一度打ち直すことになるからです
- `handleXxx` は async 関数ですが、イベントリスナーからは **`await` せずに呼んでいます**。それでも大丈夫なのは、各 `handleXxx` が自分の中で必ず `catch` しているからです。**async 関数を `await` せずに呼ぶなら、その関数の中でエラーを受け止めておく**、というのがルールです。受け止めないと、ブラウザのコンソールに `Uncaught (in promise)` と出るだけで、利用者には何も伝わりません
- エラーメッセージは `textContent` で入れます。サーバーから来た文字列を `innerHTML` に入れると、XSS の入り口になります

#### 5. エラーの表示場所を HTML に足す

```diff
 <!-- public/index.html -->
       </form>
+      <p id="js-error" class="error" role="alert"></p>
       <div id="js-todo-list" class="todo-list"></div>
```

`role="alert"` を付けると、スクリーンリーダーが中身の変化を読み上げてくれます。

```css
/* public/index.css の末尾に追加 */
.error {
  margin: 0;
  padding: 0 20px 16px;
  color: var(--color-danger);
  font-size: 14px;
}

.error:empty {
  display: none;
}
```

`:empty` は「中身が空のとき」です。メッセージがないときは、場所も取らないようにしています。

### 動作確認

```sh
bun run dev
```

ブラウザで `http://localhost:3000/` を開き、次を確かめます。

1. Todo を追加・完了・削除できる
2. **ページをリロードしても、Todo が残っている**
3. サーバーのターミナルを見ると、操作のたびにリクエストが来ている
4. 101 文字以上のタイトルを入れると、サーバーのエラーメッセージ（「title は 100 文字以内で…」）が赤字で出て、**入力欄の文字は消えない**

#### 開発者ツールで通信を見る

`Cmd + Option + I` で開発者ツールを開き、**Network** タブを選んでから、Todo を追加してください。`todos` という行をクリックすると、次の情報が見られます。

- **Headers**：メソッド（POST）、ステータス（201）、送ったヘッダー（`Content-Type`）
- **Payload**：送ったボディ（`{"title":"..."}`）
- **Response**：サーバーが返したボディ

curl で見ていたものと同じものが、ブラウザからも送られていることを確かめてください。

#### XSS が起きないことを確かめる

タイトルに `<img src=x onerror=alert(1)>` と入れて追加してください。**アラートは出ず、文字列としてそのまま表示されれば正解** です。js-primer の `element` タグ関数が、値をエスケープしてから HTML に埋め込んでいるからです。

DB には、この文字列がそのまま保存されています（`sqlite3 todo.sqlite "SELECT title FROM todos"`）。**エスケープは保存するときではなく、HTML に出力するときにする**、というのが原則です。

### 課題 8-1：サーバーを止めたらどうなる？

ブラウザを開いたまま、サーバーを `Ctrl + C` で止めてください。その状態で Todo を追加すると、何が表示されますか？ サーバーを起動し直してから、もう一度追加するとどうなりますか？

<details>
<summary>答え</summary>

Chrome では「Failed to fetch」と表示されます（ブラウザによって文言が違います）。サーバーに届かない **ネットワークエラー** なので、`fetch` 自体が reject され、`response.ok` のチェックまで進みません。入力欄の文字は残っているので、サーバーを起動し直してから Enter を押せば追加できます。

「サーバーがエラーを返した（4xx/5xx）」と「サーバーに届かなかった」は、別の種類の失敗です。Ajax アプリの記事で書いた「`response.ok` と `catch` の二段構え」が、ここでも効いています。

</details>

### チャレンジ 8-2：ネットワークエラーを分かりやすい文言にする

「Failed to fetch」は利用者には分かりにくいので、ネットワークエラーのときだけ「サーバーに接続できませんでした」と表示してください。

<details>
<summary>ヒントと解答例</summary>

ネットワークエラーのとき、`fetch` は `TypeError` で reject します。`request` 関数の `fetch` を `try/catch` で囲んで、包み直します。

```js
let response;
try {
  response = await fetch(path, { /* 省略 */ });
} catch (error) {
  throw new Error("サーバーに接続できませんでした", { cause: error });
}
```

ここでも `cause` で元のエラーを残しておくと、コンソールで原因を追えます。

</details>

### 理解度チェック

<details>
<summary>Q1. View を 1 行も変えずに済んだのはなぜですか？</summary>

View は「Model から受け取った Todo を描く」「操作されたらコールバックで知らせる」ことしかしていないからです。データがどこから来るか（配列か、サーバーか）は Model の中に閉じているので、Model を変えるだけで済みました。

</details>

<details>
<summary>Q2. <code>request</code> で <code>response.status === 204</code> のときに <code>json()</code> を呼ばないのはなぜですか？</summary>

204 は本文がないので、`response.json()` を呼ぶと JSON の解析に失敗して例外になるからです。DELETE は成功しているのに、エラー扱いになってしまいます。

</details>

<details>
<summary>Q3. <code>handleAdd</code> を <code>await</code> せずに呼んでいても大丈夫なのはなぜですか？</summary>

`handleAdd` の中で `try/catch` して、エラーを必ず受け止めているからです。中で受け止めていない async 関数を `await` せずに呼ぶと、エラーが誰にも受け止められず、`Uncaught (in promise)` になります。

</details>

### Rails / Next.js だと

- Rails の form（Turbo）は、ブラウザのフォーム送信でサーバーに POST して、返ってきた HTML で画面を差し替えます。今回は JSON を返して、画面はフロントエンドが組み立てる方式です
- React で TanStack Query（React Query）などを使うと、`useQuery` が `load()`、`useMutation` が `addTodo()` にあたります。楽観的更新や、失敗時に元に戻す処理も用意されています
- JSX は値を自動でエスケープするので、`element` タグ関数と同じ役目を果たしています。`dangerouslySetInnerHTML` は、そのエスケープを外す操作です

### コミット

```sh
git add .
git commit -m "feat: フロントエンドを Todo API につなぐ"
```

---

## 第9章 エラー処理とバリデーションを固める

### この章のゴール

- 「想定外の入力」を洗い出して、すべて 4xx で返せる
- `Content-Type` のチェック（415）を入れる理由を説明できる
- リクエストのログを出して、何が起きているかを見える化する

### 解説

第5章の課題で見つけたとおり、今の API には「400 になるべきなのに 500 になる入力」がありました。API は、フロントエンドが送るきれいなデータだけでなく、**何が送られてきても壊れない** ようにしておく必要があります。

この章で直すものの一覧です。

| 入力 | 今の結果 | 目標 |
| --- | --- | --- |
| ボディが `null` | **500** | 400「JSON オブジェクトで送ってください」 |
| ボディが `[]` や `"文字列"` | 400（ずれたメッセージ） | 400「JSON オブジェクトで送ってください」 |
| `Content-Type` を付けずに送る | 201（通ってしまう） | **415** |
| PATCH で `{"title":"新しい名前"}` | 400（`completed` がないと言われる） | 200（タイトルが変わる） |
| PATCH で `{}` | 400（`completed` がないと言われる） | 400「title か completed のどちらかを指定してください」 |

**415 Unsupported Media Type** は、「その形式のボディは受け付けていない」という意味です。JSON の API なのに、`Content-Type: application/json` 以外で送られてきたものは断ります。これには、第13章で扱う CSRF 攻撃への備えという意味もあります（HTML のフォームは、ほかのサイトから `application/json` で送ることができないため）。

### ハンズオン

#### 1. `readJsonBody` を固める

```js
// server/http.js
export async function readJsonBody(request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new HttpError(415, "Content-Type は application/json で送ってください");
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    throw new HttpError(400, "リクエストボディが正しい JSON ではありません", {
      cause: error,
    });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "リクエストボディは JSON オブジェクトで送ってください");
  }
  return body;
}
```

- `includes` にしているのは、`application/json; charset=utf-8` のように、後ろに文字コードが付くことがあるからです
- `typeof null` は `"object"` になってしまうので、`null` は別に弾きます。配列も `typeof` は `"object"` なので、`Array.isArray` で弾きます

#### 2. PATCH で `title` も変えられるようにする

```js
// server/todoValidation.js
export function parseTodoChanges(body) {
  const changes = {};
  if (Object.hasOwn(body, "title")) {
    changes.title = parseTitle(body.title);
  }
  if (Object.hasOwn(body, "completed")) {
    changes.completed = parseCompleted(body.completed);
  }
  if (Object.keys(changes).length === 0) {
    throw new HttpError(400, "title か completed のどちらかを指定してください");
  }
  return changes;
}
```

PATCH は「送った項目だけを変える」ので、送られてきた項目だけをチェックして `changes` に入れます。リポジトリの `update` は、もともと `{ ...current, ...changes }` で、渡された項目だけを上書きする作りにしてあるので、変更はいりません。

`Object.hasOwn(body, "title")` は、「`body` 自身が `title` というプロパティを持っているか」を調べます。`"title" in body` だとプロトタイプのプロパティまで見てしまい（たとえば `"toString" in {}` は `true`）、`body.title !== undefined` だと「`title` を送らなかった」と「`undefined` を送った」を区別できません（JSON には `undefined` がないので実害は少ないですが、意図をはっきり書けます）。

#### 3. リクエストのログを出す

`server.js` で、すべてのリクエストを包んでログを出します。

```js
// server.js
import { createApp } from "./server/app.js";
import { openDatabase } from "./server/db.js";
import { createTodoRepository } from "./server/todoRepository.js";

const db = openDatabase("todo.sqlite");
const app = createApp({ todoRepository: createTodoRepository(db) });

const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const startedAt = performance.now();
    const response = await app(request);
    const elapsed = (performance.now() - startedAt).toFixed(1);
    console.log(
      `${request.method} ${new URL(request.url).pathname} → ${response.status} (${elapsed}ms)`,
    );
    return response;
  },
});

console.log(`サーバーを起動しました: ${server.url}`);
```

`app` の前後に処理を挟んでいるだけです。このように、本体の処理を包んで前後に共通の処理を足す仕組みを、一般に **ミドルウェア** と呼びます。

```text
POST /api/todos → 201 (1.0ms)
GET /api/todos → 200 (0.2ms)
DELETE /api/todos/1 → 404 (0.2ms)
```

ログに **ステータスコードが出る** のが大事です。4xx が多ければ使い方の問題、5xx が出ていればバグ、とひと目で分かります。

### 動作確認

表の入力を、全部 curl で確かめます。

```sh
B=http://localhost:3000

curl -i -X POST $B/api/todos -H "Content-Type: application/json" -d 'null'          # 400
curl -i -X POST $B/api/todos -H "Content-Type: application/json" -d '[]'            # 400
curl -i -X POST $B/api/todos -d '{"title":"a"}'                                       # 415
curl -i -X PATCH $B/api/todos/1 -H "Content-Type: application/json" -d '{"title":"新しい名前"}'  # 200
curl -i -X PATCH $B/api/todos/1 -H "Content-Type: application/json" -d '{}'          # 400
```

`B=...` は、シェルの変数です。長い URL を何度も書かずに済みます。

curl は `-d` を付けると、`Content-Type` を勝手に `application/x-www-form-urlencoded` にします。3 つ目が 415 になるのはそのためです。ブラウザのフロントエンドは、`todoApi.js` で `Content-Type: application/json` を付けているので影響ありません。

### 課題 9-1：自分で壊し方を考える

ほかにも、API を壊せそうな入力を 3 つ考えて、curl で送ってみてください。すべて 4xx になれば合格です。もし 500 が出たら、直してみてください。

<details>
<summary>試してほしい入力の例</summary>

- `{"title": 123}`（数値）→ 400
- `{"title": "a".repeat(101)}` 相当の長い文字列 → 400
- `{"completed": "true"}`（文字列の "true"）→ 400
- `/api/todos/0` や `/api/todos/99999999999999999999` → 404
- `/api/todos/1.5` → 404（`\d+` に一致しない）
- `curl -X PUT .../api/todos/1` → 405（`Allow: GET, PATCH, DELETE`）

ちなみに `curl -X FOO` のような存在しないメソッドを送ると、curl は何も受け取れずに終わります。Bun の HTTP サーバーが、私たちのコードに渡す前の段階で接続を切るからです。

</details>

### 理解度チェック

<details>
<summary>Q1. <code>typeof body !== "object"</code> だけでは足りないのはなぜですか？</summary>

`typeof null` も `typeof []` も `"object"` になるからです。`null` は `body.title` で `TypeError` になり 500 に、配列は意図と違う形のまま通ってしまいます。

</details>

<details>
<summary>Q2. JSON の API で、<code>Content-Type</code> をチェックするのはなぜですか？</summary>

送り手と受け手で、ボディの形式の認識を一致させるためです。加えて、ほかのサイトに置かれた HTML フォームは `application/json` で送れないので、フォーム経由の CSRF 攻撃を防ぐ一枚目の壁にもなります。

</details>

<details>
<summary>Q3. ログにステータスコードを出すと、何がうれしいですか？</summary>

4xx（使い方の問題）と 5xx（サーバーのバグ）を、ログを見ただけで区別できます。本番で 5xx が増えていたらすぐ調べる、といった運用ができます。

</details>

### Rails / Next.js だと

- Rails は、JSON のボディを `params` に変換するときに、壊れた JSON を 400 にしてくれます（`ActionDispatch::Http::Parameters::ParseError`）。Strong Parameters の `require` は、必要なキーがないと 400 にします
- Rails の開発環境のログ（`Started POST "/todos" ... Completed 201 Created in 5ms`）は、まさに今回書いたミドルウェアと同じ情報を出しています
- Next.js では、Middleware（`middleware.ts`）が、リクエストの前に処理を挟む仕組みです

### コミット

```sh
git add .
git commit -m "fix: 想定外の入力をすべて 4xx で返すようにする"
```

---

## 第10章 テストを書く

### この章のゴール

- `bun test` で、リポジトリと API のテストを書ける
- サーバーを起動せずに、API をテストできる理由を説明できる
- 同じテストで、メモリ版と SQLite 版の両方を確かめられる

### 解説

ここまで、動作確認はすべて curl とブラウザで手作業でした。テストを書いておけば、コードを変えたときに **壊れていないことを数秒で確かめられます**。

この教材の作りには、テストしやすい工夫がすでに入っています。

- **`createApp` は `handleRequest(request)` という関数を返すだけ**：サーバーを起動しなくても、`new Request(...)` を作って関数に渡せば、`Response` が返ってきます
- **リポジトリを外から渡せる（DI）**：テストでは、ファイルではなく `:memory:` の DB を使えます。テストごとにまっさらな DB を作れるので、テスト同士が影響し合いません

### ハンズオン

#### 1. リポジトリのテスト：`test/todoRepository.test.js`

```js
// test/todoRepository.test.js
import { beforeEach, describe, expect, test } from "bun:test";
import { openDatabase } from "../server/db.js";
import { createInMemoryTodoRepository } from "../server/inMemoryTodoRepository.js";
import { createTodoRepository } from "../server/todoRepository.js";

// 同じテストを、メモリ版と SQLite 版の両方に流す
const implementations = [
  ["メモリ版", () => createInMemoryTodoRepository()],
  ["SQLite 版", () => createTodoRepository(openDatabase(":memory:"))],
];

describe.each(implementations)("%s の todoRepository", (_name, createRepository) => {
  let repository;

  beforeEach(() => {
    repository = createRepository();
  });

  test("create した Todo は未完了で、id が振られる", () => {
    const todo = repository.create({ title: "牛乳を買う" });

    expect(todo).toMatchObject({ title: "牛乳を買う", completed: false });
    expect(typeof todo.id).toBe("number");
  });

  test("findAll は作った順に全件を返す", () => {
    repository.create({ title: "1つ目" });
    repository.create({ title: "2つ目" });

    expect(repository.findAll().map((todo) => todo.title)).toEqual(["1つ目", "2つ目"]);
  });

  test("update は指定した項目だけを書き換える", () => {
    const { id } = repository.create({ title: "牛乳を買う" });

    const updated = repository.update(id, { completed: true });

    expect(updated).toMatchObject({ id, title: "牛乳を買う", completed: true });
    expect(repository.findById(id).completed).toBe(true);
  });

  test("存在しない id の update は null を返す", () => {
    expect(repository.update(999, { completed: true })).toBeNull();
  });

  test("remove すると findById で見つからなくなる", () => {
    const { id } = repository.create({ title: "牛乳を買う" });

    expect(repository.remove(id)).toBe(true);
    expect(repository.findById(id)).toBeNull();
    expect(repository.remove(id)).toBe(false);
  });
});
```

- `describe.each(配列)` は、配列の要素ごとに、同じ `describe` を繰り返します。`%s` には各要素の最初の値（「メモリ版」など）が入ります
- `beforeEach` は、各 `test` の前に毎回呼ばれます。テストごとに新しいリポジトリ（まっさらな DB）を作っています
- 各テストは「準備 → 実行 → 確認」の 3 段に分け、間に空行を入れています（Arrange-Act-Assert と呼ばれる書き方です）

**同じテストが両方の実装で通る** ということは、「メモリ版と SQLite 版が同じ約束を守っている」ことの証明になります。第5章で決めた約束が、テストという形で書き残されたわけです。

#### 2. API のテスト：`test/app.test.js`

```js
// test/app.test.js
import { beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/db.js";
import { createTodoRepository } from "../server/todoRepository.js";

let app;

beforeEach(() => {
  // テストごとにまっさらなメモリ上の DB を使う
  const db = openDatabase(":memory:");
  app = createApp({ todoRepository: createTodoRepository(db) });
});

function request(method, path, body) {
  return app(
    new Request(`http://localhost${path}`, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

describe("POST /api/todos", () => {
  test("Todo を作成して 201 と作成した Todo を返す", async () => {
    const response = await request("POST", "/api/todos", { title: "牛乳を買う" });

    expect(response.status).toBe(201);
    const todo = await response.json();
    expect(todo).toMatchObject({ title: "牛乳を買う", completed: false });
    expect(response.headers.get("Location")).toBe(`/api/todos/${todo.id}`);
  });

  test("title が空なら 400 を返す", async () => {
    const response = await request("POST", "/api/todos", { title: "  " });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { message: "title を入力してください" } });
  });

  test("JSON が壊れていたら 400 を返す", async () => {
    const response = await app(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ title: ",
      }),
    );

    expect(response.status).toBe(400);
  });

  test("Content-Type が JSON でなければ 415 を返す", async () => {
    const response = await app(
      new Request("http://localhost/api/todos", { method: "POST", body: "title=a" }),
    );

    expect(response.status).toBe(415);
  });
});

describe("GET /api/todos", () => {
  test("作成した Todo の一覧を返す", async () => {
    await request("POST", "/api/todos", { title: "1つ目" });
    await request("POST", "/api/todos", { title: "2つ目" });

    const response = await request("GET", "/api/todos");

    expect(response.status).toBe(200);
    const todos = await response.json();
    expect(todos.map((todo) => todo.title)).toEqual(["1つ目", "2つ目"]);
  });
});

describe("PATCH /api/todos/:id", () => {
  test("completed を更新する", async () => {
    const created = await (await request("POST", "/api/todos", { title: "a" })).json();

    const response = await request("PATCH", `/api/todos/${created.id}`, { completed: true });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: created.id, completed: true });
  });

  test("completed が boolean でなければ 400 を返す", async () => {
    const created = await (await request("POST", "/api/todos", { title: "a" })).json();

    const response = await request("PATCH", `/api/todos/${created.id}`, { completed: "yes" });

    expect(response.status).toBe(400);
  });

  test("存在しない id なら 404 を返す", async () => {
    const response = await request("PATCH", "/api/todos/999", { completed: true });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/todos/:id", () => {
  test("削除して 204 を返し、一覧から消える", async () => {
    const created = await (await request("POST", "/api/todos", { title: "a" })).json();

    const response = await request("DELETE", `/api/todos/${created.id}`);

    expect(response.status).toBe(204);
    expect(await (await request("GET", "/api/todos")).json()).toEqual([]);
  });
});

describe("想定外のリクエスト", () => {
  test("対応していないメソッドは 405 と Allow ヘッダーを返す", async () => {
    const response = await request("PUT", "/api/todos");

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
  });

  test("存在しない API は 404 を返す", async () => {
    const response = await request("GET", "/api/users");

    expect(response.status).toBe(404);
  });

  test("public の外のファイルは返さない", async () => {
    const response = await request("GET", "/..%2fpackage.json");

    expect(response.status).toBe(404);
  });
});
```

`new Request("http://localhost/api/todos", ...)` で、ブラウザや curl が送るのと同じリクエストを、コードの中で作っています。ホスト名は何でもかまいません。サーバーを通さず、`app` 関数に直接渡しているからです。

### 動作確認

```sh
bun test
```

```text
 22 pass
 0 fail
```

`bun test --watch` にすると、ファイルを保存するたびに自動でテストが走ります。

### 課題 10-1：テストを壊してみる

次の変更を 1 つずつ入れて、**どのテストが失敗するか** を予想してから `bun test` を実行してください。確かめたら元に戻します。

1. `readJsonBody` の `body = await request.json();` から `await` を消す
2. `static.js` のパストラバーサルのチェック（`startsWith`）を `if (false)` にする
3. `todoRepository.js` の `toTodo` で、`completed: row.completed === 1` を `completed: row.completed` にする

<details>
<summary>答え</summary>

1. **「JSON が壊れていたら 400 を返す」の 1 件だけ** が失敗します（400 ではなく 500 になる）。正しい JSON を送るテストは通ってしまいます。`body` に Promise が入ったまま `return body` すると、async 関数が返り値の Promise を自動で待ってくれるので、成功するケースでは **たまたま動いてしまう** からです。失敗するケースのテストを書いておかないと、このバグは見つかりません
2. 「public の外のファイルは返さない」が失敗します（200 で `package.json` が返る）
3. 4 件が失敗します。リポジトリのテストでは SQLite 版の 2 件（「create した Todo は未完了で…」「update は指定した項目だけを書き換える」）、API のテストでは「Todo を作成して 201…」「completed を更新する」です。`completed` が `false` / `true` ではなく `0` / `1` になるからです。**メモリ版は通るのに SQLite 版だけ失敗する** という結果から、DB とのやりとり（変換）のバグだと絞り込めます

「わざと壊すと、ちゃんとテストが失敗する」ことを確かめておくと、そのテストが本当に役に立っていると信用できます。

</details>

### 課題 10-2：テストを足す

次のテストを、`test/app.test.js` に自分で書いてください。

1. `GET /api/todos/999` は 404
2. PATCH で `{"title":"新しい名前"}` を送ると、タイトルだけが変わる（`completed` はそのまま）
3. PATCH で `{}` を送ると 400

<details>
<summary>解答例</summary>

```js
describe("GET /api/todos/:id", () => {
  test("存在しない id なら 404 を返す", async () => {
    const response = await request("GET", "/api/todos/999");

    expect(response.status).toBe(404);
  });
});

// describe("PATCH /api/todos/:id", ...) の中に追加
test("title だけを送ると、title だけが変わる", async () => {
  const created = await (await request("POST", "/api/todos", { title: "古い名前" })).json();

  const response = await request("PATCH", `/api/todos/${created.id}`, { title: "新しい名前" });

  expect(await response.json()).toMatchObject({ title: "新しい名前", completed: false });
});

test("何も送らなければ 400 を返す", async () => {
  const created = await (await request("POST", "/api/todos", { title: "a" })).json();

  const response = await request("PATCH", `/api/todos/${created.id}`, {});

  expect(response.status).toBe(400);
});
```

</details>

### 理解度チェック

<details>
<summary>Q1. サーバーを起動せずに API をテストできるのはなぜですか？</summary>

`createApp` が返すのは「`Request` を受け取って `Response` を返す関数」だからです。テストでは、`new Request(...)` を作ってその関数を直接呼べば、HTTP の通信なしでレスポンスを確かめられます。

</details>

<details>
<summary>Q2. テストで <code>:memory:</code> の DB を使うのはなぜですか？</summary>

ファイルを作らないので速く、テストごとにまっさらな DB を用意できるからです。本番の `todo.sqlite` を汚す心配もありません。これができるのは、`createApp` や `createTodoRepository` が、使う DB を外から受け取る作り（DI）になっているからです。

</details>

<details>
<summary>Q3. <code>describe.each</code> で両方の実装を同じテストに通すと、何が分かりますか？</summary>

2 つの実装が、同じ約束（どのメソッドが何を返すか）を守っていることが分かります。片方だけ失敗したら、その実装の中に原因があると絞り込めます。

</details>

### Rails / Next.js だと

| この章で書いたもの | Rails | Next.js |
| --- | --- | --- |
| `test/app.test.js` | request spec（`post "/todos", params: ...`） | Route Handler を直接呼ぶテスト、または Playwright などの E2E |
| `:memory:` の DB | テスト用 DB（`RAILS_ENV=test`）とトランザクションでのロールバック | テスト用 DB を用意する |
| `beforeEach` で毎回まっさら | `use_transactional_tests`（テストごとにロールバック） | ― |
| `describe.each` | RSpec の `shared_examples` | Jest / Vitest の `describe.each` |

### コミット

```sh
git add .
git commit -m "test: リポジトリと API のテストを追加"
```

---

## 第11章 セキュリティと設定

### この章のゴール

- ここまでに入れたセキュリティ対策を、「どの攻撃を、どこで防いでいるか」で説明できる
- ポート番号や DB の場所を、コードに書かずに **環境変数** で切り替えられる
- 同一オリジンと CORS の関係を説明できる

### 解説

#### ここまでの対策を棚卸しする

実は、セキュリティ対策の多くはもう入っています。

| 脅威 | 何が起きるか | 対策 | 章 |
| --- | --- | --- | --- |
| SQL インジェクション | DB を勝手に読まれる・消される | プレースホルダー | 第7章 |
| XSS | 他人のブラウザで、攻撃者のスクリプトが動く | 出力するときにエスケープ（`element` タグ関数・`textContent`） | 第8章 |
| パストラバーサル | サーバー上の任意のファイルを読まれる | デコード → 正規化 → `public/` の中かを確認 | 第3章 |
| 内部情報の漏えい | エラーから、攻撃のヒントを与える | 500 の中身はログにだけ出す | 第4章 |
| 不正な入力 | データが壊れる・サーバーが落ちる | バリデーション＋DB の制約 | 第5・6・9章 |
| 機密情報のコミット | DB や鍵が全世界に公開される | `.gitignore` | 第1章 |
| CSRF | 別サイトから、ログイン中の利用者になりすまして操作される | `Content-Type` のチェック、`SameSite` Cookie | 第9・13章 |

この章では、ここに「設定の外出し」と「大きすぎるリクエストの制限」を足します。

#### 環境変数：コードに書かない設定

ポート番号や DB ファイルの場所は、動かす環境によって変わります。開発では `3000` と `todo.sqlite`、本番では `8080` と `/data/todo.sqlite`、のようにです。こうした値は、コードに書かずに **環境変数** から読みます。

Bun は、プロジェクトのルートにある `.env` ファイルを **自動で読み込んで**、`Bun.env` に入れてくれます。

```sh
# .env（コミットしない）
PORT=3000
DB_PATH=todo.sqlite
```

`.env` は `.gitignore` 済みです。本番の DB のパスワードや API キーのような **秘密の値** も、将来はここに入れることになるからです。代わりに、どんな変数があるかだけを書いた `.env.example` をコミットしておくのが定番です。

#### 同一オリジンと CORS

**オリジン** は「スキーム＋ホスト＋ポート」の組み合わせです（例：`http://localhost:3000`）。ブラウザは、あるオリジンのページから **別のオリジン** の API を `fetch` したとき、相手のサーバーが許可していなければ、レスポンスを JavaScript に渡しません。これを緩める仕組みが **CORS** です。

今回は、ページも API も同じ `http://localhost:3000` から配信しているので、**CORS の設定はいりません**。もし将来、フロントエンドを別のポート（Vite の `5173` など）で動かすなら、サーバーが `Access-Control-Allow-Origin` ヘッダーを返す必要が出てきます。

> CORS は「ブラウザが、利用者を守るための仕組み」です。サーバーを守る仕組みではありません。curl などのブラウザ以外からは、CORS に関係なく API を叩けます。だからこそ、サーバー側のバリデーションや認証が必要です。

### ハンズオン

#### 1. 環境変数で設定する

```diff
 // server.js
-const db = openDatabase("todo.sqlite");
+const port = Number(Bun.env.PORT ?? 3000);
+const db = openDatabase(Bun.env.DB_PATH ?? "todo.sqlite");
 const app = createApp({ todoRepository: createTodoRepository(db) });

 const server = Bun.serve({
-  port: 3000,
+  port,
+  // 1MB を超えるボディは、アプリに届く前に 413 で断る
+  maxRequestBodySize: 1024 * 1024,
   async fetch(request) {
```

- `Bun.env.PORT ?? 3000`：環境変数がなければ `3000` を使います。環境変数は **必ず文字列** なので、`Number()` で数値にしています
- `maxRequestBodySize`：巨大なボディを送りつけて、サーバーのメモリを使い果たさせる攻撃への備えです。Todo のタイトルは 100 文字までなので、1MB でも十分すぎるくらいです。超えたリクエストには、Bun が **413 Payload Too Large** を返します（このときのレスポンスは、私たちの JSON の形ではなく Bun が作ったものです）

`.env.example` を作ってコミットします。

```sh
# .env.example（コミットする。値はサンプル）
PORT=3000
DB_PATH=todo.sqlite
```

### 動作確認

```sh
# 一時的に別のポートで起動する
PORT=4000 bun run dev
# → サーバーを起動しました: http://localhost:4000/

# 別の DB ファイルを使う（中身は空から始まる）
DB_PATH=other.sqlite bun run dev
```

`.env` を作って `PORT=4000` と書き、`bun run dev` だけで 4000 番で起動することも確かめてください。終わったら `.env` は消すか、`PORT=3000` に戻しておきます。

大きすぎるボディも試します。

```sh
# 2MB のデータを作って送る
head -c 2000000 /dev/zero | tr '\0' a > big.txt
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" --data-binary @big.txt
# 413
rm big.txt
```

### チャレンジ 11-1：すべてのレスポンスにセキュリティヘッダーを付ける

`server.js` のミドルウェア（ログを出しているところ）で、すべてのレスポンスに `X-Content-Type-Options: nosniff` を付けてください。これは「`Content-Type` を信じて、中身から種類を推測しないで」とブラウザに伝えるヘッダーです。

<details>
<summary>解答例</summary>

```js
async fetch(request) {
  const startedAt = performance.now();
  const response = await app(request);
  response.headers.set("X-Content-Type-Options", "nosniff");
  // （ログの出力は省略）
  return response;
},
```

```sh
curl -sI http://localhost:3000/ | grep -i nosniff
```

ほかにも、`Content-Security-Policy`（読み込んでよいスクリプトの出どころを制限する）など、ブラウザに安全な振る舞いを指示するヘッダーがあります。実務では、こうしたヘッダーをフレームワークやインフラ（CDN など）がまとめて付けてくれることが多いです。

</details>

### 理解度チェック

<details>
<summary>Q1. 環境変数を使うと、何がうれしいですか？</summary>

同じコードのまま、開発と本番で設定（ポート・DB の場所・秘密の値）を切り替えられます。秘密の値をコードに書かずに済むので、リポジトリから漏れる心配もなくなります。

</details>

<details>
<summary>Q2. 今回、CORS の設定がいらないのはなぜですか？</summary>

ページと API が同じオリジン（`http://localhost:3000`）から配信されているからです。CORS は、別のオリジンの API を、ブラウザの JavaScript から読むときにだけ必要になります。

</details>

<details>
<summary>Q3. CORS を設定すれば、API は守られますか？</summary>

守られません。CORS はブラウザが利用者を守るための仕組みで、curl などからは関係なく叩けます。API を守るのは、サーバー側のバリデーション・認証・認可です。

</details>

### Rails / Next.js だと

- Rails は `config/credentials.yml.enc`（暗号化された秘密の値）や環境変数、Next.js は `.env.local` などで設定を管理します。Next.js で `NEXT_PUBLIC_` を付けた変数だけがブラウザに渡るのは、秘密の値を誤って配らないための工夫です
- CORS は、Rails なら `rack-cors`、Next.js なら Route Handler や Middleware でヘッダーを付けて設定します
- セキュリティヘッダーは、Rails なら標準で `X-Content-Type-Options` などが付きます（`config.action_dispatch.default_headers`）

### コミット

```sh
git add .
git commit -m "feat: ポートと DB の場所を環境変数で設定できるようにする"
```

---

## 第12章 バックアップと復元

### この章のゴール

- SQLite の正しいバックアップの取り方と、**やってはいけない取り方** を説明できる
- バックアップから復元する手順を、実際にやってみる
- バックアップファイルを、本番の DB と同じくらい大切に扱える

### 解説

#### バックアップの 2 つの形

| 形 | 中身 | SQLite での作り方 | 特徴 |
| --- | --- | --- | --- |
| **物理バックアップ** | DB ファイルそのもののコピー（バイナリ） | `.backup`、`VACUUM INTO` | 速い・そのまま使える。同じ種類の DB でしか読めない |
| **論理バックアップ** | `CREATE TABLE` や `INSERT` の SQL 文（テキスト） | `.dump` | 人が読める。復元には SQL を流し直す |

SQLite のファイルは、先頭 16 バイトが必ず `SQLite format 3` という文字列になっています。ファイル名を忘れても、これで SQLite の DB だと分かります。

```sh
head -c 16 todo.sqlite
# SQLite format 3
```

#### 落とし穴：WAL モードで `cp` してはいけない

第7章で WAL モードにしました。WAL モードでは、最新の書き込みはまず `todo.sqlite-wal` に入り、ある程度たまってから本体（`todo.sqlite`）に反映されます。つまり、**本体のファイルだけをコピーすると、最新の変更が欠けることがあります**。

この教材を作るときに実際に試したところ、サーバーを止めた直後の DB は次の状態でした。

```text
-rw-r--r--   4096  todo.sqlite       ← 本体はたった 4KB
-rw-r--r--  32768  todo.sqlite-shm
-rw-r--r--  53592  todo.sqlite-wal   ← データはほとんどこちら
```

この状態で `todo.sqlite` だけを `cp` すると、**テーブルごと存在しない**（`no such table: todos`）バックアップになりました。`-wal` までコピーすれば足りる場合もありますが、サーバーが書き込んでいる最中にコピーすると、ファイル同士の整合が取れなくなる恐れがあります。

正しくは、**SQLite 自身にバックアップを作らせます**。

| 方法 | コマンド |
| --- | --- |
| `sqlite3` の `.backup` | `sqlite3 todo.sqlite ".backup backups/todo.sqlite"` |
| SQL の `VACUUM INTO` | `VACUUM INTO 'backups/todo.sqlite'` |

どちらも、WAL の中身まで含めた **一貫した 1 ファイル** を作ってくれます。サーバーが動いている最中でも大丈夫です。

#### バックアップは「盗まれたら全部漏れる」

バックアップファイルには、DB の中身がすべて入っています。DB 本体をどれだけ守っても、バックアップが盗まれれば全部漏れます。

- **リポジトリにコミットしない**（`backups/` は `.gitignore` 済み）
- 置き場所のアクセス権を絞る。クラウドに置くなら、そのアカウントに 2 段階認証を付ける
- パスワードは、そもそも平文で保存しない（第13章でハッシュ化します）

そして、**バックアップは、復元できることを確かめて初めてバックアップ** です。取りっぱなしにせず、復元の練習をしておきます。

### ハンズオン

#### 1. バックアップのスクリプト：`scripts/backup.js`

```js
// scripts/backup.js
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

const source = Bun.env.DB_PATH ?? "todo.sqlite";
// 例: backups/todo_sqlite_2026-10-10T04-30-00-000Z.sqlite（あとから見て中身が分かる名前にする）
const timestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const destination = `backups/todo_sqlite_${timestamp}.sqlite`;

mkdirSync("backups", { recursive: true });

const db = new Database(source);
// サーバーが動いていても、WAL の中身まで含めた一貫したコピーが作られる
db.query("VACUUM INTO ?").run(destination);
db.close();

console.log(`バックアップを作成しました: ${destination}`);
```

- ファイル名に、**何の DB か（`todo_sqlite`）といつのものか（日時）** を入れています。`backup.sqlite` のような名前だと、あとで何のファイルか分からなくなります
- 日時の `:` を `-` に置き換えているのは、`:` をファイル名に使えない環境があるからです
- `VACUUM INTO ?` の行き先も、プレースホルダーで渡しています

`package.json` の `scripts` に足します。

```diff
   "scripts": {
     "dev": "bun --watch server.js",
     "start": "bun server.js",
-    "test": "bun test"
+    "test": "bun test",
+    "backup": "bun scripts/backup.js"
   }
```

### 動作確認

#### バックアップを取る

サーバーを動かしたまま、Todo をいくつか追加してから実行します。

```sh
bun run backup
# バックアップを作成しました: backups/todo_sqlite_2026-10-10T04-17-21-597Z.sqlite

ls backups/
head -c 16 backups/todo_sqlite_*.sqlite      # SQLite format 3
sqlite3 backups/todo_sqlite_*.sqlite "SELECT id, title FROM todos"
sqlite3 backups/todo_sqlite_*.sqlite "PRAGMA integrity_check"   # ok
```

`backups/` にファイルが複数あるときは、`*` の部分を実際のファイル名に置き換えてください。追加したばかりの Todo まで入っていれば成功です。

#### 論理バックアップ（SQL ダンプ）も取ってみる

```sh
sqlite3 todo.sqlite .dump > backups/todo_dump.sql
head -20 backups/todo_dump.sql
```

`CREATE TABLE todos (...)` と `INSERT INTO todos VALUES(...)` が並んだ、ただのテキストです。中身を目で確かめたいときや、一部のデータだけを取り出したいときに便利です。

#### 復元の練習

「DB が壊れた」という想定で、バックアップから戻します。

```sh
# 1. サーバーを止める（Ctrl + C）

# 2. 今の DB を退避する（-wal と -shm も一緒に！）
mkdir -p broken
mv todo.sqlite todo.sqlite-wal todo.sqlite-shm broken/

# 3. バックアップを todo.sqlite としてコピーする
cp backups/todo_sqlite_2026-10-10T04-17-21-597Z.sqlite todo.sqlite

# 4. サーバーを起動して、ブラウザで確認する
bun run dev
```

Todo が、バックアップを取った時点の状態で表示されれば成功です。

手順 2 で `-wal` や `-shm` が存在しないと、`mv` が「No such file or directory」と言いますが、そのファイルはもともとなかったということなので問題ありません。

手順 2 で、**古い `-wal` と `-shm` を残さない** ことが大事です。新しい DB の隣に、別の DB の WAL ファイルが残っていると、思わぬ不整合の原因になります。

SQL ダンプからは、空の DB に SQL を流し込んで復元できます。

```sh
sqlite3 restored.sqlite < backups/todo_dump.sql
sqlite3 restored.sqlite "SELECT count(*) FROM todos"
```

確認が終わったら、`broken/` と `restored.sqlite` は消してかまいません。`broken/` はコミットしないよう注意してください（中身は DB です）。

### 課題 12-1：`cp` の落とし穴を自分の目で見る

サーバーを動かしたまま Todo を 2〜3 件追加し、すぐに次を実行してください。

```sh
ls -la todo.sqlite*
cp todo.sqlite /tmp/copy-only.sqlite
sqlite3 /tmp/copy-only.sqlite "SELECT count(*) FROM todos"
sqlite3 todo.sqlite "SELECT count(*) FROM todos"
```

2 つの件数は同じでしたか？

<details>
<summary>答え</summary>

状況によって結果が変わります。`-wal` に大きなサイズがあるときは、コピーのほうが件数が少なかったり、`no such table: todos` になったりします。本体への反映（チェックポイント）が済んだあとなら、たまたま一致することもあります。

**「たまたま動くことがある」のが一番危ない** パターンです。普段のテストでは問題が出ず、本当に復元が必要になったときに初めて欠けていると気づくからです。だから、`.backup` や `VACUUM INTO` を使います。

</details>

### チャレンジ 12-2：古いバックアップを消す

バックアップを取るたびにファイルが増え続けます。`scripts/backup.js` の最後で、`backups/` の中の `todo_sqlite_*.sqlite` のうち、新しい 7 個だけを残して古いものを消すようにしてください。

<details>
<summary>ヒント</summary>

- `readdirSync("backups")` でファイル名の一覧が取れます（`node:fs`）
- ファイル名に ISO 8601 の日時が入っているので、**文字列として並べ替えると、そのまま古い順になります**（第6章で、日時を ISO 8601 の文字列にした理由の一つです）
- `unlinkSync(パス)` でファイルを消せます。消す処理は、まず `console.log` で消す予定のファイルを表示するだけにして、正しく選べているかを確かめてから本当に消すようにしましょう

</details>

### 理解度チェック

<details>
<summary>Q1. WAL モードの SQLite を、<code>cp todo.sqlite</code> でバックアップしてはいけないのはなぜですか？</summary>

最新の書き込みが `todo.sqlite-wal` 側にだけあることがあり、本体だけをコピーすると、その変更が欠けるからです。`.backup` や `VACUUM INTO` を使えば、SQLite が WAL の中身まで含めた一貫したコピーを作ってくれます。

</details>

<details>
<summary>Q2. 物理バックアップと論理バックアップの違いは何ですか？</summary>

物理バックアップは DB ファイルそのもののコピーで、速く、そのまま差し替えて使えます。論理バックアップは SQL 文のテキストで、人が読めますが、復元には SQL を流し直す必要があります。どちらも、別の種類の DB（PostgreSQL など）にはそのままでは使えません。

</details>

<details>
<summary>Q3. 「バックアップは、復元できて初めてバックアップ」とはどういう意味ですか？</summary>

バックアップを取っていても、ファイルが欠けていたり、復元の手順が分からなかったりすれば、いざというときに役に立たないという意味です。定期的に、実際に復元できるかを確かめておく必要があります。

</details>

### Rails / Next.js だと

- 実務の PostgreSQL や MySQL では、`pg_dump` や `mysqldump`（論理）、またはクラウドの自動スナップショット（物理）でバックアップを取ります。仕組みは違っても、「一貫した状態で取る」「復元を練習する」「バックアップを厳重に守る」という考え方は同じです
- Rails の `db/seeds.rb` は初期データを入れるもので、バックアップではありません

### コミット

```sh
git add .
git commit -m "feat: SQLite のバックアップスクリプトを追加"
```

---

## 第13章 発展：ログインとセッション

> この章は、第12章までより一段難しくなります。第12章までで「CRUD の Web アプリを、フレームワークなしで一周する」という目標は達成しているので、ここからは余裕があれば進めてください。

### この章のゴール

- パスワードを **ハッシュ化** して保存する理由と方法を説明できる
- Cookie とセッションで、「誰からのリクエストか」を見分けられる
- **認証**（あなたは誰？）と **認可**（それをしていい？）を区別して実装できる
- 既存の DB を壊さずにテーブルや列を足す、**マイグレーション** の仕組みを作れる

### 解説

#### 作るものの全体像

ユーザーごとに、自分の Todo だけを見られるようにします。

```text
users                    sessions                      todos
┌───────────────┐        ┌──────────────────────┐      ┌──────────────┐
│ id            │◀──┐    │ token_hash (PK)      │  ┌──▶│ id           │
│ email (UNIQUE)│   ├────│ user_id              │  │   │ title        │
│ password_hash │   │    │ expires_at           │  │   │ completed    │
│ created_at    │   │    └──────────────────────┘  │   │ created_at   │
└───────────────┘   └────────────────────────────────┴───│ user_id (新) │
                                                         └──────────────┘
```

増える API です。

| 操作 | メソッド | パス | 成功時 | 主な失敗 |
| --- | --- | --- | --- | --- |
| 新規登録 | `POST` | `/api/users` | 201 + `Set-Cookie` | 400、**409**（登録済み） |
| ログイン | `POST` | `/api/session` | 200 + `Set-Cookie` | 400、**401** |
| ログイン中のユーザー | `GET` | `/api/session` | 200 | 401 |
| ログアウト | `DELETE` | `/api/session` | 204 + Cookie の削除 | ― |
| 既存の Todo API | | | ログインが必要 | **401** |

**409 Conflict** は「今の状態とぶつかるので、できない」という意味です。登録済みのメールアドレスでもう一度登録しようとしたときに使います。

#### パスワードはハッシュ化して保存する

パスワードを DB にそのまま保存すると、DB やバックアップが漏れた瞬間に、全員のパスワードが漏れます。多くの人は同じパスワードを使い回しているので、被害はこのアプリだけでは済みません。

そこで、パスワードは **ハッシュ化** して保存します。ハッシュ化は、元に戻せない変換です。

```text
登録時:   "password123" ──ハッシュ化──▶ "$argon2id$v=19$m=65536,t=2,p=1$..." を保存
ログイン時: 入力されたパスワードをハッシュ化して、保存したものと照合する
```

Bun には、パスワード専用のハッシュ関数 `Bun.password` が入っています（標準は **argon2id** という方式）。

- **わざと遅く作られている**：1 回の計算に数十ミリ秒かかります。正しい利用者には気にならない遅さですが、漏れたハッシュから総当たりでパスワードを探そうとする攻撃者には、膨大な時間がかかります
- **ソルトが自動で入る**：同じパスワードでも、毎回違うハッシュになります。「よく使われるパスワードのハッシュ一覧」と照らし合わせる攻撃が効きません

> SHA-256 のような一般的なハッシュ関数は、速すぎるのでパスワードには使いません。パスワードには、argon2id や bcrypt のような **パスワード専用** のものを使います。

#### Cookie とセッション

HTTP は、1 回 1 回のリクエストが独立していて、前のリクエストを覚えていません。そこで、ログインに成功したら **セッション** を作り、その目印（トークン）を **Cookie** でブラウザに持たせます。

```text
1. POST /api/session（メールとパスワード）
   ← 200  Set-Cookie: session=ランダムな長い文字列; HttpOnly; SameSite=Lax; ...
2. 以降、ブラウザは同じサイトへのリクエストに、自動で Cookie を付ける
   GET /api/todos
   Cookie: session=ランダムな長い文字列
3. サーバーは、Cookie のトークンから sessions テーブルを引いて、誰かを知る
```

Cookie に付ける属性が、安全性を大きく左右します。

| 属性 | 意味 | なぜ付けるか |
| --- | --- | --- |
| `HttpOnly` | JavaScript（`document.cookie`）から読めない | XSS が起きても、トークンを盗まれない |
| `SameSite=Lax` | 別のサイトからの POST などには Cookie を付けない | CSRF（別サイトからのなりすまし操作）を防ぐ |
| `Secure` | HTTPS のときだけ送る | 盗聴を防ぐ。開発中の `http://localhost` では付けない |
| `Path=/` | サイト全体で送る | ― |
| `Max-Age=秒数` | 有効期限 | `0` にすると、ブラウザが Cookie を消す（ログアウト） |

#### トークンも、ハッシュにして保存する

セッションのトークンは、パスワードと同じくらい大事です。トークンを知っていれば、パスワードなしでその人になりすませるからです。

そこで、**DB にはトークンそのものではなく、SHA-256 のハッシュを保存** します。DB やバックアップが漏れても、そこからトークンは分かりません（トークン自体が十分に長いランダムな値なので、こちらは高速な SHA-256 で十分です）。第12章の「バックアップが盗まれたら全部漏れる」への、もう一つの備えです。

#### 認証と認可

- **認証（Authentication）**：「あなたは誰？」を確かめること。Cookie からユーザーを特定します。失敗したら **401**
- **認可（Authorization）**：「その人が、それをしていい？」を確かめること。他人の Todo は触らせません

他人の Todo にアクセスされたとき、403（禁止）ではなく **404** を返します。403 を返すと「その id の Todo は存在する」と教えることになるからです。SQL の `WHERE` に `user_id = ?` を足して、**他人の Todo は「最初からないもの」として扱います**。

#### マイグレーション

今の `db.js` は `CREATE TABLE IF NOT EXISTS todos` で、テーブルが **なければ** 作ります。ところが、すでにある `todos` テーブルに `user_id` 列を足したいとき、この書き方では何もしてくれません。

そこで、DB の変更を **順番に番号を付けて管理** し、まだ適用していないものだけを流す仕組みを作ります。これがマイグレーションです。どこまで適用したかは、SQLite が持っている `PRAGMA user_version`（DB ファイルに保存できる整数）に記録します。

```text
user_version = 0（第7章の DB）
  → マイグレーション 1: todos を作る（IF NOT EXISTS なので、すでにあれば何もしない）
  → マイグレーション 2: users を作る
  → マイグレーション 3: sessions を作る
  → マイグレーション 4: todos に user_id を足す
user_version = 4
```

### ハンズオン

#### 1. マイグレーション：`server/migrations.js`

```js
// server/migrations.js

// 配列の順番がそのままバージョン番号になる。一度リリースしたものは書き換えず、末尾に足していく
export const migrations = [
  // 1: todos（第7章で作ったテーブル。既存の DB でも壊れないよう IF NOT EXISTS）
  `CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  // 2: users
  `CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  // 3: sessions
  `CREATE TABLE sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TEXT    NOT NULL
  )`,
  // 4: todos に持ち主を追加
  `ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users (id) ON DELETE CASCADE`,
];

export function migrate(db) {
  const { user_version: currentVersion } = db.query("PRAGMA user_version").get();

  for (let version = currentVersion; version < migrations.length; version++) {
    db.transaction(() => {
      db.run(migrations[version]);
      // PRAGMA にはプレースホルダーが使えない。中身は自分で作った整数なので安全
      db.run(`PRAGMA user_version = ${version + 1}`);
    })();
    console.log(`マイグレーション ${version + 1} を適用しました`);
  }
}
```

- `REFERENCES users (id)`：**外部キー**。`sessions.user_id` には、`users` に実在する id しか入れられません
- `ON DELETE CASCADE`：ユーザーが消えたら、その人のセッションや Todo も一緒に消えます
- `db.transaction(fn)` は、`fn` を **トランザクションの中で実行する関数** を返します（なので最後に `()` で呼んでいます）。SQL の実行と `user_version` の更新が、両方成功するか、両方なかったことになるかのどちらかになります
- `PRAGMA user_version = ${...}` だけはテンプレートリテラルで組み立てています。`PRAGMA` にはプレースホルダーが使えないからです。入るのは自分で数えた整数なので、インジェクションの心配はありません。**「外から来た値は、絶対に SQL に埋め込まない」というルールは変わりません**

既存の Todo の `user_id` は `NULL` になります。持ち主がいないので、誰の一覧にも出てきません。必要なら、ログイン後に `sqlite3` で `UPDATE todos SET user_id = 1 WHERE user_id IS NULL;` のように自分に付け替えてください。

#### 2. `db.js`：外部キーを有効にして、マイグレーションを流す

```js
// server/db.js
import { Database } from "bun:sqlite";
import { migrate } from "./migrations.js";

export function openDatabase(filename) {
  const db = new Database(filename, { create: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}
```

SQLite は、**外部キーのチェックが標準では無効** です。接続するたびに `PRAGMA foreign_keys = ON` を実行して有効にします。

#### 3. ユーザーのリポジトリ：`server/userRepository.js`

```js
// server/userRepository.js
export function createUserRepository(db) {
  function findByEmail(email) {
    const row = db
      .query("SELECT id, email, password_hash FROM users WHERE email = ?")
      .get(email);
    return row ? { id: row.id, email: row.email, passwordHash: row.password_hash } : null;
  }

  function create({ email, passwordHash }) {
    const row = db
      .query("INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email")
      .get(email, passwordHash);
    return { id: row.id, email: row.email };
  }

  return { findByEmail, create };
}
```

`findByEmail` はログインの照合に使うので `passwordHash` を返しますが、`create` は返しません。**パスワードのハッシュは、必要な場所以外に持ち出さない** ようにしています。

#### 4. セッションのリポジトリ：`server/sessionRepository.js`

```js
// server/sessionRepository.js
const SESSION_DAYS = 7;

// DB にはトークンそのものではなくハッシュを保存する（DB やバックアップが漏れても、なりすましに使えない）
function hashToken(token) {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

export function createSessionRepository(db) {
  function create(userId) {
    const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
      "base64url",
    );
    db.query(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?))`,
    ).run(hashToken(token), userId, `+${SESSION_DAYS} days`);
    return token;
  }

  function findUser(token) {
    const row = db
      .query(
        `SELECT users.id, users.email
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ?
           AND sessions.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
      .get(hashToken(token));
    return row ? { id: row.id, email: row.email } : null;
  }

  function remove(token) {
    db.query("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }

  return { create, findUser, remove, maxAgeSeconds: SESSION_DAYS * 24 * 60 * 60 };
}
```

- **トークンは推測できない乱数で作る**：`crypto.getRandomValues` で 32 バイト（256 ビット）の乱数を作り、URL や Cookie で扱いやすい `base64url` の文字列にしています。`Math.random()` は予測できる場合があるので、セキュリティの用途には使いません
- **`JOIN`**：`sessions` と `users` を、`user_id` と `id` が一致する行どうしでつなげて、1 回の SQL でユーザーまで取ってきます
- **有効期限**：`strftime(..., 'now', '+7 days')` で 7 日後の日時を作り、`expires_at > 今` のセッションだけを有効にしています。ISO 8601 の文字列は、文字列のまま大小を比べられます（第6章）。`'+7 days'` もプレースホルダーで渡しています

#### 5. Cookie の読み書き：`server/cookie.js`

```js
// server/cookie.js
export const SESSION_COOKIE = "session";

export function readCookie(request, name) {
  const header = request.headers.get("cookie") ?? "";
  for (const pair of header.split(";")) {
    const [key, ...valueParts] = pair.trim().split("=");
    if (key === name) {
      return valueParts.join("=");
    }
  }
  return null;
}

export function sessionCookie(token, maxAgeSeconds) {
  const attributes = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  // 本番（HTTPS）では Secure を付けて、暗号化されていない通信では送らないようにする
  if (Bun.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}
```

ブラウザが送ってくる `Cookie` ヘッダーは、`session=abc; theme=dark` のような 1 行の文字列です。`;` で区切って、目的の名前のものを探しています。

> Bun には Cookie を扱う `Bun.CookieMap` も入っていますが、ここでは仕組みを理解するために自分で書きました。

#### 6. 入力チェック：`server/authValidation.js`

```js
// server/authValidation.js
import { HttpError } from "./http.js";

export function parseCredentials(body) {
  const { email, password } = body;
  if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
    throw new HttpError(400, "メールアドレスを正しく入力してください");
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new HttpError(400, "パスワードは 8〜128 文字で入力してください");
  }
  return { email: email.trim().toLowerCase(), password };
}
```

- メールアドレスは小文字にそろえて保存します。`Alice@Example.com` と `alice@example.com` を別人として登録させないためです
- パスワードに **上限** を付けているのは、極端に長いパスワードを送りつけて、重いハッシュ計算でサーバーを疲れさせる攻撃を防ぐためです

#### 7. Todo のリポジトリを「持ち主つき」にする

すべてのメソッドの第 1 引数に `userId` を足し、SQL の `WHERE` に `user_id = ?` を加えます。

```js
// server/todoRepository.js
function toTodo(row) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export function createTodoRepository(db) {
  function findAll(userId) {
    const rows = db
      .query(
        "SELECT id, title, completed, created_at FROM todos WHERE user_id = ? ORDER BY id",
      )
      .all(userId);
    return rows.map(toTodo);
  }

  function findById(userId, id) {
    const row = db
      .query(
        "SELECT id, title, completed, created_at FROM todos WHERE id = ? AND user_id = ?",
      )
      .get(id, userId);
    return row ? toTodo(row) : null;
  }

  function create(userId, { title }) {
    const row = db
      .query(
        "INSERT INTO todos (title, user_id) VALUES (?, ?) RETURNING id, title, completed, created_at",
      )
      .get(title, userId);
    return toTodo(row);
  }

  function update(userId, id, changes) {
    const current = findById(userId, id);
    if (!current) return null;

    const next = { ...current, ...changes };
    const row = db
      .query(
        "UPDATE todos SET title = ?, completed = ? WHERE id = ? AND user_id = ? RETURNING id, title, completed, created_at",
      )
      .get(next.title, next.completed ? 1 : 0, id, userId);
    return toTodo(row);
  }

  function remove(userId, id) {
    const result = db
      .query("DELETE FROM todos WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes > 0;
  }

  return { findAll, findById, create, update, remove };
}
```

第7章で `SELECT *` を使わずに列を書いておいたので、`user_id` 列が増えても、API のレスポンスに `user_id` が紛れ込むことはありません。

> メモリ版のリポジトリ（`inMemoryTodoRepository.js`）は、ここで役目を終えます。削除して、テストも SQLite 版だけにします（手順 10）。メモリ版も `userId` に対応させる、という練習をしてもかまいません。

#### 8. `app.js`：認証の API と、Todo API の保護

```js
// server/app.js
import { parseCredentials } from "./authValidation.js";
import { SESSION_COOKIE, readCookie, sessionCookie } from "./cookie.js";
import { HttpError, errorResponse, methodNotAllowed, readJsonBody } from "./http.js";
import { serveStatic } from "./static.js";
import { parseNewTodo, parseTodoChanges } from "./todoValidation.js";

// /api/todos/123 にマッチして、123 の部分を取り出す
const TODO_PATH = /^\/api\/todos\/(\d+)$/;

export function createApp({
  todoRepository,
  userRepository,
  sessionRepository,
  publicDir = "public",
}) {
  // Cookie のセッションからログイン中のユーザーを取り出す。いなければ 401
  function requireUser(request) {
    const token = readCookie(request, SESSION_COOKIE);
    const user = token ? sessionRepository.findUser(token) : null;
    if (!user) {
      throw new HttpError(401, "ログインしてください");
    }
    return user;
  }

  function startSession(user, status) {
    const token = sessionRepository.create(user.id);
    return Response.json(
      { id: user.id, email: user.email },
      {
        status,
        headers: { "Set-Cookie": sessionCookie(token, sessionRepository.maxAgeSeconds) },
      },
    );
  }

  // /api/users（新規登録）
  async function handleUsers(request) {
    if (request.method !== "POST") {
      throw methodNotAllowed(["POST"]);
    }
    const { email, password } = parseCredentials(await readJsonBody(request));
    if (userRepository.findByEmail(email)) {
      throw new HttpError(409, "このメールアドレスは登録済みです");
    }
    const passwordHash = await Bun.password.hash(password);
    const user = userRepository.create({ email, passwordHash });
    return startSession(user, 201);
  }

  // /api/session（ログイン状態の確認・ログイン・ログアウト）
  async function handleSession(request) {
    switch (request.method) {
      case "GET":
        return Response.json(requireUser(request));
      case "POST": {
        const { email, password } = parseCredentials(await readJsonBody(request));
        const user = userRepository.findByEmail(email);
        const isValid = user !== null && (await Bun.password.verify(password, user.passwordHash));
        if (!isValid) {
          // どちらが違うのかは教えない（登録済みのメールアドレスを探られないように）
          throw new HttpError(401, "メールアドレスかパスワードが違います");
        }
        return startSession(user, 200);
      }
      case "DELETE": {
        const token = readCookie(request, SESSION_COOKIE);
        if (token) {
          sessionRepository.remove(token);
        }
        return new Response(null, {
          status: 204,
          headers: { "Set-Cookie": sessionCookie("", 0) },
        });
      }
      default:
        throw methodNotAllowed(["GET", "POST", "DELETE"]);
    }
  }

  // /api/todos
  async function handleTodos(request, user) {
    switch (request.method) {
      case "GET":
        return Response.json(todoRepository.findAll(user.id));
      case "POST": {
        const body = await readJsonBody(request);
        const todo = todoRepository.create(user.id, parseNewTodo(body));
        return Response.json(todo, {
          status: 201,
          headers: { Location: `/api/todos/${todo.id}` },
        });
      }
      default:
        throw methodNotAllowed(["GET", "POST"]);
    }
  }

  // /api/todos/:id
  async function handleTodo(request, user, id) {
    switch (request.method) {
      case "GET": {
        const todo = todoRepository.findById(user.id, id);
        if (!todo) throw notFoundTodo(id);
        return Response.json(todo);
      }
      case "PATCH": {
        const body = await readJsonBody(request);
        const todo = todoRepository.update(user.id, id, parseTodoChanges(body));
        if (!todo) throw notFoundTodo(id);
        return Response.json(todo);
      }
      case "DELETE": {
        const deleted = todoRepository.remove(user.id, id);
        if (!deleted) throw notFoundTodo(id);
        return new Response(null, { status: 204 });
      }
      default:
        throw methodNotAllowed(["GET", "PATCH", "DELETE"]);
    }
  }

  return async function handleRequest(request) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/api/users") {
        return await handleUsers(request);
      }
      if (pathname === "/api/session") {
        return await handleSession(request);
      }
      if (pathname === "/api/todos") {
        return await handleTodos(request, requireUser(request));
      }
      const match = pathname.match(TODO_PATH);
      if (match) {
        return await handleTodo(request, requireUser(request), Number(match[1]));
      }
      if (pathname.startsWith("/api/")) {
        throw new HttpError(404, "API が見つかりません");
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        throw methodNotAllowed(["GET", "HEAD"]);
      }
      return await serveStatic(publicDir, pathname);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

function notFoundTodo(id) {
  return new HttpError(404, `id: ${id} の Todo は見つかりません`);
}

function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.message, error.headers);
  }
  console.error(error);
  return errorResponse(500, "サーバーでエラーが発生しました");
}
```

読みどころは 4 つです。

- **`requireUser` を、Todo のルートの入口で呼んでいる**：ログインしていなければ、Todo の処理に入る前に 401 で終わります。各ハンドラーは、受け取った `user` を信じて使うだけです
- **ログイン失敗のメッセージを 1 つにしている**：「そのメールアドレスは登録されていません」と返すと、どのメールアドレスが登録済みかを調べられてしまいます
- **新規登録しても、同時にログインさせている**：登録したあと、もう一度ログイン画面で入力させないためです
- **ログアウトでは、DB のセッションを消してから、`Max-Age=0` の Cookie を返す**：ブラウザの Cookie が消えるだけでなく、サーバー側でもトークンを無効にします。万一トークンが残っていても、もう使えません

#### 9. `server.js`：リポジトリを 3 つ渡す

```diff
 // server.js
 import { createApp } from "./server/app.js";
 import { openDatabase } from "./server/db.js";
+import { createSessionRepository } from "./server/sessionRepository.js";
 import { createTodoRepository } from "./server/todoRepository.js";
+import { createUserRepository } from "./server/userRepository.js";

 const port = Number(Bun.env.PORT ?? 3000);
 const db = openDatabase(Bun.env.DB_PATH ?? "todo.sqlite");
-const app = createApp({ todoRepository: createTodoRepository(db) });
+const app = createApp({
+  todoRepository: createTodoRepository(db),
+  userRepository: createUserRepository(db),
+  sessionRepository: createSessionRepository(db),
+});
```

#### 10. テストを書き直す

メモリ版のリポジトリを消します。

```sh
git rm server/inMemoryTodoRepository.js
```

`test/todoRepository.test.js` を、「他人の Todo に触れない」ことを確かめるテストに書き換えます。

```js
// test/todoRepository.test.js
import { beforeEach, expect, test } from "bun:test";
import { openDatabase } from "../server/db.js";
import { createTodoRepository } from "../server/todoRepository.js";
import { createUserRepository } from "../server/userRepository.js";

let todoRepository;
let alice;
let bob;

beforeEach(() => {
  const db = openDatabase(":memory:");
  const userRepository = createUserRepository(db);
  todoRepository = createTodoRepository(db);
  alice = userRepository.create({ email: "alice@example.com", passwordHash: "x" });
  bob = userRepository.create({ email: "bob@example.com", passwordHash: "x" });
});

test("自分の Todo だけが一覧に出る", () => {
  todoRepository.create(alice.id, { title: "Alice の Todo" });
  todoRepository.create(bob.id, { title: "Bob の Todo" });

  expect(todoRepository.findAll(alice.id).map((todo) => todo.title)).toEqual([
    "Alice の Todo",
  ]);
});

test("他人の Todo は更新も削除もできない", () => {
  const { id } = todoRepository.create(alice.id, { title: "Alice の Todo" });

  expect(todoRepository.update(bob.id, id, { completed: true })).toBeNull();
  expect(todoRepository.remove(bob.id, id)).toBe(false);
  expect(todoRepository.findById(alice.id, id).completed).toBe(false);
});
```

`test/app.test.js` は、Cookie を扱えるようにして書き直します。

```js
// test/app.test.js
import { beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/db.js";
import { createSessionRepository } from "../server/sessionRepository.js";
import { createTodoRepository } from "../server/todoRepository.js";
import { createUserRepository } from "../server/userRepository.js";

let app;

beforeEach(() => {
  const db = openDatabase(":memory:");
  app = createApp({
    todoRepository: createTodoRepository(db),
    userRepository: createUserRepository(db),
    sessionRepository: createSessionRepository(db),
  });
});

function request(method, path, { body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  return app(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

// Set-Cookie から「session=...」の部分だけを取り出す
function cookieFrom(response) {
  return response.headers.get("Set-Cookie").split(";")[0];
}

async function signUp(email) {
  const response = await request("POST", "/api/users", {
    body: { email, password: "password123" },
  });
  return cookieFrom(response);
}

describe("認証", () => {
  test("新規登録すると 201 とセッション Cookie を返す", async () => {
    const response = await request("POST", "/api/users", {
      body: { email: "Alice@Example.com", password: "password123" },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ email: "alice@example.com" });
    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  test("同じメールアドレスでは登録できない", async () => {
    await signUp("alice@example.com");

    const response = await request("POST", "/api/users", {
      body: { email: "alice@example.com", password: "password123" },
    });

    expect(response.status).toBe(409);
  });

  test("パスワードが違うとログインできない", async () => {
    await signUp("alice@example.com");

    const response = await request("POST", "/api/session", {
      body: { email: "alice@example.com", password: "wrong-password" },
    });

    expect(response.status).toBe(401);
  });

  test("ログインした Cookie で自分の情報を取れる", async () => {
    await signUp("alice@example.com");
    const login = await request("POST", "/api/session", {
      body: { email: "alice@example.com", password: "password123" },
    });

    const response = await request("GET", "/api/session", { cookie: cookieFrom(login) });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ email: "alice@example.com" });
  });

  test("ログアウトすると、その Cookie はもう使えない", async () => {
    const cookie = await signUp("alice@example.com");

    const logout = await request("DELETE", "/api/session", { cookie });
    expect(logout.status).toBe(204);
    expect(logout.headers.get("Set-Cookie")).toContain("Max-Age=0");

    const response = await request("GET", "/api/todos", { cookie });
    expect(response.status).toBe(401);
  });
});

describe("Todo の認可", () => {
  test("ログインしていなければ 401", async () => {
    const response = await request("GET", "/api/todos");

    expect(response.status).toBe(401);
  });

  test("他人の Todo は 404 になる（存在すら教えない）", async () => {
    const alice = await signUp("alice@example.com");
    const bob = await signUp("bob@example.com");
    const created = await (
      await request("POST", "/api/todos", { cookie: alice, body: { title: "Alice の Todo" } })
    ).json();

    const response = await request("PATCH", `/api/todos/${created.id}`, {
      cookie: bob,
      body: { completed: true },
    });

    expect(response.status).toBe(404);
    expect(await (await request("GET", "/api/todos", { cookie: bob })).json()).toEqual([]);
  });
});
```

マイグレーションのテストも足します。**第7章時点の DB（`todos` だけ・`user_version` が 0）から、最新まで移行できること** を確かめます。

```js
// test/migrations.test.js
import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate, migrations } from "../server/migrations.js";

test("第7章の DB（todos だけ・user_version 0）を最新まで移行できる", () => {
  const db = new Database(":memory:");
  db.run(`CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`);
  db.run("INSERT INTO todos (title) VALUES ('既存の Todo')");

  migrate(db);

  expect(db.query("PRAGMA user_version").get().user_version).toBe(migrations.length);
  const columns = db.query("PRAGMA table_info(todos)").all().map((column) => column.name);
  expect(columns).toContain("user_id");
  expect(db.query("SELECT title, user_id FROM todos").get()).toEqual({
    title: "既存の Todo",
    user_id: null,
  });
});

test("2回実行しても何も起きない", () => {
  const db = new Database(":memory:");
  migrate(db);
  migrate(db);

  expect(db.query("PRAGMA user_version").get().user_version).toBe(migrations.length);
});
```

```sh
bun test
# 11 pass / 0 fail
```

> 第10章で書いた入力チェック（400・415 など）のテストは、ここで一度なくなりました。**課題 13-2** で、ログインした状態のテストとして書き戻してください。

#### 11. フロントエンド：ログイン画面とログアウト

フロントエンドの `fetch` 処理を、Todo 用とセッション用で共有できるように分けます。

```js
// public/src/api/request.js
export async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    // サーバーが返した { error: { message } } を取り出す（取れなければステータスで代用）
    const errorBody = await response.json().catch(() => null);
    const error = new Error(errorBody?.error?.message ?? `HTTP ${response.status}`);
    // 呼び出し側で「401 ならログイン画面へ」などと分岐できるように、ステータスを持たせておく
    error.status = response.status;
    throw error;
  }

  // 204 No Content には本文がないので、json() を呼ばない
  if (response.status === 204) {
    return null;
  }
  return await response.json();
}
```

```js
// public/src/api/todoApi.js
import { request } from "./request.js";

export const todoApi = {
  fetchAll() {
    return request("/api/todos");
  },
  create({ title }) {
    return request("/api/todos", { method: "POST", body: { title } });
  },
  update({ id, completed }) {
    return request(`/api/todos/${id}`, { method: "PATCH", body: { completed } });
  },
  remove({ id }) {
    return request(`/api/todos/${id}`, { method: "DELETE" });
  },
};
```

```js
// public/src/api/sessionApi.js
import { request } from "./request.js";

export const sessionApi = {
  logout() {
    return request("/api/session", { method: "DELETE" });
  },
};
```

`App.js` には、ログアウトボタンと「401 ならログイン画面へ」を足します。ログアウトボタンのリスナーも、`mount` で付けて `unmount` で外す、js-primer と同じ作法です。

```diff
 // public/src/App.js
+import { sessionApi } from "./api/sessionApi.js";
 import { TodoListModel } from "./model/TodoListModel.js";
 ...
   #errorElement = document.querySelector("#js-error");
+  #logoutButtonElement = document.querySelector("#js-logout");
+  #logoutEventListener = () => {
+    this.handleLogout();
+  };
 ...
+  async handleLogout() {
+    try {
+      await sessionApi.logout();
+      window.location.href = "/login.html";
+    } catch (error) {
+      this.#showError(error);
+    }
+  }
+
   #showError(error) {
+    // ログインしていない（セッション切れも含む）ならログイン画面へ
+    if (error.status === 401) {
+      window.location.href = "/login.html";
+      return;
+    }
     console.error(error);
 ...
   mount() {
     this.#todoListModel.onChange(this.#todoListModelChangeListener);
     this.#formElement.addEventListener("submit", this.#submitEventListener);
+    this.#logoutButtonElement.addEventListener("click", this.#logoutEventListener);
     this.handleLoad();
   }

   unmount() {
     this.#formElement.removeEventListener("submit", this.#submitEventListener);
+    this.#logoutButtonElement.removeEventListener("click", this.#logoutEventListener);
     this.#todoListModel.offChange(this.#todoListModelChangeListener);
   }
```

```diff
 <!-- public/index.html -->
       <footer class="footer">
         <span id="js-todo-count">Todoアイテム数: 0</span>
+        <button id="js-logout" class="logout" type="button">ログアウト</button>
       </footer>
```

ログイン画面は、別のページとして作ります。

```html
<!-- public/login.html -->
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>ログイン - Todo App</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <div class="todoapp">
      <form id="js-login-form" class="login-form">
        <input
          name="email"
          class="new-todo"
          type="email"
          placeholder="メールアドレス"
          autocomplete="username"
          required
        />
        <input
          name="password"
          class="new-todo"
          type="password"
          placeholder="パスワード（8文字以上）"
          autocomplete="current-password"
          minlength="8"
          required
        />
        <button type="submit" name="mode" value="login">ログイン</button>
        <button type="submit" name="mode" value="signup">新規登録</button>
      </form>
      <p id="js-error" class="error" role="alert"></p>
    </div>
    <script src="./login.js" type="module"></script>
  </body>
</html>
```

```js
// public/login.js
const formElement = document.querySelector("#js-login-form");
const errorElement = document.querySelector("#js-error");

formElement.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(formElement);
  // どちらのボタンで送信したか（login / signup）
  const mode = event.submitter.value;
  const path = mode === "signup" ? "/api/users" : "/api/session";

  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error?.message ?? `HTTP ${response.status}`);
    }
    // Cookie はブラウザが自動で保存するので、あとはトップページへ移動するだけ
    window.location.href = "/";
  } catch (error) {
    console.error(error);
    errorElement.textContent = error.message;
  }
});
```

- `new FormData(formElement)` で、フォームの入力値を `name` 属性ごとに取り出せます。以前「form から値は取れる？」で話した方法です
- `event.submitter` は、**どのボタンで送信されたか** です。1 つのフォームで「ログイン」と「新規登録」を分けています
- `autocomplete="username"` / `"current-password"` を付けると、ブラウザのパスワードマネージャーが正しく働きます

最後に CSS を足します。

```css
/* public/index.css の末尾に追加 */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout {
  color: var(--color-text-muted);
  font-size: 13px;
}

.login-form {
  display: grid;
  gap: 12px;
}

/* Todo 入力欄用の「+」アイコンは、ログインフォームでは出さない */
.todoapp .login-form::before {
  content: none;
}

.login-form .new-todo {
  padding-left: 16px;
}

.login-form button {
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-field);
}
```

`.login-form::before` ではなく `.todoapp .login-form::before` と書いているのは、既存の `.todoapp form::before` より **詳細度** を高くして、確実に上書きするためです（`.login-form::before` だけだと負けて、アイコンが消えません）。

### 動作確認

#### curl で一周する

curl は `-c ファイル` で受け取った Cookie を保存し、`-b ファイル` で送ります。ブラウザがやっていることを、手で再現できます。

`cookies.txt` にはセッションのトークンが入るので、**先に `.gitignore` に足しておきます**。

```sh
echo "cookies.txt" >> .gitignore
```

```sh
B=http://localhost:3000

# 新規登録（Cookie を cookies.txt に保存）
curl -i -c cookies.txt -X POST $B/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
# 201、Set-Cookie: session=...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800

# Cookie を付けて Todo を追加・一覧
curl -b cookies.txt -X POST $B/api/todos \
  -H "Content-Type: application/json" -d '{"title":"Alice の Todo"}'
curl -b cookies.txt $B/api/todos

# Cookie なしでは 401
curl -i $B/api/todos

# ログアウト（-c で、消された Cookie を cookies.txt にも反映する）
curl -i -b cookies.txt -c cookies.txt -X DELETE $B/api/session   # 204
curl -i -b cookies.txt $B/api/todos                              # 401
```

DB の中も見ておきます。

```sh
sqlite3 todo.sqlite "SELECT id, email, password_hash FROM users"
sqlite3 todo.sqlite "SELECT token_hash, user_id, expires_at FROM sessions"
```

`password_hash` が `$argon2id$...` で始まっていること、`sessions` にはトークンそのものではなくハッシュが入っていることを確かめてください。

#### ブラウザで一周する

1. `http://localhost:3000/` を開く → ログインしていないので `login.html` に移動する
2. メールアドレスとパスワードを入れて「新規登録」 → Todo 画面に移動する
3. Todo を追加して、「ログアウト」 → ログイン画面に戻る
4. 同じメールアドレスとパスワードで「ログイン」 → さっきの Todo が表示される
5. 開発者ツールの **Application** タブ →  **Cookies** で、`session` に `HttpOnly` のチェックが付いていることを確かめる。Console で `document.cookie` と打っても、`session` は出てきません

サーバーのログを見ると、ログインの `POST /api/session` だけ数十ミリ秒かかっているはずです。`Bun.password.verify` が、わざと遅く作られているからです。

### 課題 13-1：別のユーザーで試す

ブラウザでは `alice@example.com`、curl では `bob@example.com` で登録して、それぞれの Todo が混ざらないことを確かめてください。curl から、Alice の Todo の id を指定して PATCH するとどうなりますか？

<details>
<summary>答え</summary>

404 になります。SQL の `WHERE id = ? AND user_id = ?` で、Bob の `user_id` では Alice の Todo が見つからないからです。「他人の Todo は、最初からないもの」として扱われます。

</details>

### 課題 13-2：第10章のテストを書き戻す

手順 10 で消えた、入力チェックのテスト（タイトルが空なら 400、壊れた JSON なら 400、`Content-Type` がなければ 415、存在しない id なら 404 など）を、**ログインした Cookie を付けた形** で `test/app.test.js` に書き戻してください。

<details>
<summary>ヒント</summary>

`signUp` で Cookie を作り、`request(..., { cookie, body })` で送ります。

```js
describe("Todo の入力チェック", () => {
  let cookie;

  beforeEach(async () => {
    cookie = await signUp("alice@example.com");
  });

  test("title が空なら 400 を返す", async () => {
    const response = await request("POST", "/api/todos", { cookie, body: { title: "  " } });

    expect(response.status).toBe(400);
  });

  // 残りも同じ要領で
});
```

`beforeEach` は、外側の `describe` にあるもの（DB の作り直し）から先に実行されます。

</details>

### 理解度チェック

<details>
<summary>Q1. パスワードを SHA-256 ではなく、argon2id でハッシュ化するのはなぜですか？</summary>

SHA-256 は速すぎて、漏れたハッシュから総当たりでパスワードを探す攻撃が現実的な時間でできてしまうからです。argon2id はパスワード専用で、わざと計算に時間とメモリがかかるように作られています。ソルトも自動で入ります。

</details>

<details>
<summary>Q2. セッションのトークンは、なぜ SHA-256 のハッシュで保存してよいのですか？</summary>

トークンは 256 ビットの乱数で、総当たりでは見つけられないほど長いからです。人が覚えるパスワードと違って推測できないので、遅いハッシュ関数は不要です。ハッシュで保存しておけば、DB やバックアップが漏れても、トークンそのものは分かりません。

</details>

<details>
<summary>Q3. 認証と認可の違いは何ですか？ それぞれ失敗したら何を返しますか？</summary>

認証は「あなたは誰か」を確かめること（失敗したら 401）、認可は「その人がその操作をしてよいか」を確かめること（今回は、他人の Todo を 404 として扱う）です。

</details>

<details>
<summary>Q4. Cookie に <code>HttpOnly</code> を付けると、何から守れますか？</summary>

XSS です。万一 XSS が起きて攻撃者のスクリプトが動いても、`document.cookie` からセッションのトークンを読み出せません。

</details>

<details>
<summary>Q5. <code>CREATE TABLE IF NOT EXISTS</code> だけでは、なぜ足りなくなったのですか？</summary>

テーブルが「なければ作る」だけで、すでにあるテーブルに列を足すことができないからです。DB の変更を順番に記録して、未適用のものだけを流すマイグレーションが必要になりました。

</details>

### Rails / Next.js だと

| この章で書いたもの | Rails | Next.js |
| --- | --- | --- |
| `migrations.js` と `PRAGMA user_version` | `db/migrate/*.rb` と `schema_migrations` テーブル | `prisma migrate` と `_prisma_migrations` テーブル |
| `Bun.password.hash` / `verify` | `has_secure_password`（bcrypt） | Auth.js などの認証ライブラリ |
| `sessions` テーブル + Cookie | Rails 標準のセッションは **Cookie の中に暗号化して保存**（CookieStore）。DB に置くなら `activerecord-session_store` | Auth.js の Database セッション、または JWT |
| `requireUser` | `before_action :authenticate_user!`（Devise） | Middleware や、各 Route Handler の先頭でのチェック |
| `WHERE user_id = ?` | `current_user.todos.find(params[:id])` | `where: { id, userId: session.user.id }` |
| `SameSite=Lax` / `HttpOnly` | Rails が標準で付ける | ライブラリが標準で付ける |

Rails で `Todo.find(params[:id])` ではなく `current_user.todos.find(params[:id])` と書くのは、まさにこの章の「`WHERE user_id = ?`」をするためです。これを忘れると、id を書き換えるだけで他人のデータを見られてしまいます（IDOR と呼ばれる、実際によくある脆弱性です）。

### コミット

```sh
git add .
git commit -m "feat: ユーザー登録・ログイン・ログアウトを追加"
```

---

## 第14章 発展：デプロイの考え方

> この章は、手順書ではなく **考え方の整理** です。デプロイ先のサービスは、料金や仕様がよく変わります。具体的な手順は、選んだサービスの最新の公式ドキュメントに従ってください。

### この章のゴール

- 自分の PC で動いているアプリを、インターネットに公開するときに **何が変わるか** を説明できる
- SQLite のアプリをデプロイするときの、特有の注意点が分かる
- デプロイ前に確かめることを、チェックリストにできる

### 解説

#### ローカルと本番で変わること

| 項目 | ローカル（今） | 本番 |
| --- | --- | --- |
| 動いている時間 | 自分が `bun run dev` している間だけ | 24 時間。落ちたら自動で再起動してほしい |
| URL | `http://localhost:3000` | `https://todo.example.com`（ドメイン・DNS） |
| 通信 | 暗号化なし（HTTP） | **HTTPS が必須**。Cookie に `Secure` を付ける |
| 設定 | `.env` やデフォルト値 | サービスの管理画面で環境変数を設定する |
| データ | 手元の `todo.sqlite` | **消えない場所** に置く必要がある |
| ログ | ターミナルに出る | サービスのログ画面で見る |
| バックアップ | 手で `bun run backup` | 定期的に自動で取り、別の場所にも保存する |

#### SQLite ならではの注意点

SQLite は 1 つのファイルなので、**そのファイルが消えない場所に置けるか** が一番の問題になります。

多くの PaaS（コードを渡すと動かしてくれるサービス）は、標準ではファイルシステムが **一時的** です。再デプロイや再起動のたびに、まっさらな状態に戻ります。そこに `todo.sqlite` を置くと、**デプロイのたびにデータが全部消えます**。

選択肢は、大きく 3 つです。

| 選択肢 | やること | 向いている場面 |
| --- | --- | --- |
| A. 永続ボリュームを付けられる PaaS | ボリューム（消えないディスク）を付けて、`DB_PATH` をそこに向ける | 手軽に公開したい。サーバーは 1 台で足りる |
| B. VPS（仮想サーバーを 1 台借りる） | OS の上に Bun を入れ、HTTPS を受けるリバースプロキシ（Caddy など）を前に置き、プロセスの管理（systemd など）も自分でする | インフラを丸ごと学びたい |
| C. DB を別のサービスにする | SQLite 互換のマネージド DB や PostgreSQL に移す | サーバーを複数台にしたい。DB の運用を任せたい |

C を選ぶ場合、変えるのは **リポジトリ（と `db.js`）だけ** です。第5章で「保存の仕方」をリポジトリに閉じ込めておいたことが、ここで効いてきます。`app.js` もフロントエンドも、そのまま使えます。

> SQLite のファイルは、1 台のマシンのディスクにあります。そのため、アクセスが増えたときに「同じアプリを複数台に増やす」ことが、そのままではできません。個人用の Todo アプリなら、1 台で十分です。

#### デプロイ前のチェックリスト

- [ ] `bun test` がすべて通る
- [ ] `NODE_ENV=production` を設定し、Cookie に `Secure` が付く（第13章）
- [ ] `PORT` を環境変数から読んでいる（多くの PaaS は、使うポートを `PORT` で渡してきます）
- [ ] `DB_PATH` が、消えない場所（ボリューム）を指している
- [ ] HTTPS でしかアクセスできない（HTTP は HTTPS へリダイレクトされる）
- [ ] 500 のときに、エラーの中身がレスポンスに出ない（第4章）
- [ ] バックアップを定期的に取り、**サーバーとは別の場所** にも保存している（第12章）
- [ ] 一度、バックアップからの復元を試した
- [ ] `.env`・`*.sqlite`・`backups/`・`cookies.txt` がリポジトリに入っていない

### 理解度チェック

<details>
<summary>Q1. ファイルシステムが一時的な PaaS に、そのまま SQLite のアプリをデプロイすると何が起きますか？</summary>

再デプロイや再起動のたびに `todo.sqlite` が消えて、データがすべてなくなります。永続ボリュームを付けるか、DB を別のサービスに移す必要があります。

</details>

<details>
<summary>Q2. 本番で <code>Secure</code> 属性を付けないと、何が困りますか？</summary>

HTTP（暗号化なし）の通信でも Cookie が送られてしまい、通信を盗聴されるとセッションのトークンを盗まれる恐れがあります。

</details>

### Rails / Next.js だと

- Rails 8 は、SQLite を本番で使う構成（Solid Queue・Solid Cache など）や、Kamal によるデプロイを標準で用意しています。「SQLite のファイルを、消えない場所に置く」という考え方は同じです
- Next.js は Vercel にデプロイすることが多いですが、Vercel のサーバーレス関数にはファイルを永続化する場所がないので、DB は外部のサービス（PostgreSQL など）を使います

---

## おわりに

ここまで進めると、次のことを、フレームワークなしで自分の手で書いたことになります。

- HTTP のリクエストを受けて、正しいステータスコードでレスポンスを返す
- URL とメソッドで処理を振り分け、エラーを 1 か所で受け止める
- 入力を疑い、すべての想定外を 4xx にする
- SQL を書き、プレースホルダーでインジェクションを防ぐ
- テストで、壊れていないことを数秒で確かめる
- バックアップを正しく取り、復元できることを確かめる
- パスワードをハッシュ化し、Cookie とセッションで利用者を見分ける

Rails の `resources :todos` 1 行、`has_secure_password` 1 行、Next.js の `route.ts` 1 ファイルが、裏で何をしてくれているのか、今なら説明できるはずです。

次の題材として、家計簿アプリのように **自分でテーブルを設計する** ものに挑戦すると、この教材で扱わなかった「複数のテーブルの関係」「集計（`GROUP BY`）」「インデックス」などに自然と出会えます。

---

## 付録 A　Rails / Next.js との対応表

| この教材 | 章 | Rails | Next.js |
| --- | --- | --- | --- |
| `Bun.serve` の `fetch` | 2 | Puma + Rack | Next.js のサーバー |
| `Request` / `Response` | 2 | `request` / `render json:` | 同じ Web 標準の `Request` / `Response` |
| `public/` と `serveStatic` | 3 | `public/`（本番は Nginx / CDN） | `public/` |
| `handleRequest` のルーティング | 4 | `config/routes.rb` | `app/` のフォルダ構成 |
| `handleTodos` の `switch` | 4 | コントローラーのアクション | `route.ts` の `GET` / `POST` |
| `HttpError` と `toErrorResponse` | 4 | `rescue_from`、例外 → ステータスの変換 | `try/catch`、`notFound()` |
| リポジトリ | 5・7 | Active Record のモデル | Prisma / Drizzle |
| `parseNewTodo` | 5・9 | Strong Parameters + `validates` | zod |
| DB の制約 | 6 | マイグレーションの `null: false` など | Prisma のスキーマ |
| `toTodo`（変換） | 7 | （Ruby は snake_case のまま） | `@map` |
| プレースホルダー | 7 | `where("x = ?", v)` / ハッシュ条件 | Prisma は自動 |
| `todoApi.js` | 8 | （Turbo のフォーム送信） | TanStack Query など |
| ログのミドルウェア | 9 | Rails のリクエストログ | `middleware.ts` |
| `bun test` | 10 | RSpec / Minitest | Jest / Vitest |
| 環境変数（`Bun.env`） | 11 | `ENV`・credentials | `process.env`・`.env.local` |
| `scripts/backup.js` | 12 | `pg_dump` など | ― |
| `migrations.js` | 13 | `db/migrate` + `schema_migrations` | `prisma migrate` |
| `Bun.password` | 13 | `has_secure_password` | Auth.js など |
| `requireUser` | 13 | `before_action :authenticate_user!` | Middleware |
| `WHERE user_id = ?` | 13 | `current_user.todos` | `where: { userId }` |

---

## 付録 B　curl・sqlite3 チートシート

### curl

| やりたいこと | コマンド |
| --- | --- |
| GET | `curl http://localhost:3000/api/todos` |
| ステータスとヘッダーも見る | `curl -i URL` |
| ヘッダーだけ見る | `curl -I URL` |
| 送ったリクエストも見る | `curl -v URL` |
| メソッドを指定する | `curl -X DELETE URL` |
| JSON を送る | `curl -X POST URL -H "Content-Type: application/json" -d '{"title":"a"}'` |
| ファイルの中身を送る | `curl -X POST URL --data-binary @file.json` |
| `../` をそのまま送る | `curl --path-as-is URL` |
| ステータスコードだけ表示する | `curl -s -o /dev/null -w '%{http_code}\n' URL` |
| Cookie を保存する / 送る | `curl -c cookies.txt URL` / `curl -b cookies.txt URL` |

### sqlite3

| やりたいこと | コマンド |
| --- | --- |
| DB を開く | `sqlite3 todo.sqlite` |
| 1 回だけ SQL を実行する | `sqlite3 todo.sqlite "SELECT * FROM todos"` |
| 見やすく表示する | `.headers on` と `.mode box` |
| テーブルの一覧 | `.tables` |
| テーブルの定義 | `.schema todos` |
| 列の一覧 | `PRAGMA table_info(todos);` |
| バックアップ | `.backup backups/todo.sqlite` |
| SQL として書き出す | `sqlite3 todo.sqlite .dump > dump.sql` |
| 壊れていないか確認する | `PRAGMA integrity_check;` |
| マイグレーションのバージョン | `PRAGMA user_version;` |
| 抜ける | `.quit` |

---

## 付録 C　HTTP ステータスコード早見表（この教材で使うもの）

| コード | 名前 | いつ使ったか |
| --- | --- | --- |
| 200 | OK | 取得・更新の成功 |
| 201 | Created | 作成の成功（`Location` ヘッダー付き） |
| 204 | No Content | 削除・ログアウトの成功（本文なし） |
| 400 | Bad Request | 入力が正しくない |
| 401 | Unauthorized | ログインしていない・パスワードが違う |
| 404 | Not Found | URL がない・Todo がない・他人の Todo |
| 405 | Method Not Allowed | URL はあるが、そのメソッドは使えない（`Allow` ヘッダー付き） |
| 409 | Conflict | 登録済みのメールアドレス |
| 413 | Payload Too Large | ボディが大きすぎる（Bun が返す） |
| 415 | Unsupported Media Type | `Content-Type` が JSON ではない |
| 500 | Internal Server Error | サーバーのバグ（中身は見せない） |

---

## 付録 D　トラブルシューティング

#### `error: Failed to start server. Is port 3000 in use?`

すでに別のプロセスが 3000 番を使っています。前に起動したサーバーが、別のターミナルで動いたままになっていることが多いです。

```sh
lsof -i :3000        # 使っているプロセスの PID を調べる
kill <PID>           # 止める
```

または、`PORT=3001 bun run dev` で別のポートを使います。

#### `zsh: no matches found: todo.sqlite*`

zsh は、`*` に当てはまるファイルが 1 つもないとエラーにします。まだ DB ファイルがない（サーバーを一度も起動していない、など）という意味です。

#### ブラウザに古い JavaScript が残っている

ブラウザがファイルをキャッシュしていることがあります。`Cmd + Shift + R` で強制的に再読み込みするか、開発者ツールの Network タブで **Disable cache** にチェックを入れたまま作業します。

#### コンソールに `Failed to load module script: ... MIME type of "application/json"`

`import` しているファイルのパスが間違っていて、サーバーが 404 の JSON を返しています。Network タブで、どのファイルが 404 になっているかを確かめてください（js-primer-todo で `./view/html-util.js` のパスを間違えたときと同じ種類のミスです）。

#### API が 500 を返すが、理由が分からない

500 のときは、わざとレスポンスに中身を出していません（第4章）。**サーバーを起動しているターミナル** に、`console.error` で出したエラーとスタックトレースがあります。

#### `SQLiteError: database is locked`

別のプロセスが DB に書き込み中で、ロックが取れなかったという意味です。`sqlite3` で `BEGIN;` したまま `COMMIT;` や `ROLLBACK;` をしていないことがよくあります。`sqlite3` のセッションを終了するか、トランザクションを閉じてください。

#### `SQLiteError: no such table: todos`

開いている DB ファイルが、思っているものと違う可能性があります。`DB_PATH` の値や、`sqlite3` を実行しているディレクトリを確かめてください。SQLite は、存在しないファイル名を指定すると、**空の DB を新しく作ってしまいます**。

#### テストが、単独では通るのに、まとめて実行すると失敗する

テスト同士でデータを共有しています。`beforeEach` で、テストごとに `openDatabase(":memory:")` から作り直しているかを確かめてください。
