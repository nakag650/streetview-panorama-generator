# 🌍 ストリートビューパノラマ生成ツール

Google Maps APIを使用して、指定された地点のストリートビューから360度パノラマ画像を生成するWebアプリケーションです。

## ✨ 機能

- 🗺️ **地図クリックで地点選択**: Google Maps上でクリックして地点を選択
- 🎯 **8方向画像取得**: 指定地点から8方向（45度間隔）のストリートビュー画像を取得
- 🖼️ **パノラマ合成**: 取得した画像を横に結合して5120x640ピクセルの水平パノラマを生成
- 💾 **PNG形式保存**: 高品質なPNG形式でローカルに保存
- 📱 **レスポンシブデザイン**: モバイルデバイスにも対応
- 📚 **生成履歴**: 過去に生成したパノラマの一覧表示
- ⬇️ **ダウンロード機能**: 生成されたパノラマ画像のダウンロード
- 🔒 **セキュアなAPIキー管理**: サーバーサイドでAPIキーを安全に管理

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Maps APIキーの取得

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 以下のAPIを有効化：
   - **Maps JavaScript API**
   - **Street View Static API**
4. 認証情報でAPIキーを作成
5. APIキーに適切な制限を設定（推奨）

### 3. 環境変数の設定

`env.example`をコピーして`.env`ファイルを作成：

```bash
cp env.example .env
```

`.env`ファイルを編集してAPIキーを設定：

```env
# Google Maps API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_STREET_VIEW_API_KEY=your_google_street_view_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. HTMLファイルのAPIキー更新

`public/index.html`の以下の行を編集：

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```

`YOUR_GOOGLE_MAPS_API_KEY`を実際のAPIキーに置き換えてください。

### 5. アプリケーションの起動

```bash
# 本番環境
npm start

# 開発環境（nodemon使用）
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 🌐 デプロイ

### Vercelでのデプロイ（推奨）

1. **Vercelアカウント作成**
   - [Vercel](https://vercel.com/)にアクセスしてアカウントを作成

2. **GitHubリポジトリにプッシュ**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Vercelでプロジェクトをインポート**
   - Vercelダッシュボードで「New Project」をクリック
   - GitHubリポジトリを選択
   - プロジェクト設定を確認

4. **環境変数の設定**
   - Vercelダッシュボードの「Settings」→「Environment Variables」
   - 以下の環境変数を追加：
     - `GOOGLE_MAPS_API_KEY`
     - `GOOGLE_STREET_VIEW_API_KEY`
     - `NODE_ENV=production`

5. **デプロイ**
   - 「Deploy」ボタンをクリック
   - デプロイ完了後、提供されたURLでアクセス可能

### その他のデプロイ先

#### Railway
```bash
# Railway CLIをインストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクトを初期化
railway init

# デプロイ
railway up
```

#### Render
1. [Render](https://render.com/)でアカウント作成
2. 「New Web Service」を選択
3. GitHubリポジトリを接続
4. 環境変数を設定
5. デプロイ

## 🔒 セキュリティ

### APIキーの安全な管理

- **サーバーサイド管理**: APIキーは`.env`ファイルで管理され、サーバーサイドでのみ使用
- **動的読み込み**: フロントエンドでは、サーバーからAPIキーを動的に取得
- **環境変数**: 本番環境では環境変数を使用してAPIキーを管理
- **Git除外**: `.env`ファイルは`.gitignore`に含まれており、Gitにコミットされません

### 推奨されるセキュリティ設定

1. **Google Cloud Consoleでの制限設定**:
   - HTTP リファラー制限を設定
   - 使用するAPIのみを有効化
   - IPアドレス制限を設定（可能な場合）

2. **本番環境での設定**:
   - HTTPSを使用
   - 適切なCORS設定
   - レート制限の実装

## 📁 プロジェクト構造

```
streetView/
├── package.json              # プロジェクト設定
├── server.js                 # Express サーバー
├── vercel.json              # Vercel設定
├── env.example              # 環境変数例
├── .env                     # 環境変数（要作成）
├── .gitignore               # Git除外設定
├── README.md                # プロジェクト説明
├── plan.md                  # 実装プラン
├── public/                  # 静的ファイル
│   ├── index.html          # メインUI
│   ├── style.css           # スタイル
│   └── script.js           # フロントエンドJS
├── src/                    # サーバーサイドコード
│   ├── routes.js           # APIルート
│   ├── streetViewService.js # Street View API処理
│   └── imageProcessor.js   # 画像処理ロジック
└── output/                 # 生成された画像保存先
```

## 🔧 技術仕様

### 画像生成仕様
- **入力画像**: 640x640ピクセル × 8方向
- **出力画像**: 5120x640ピクセル（水平パノラマ）
- **形式**: PNG
- **取得間隔**: 45度（0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°）

### API制限
- **Street View Static API**: 1日あたり25,000リクエスト（無料）
- **1地点あたり**: 8リクエスト
- **最大地点数**: 約3,125地点/日

### 使用技術
- **バックエンド**: Node.js, Express.js
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **画像処理**: Sharp
- **地図**: Google Maps JavaScript API
- **ストリートビュー**: Google Street View Static API

## 🎯 使用方法

1. **地点選択**: 地図上で任意の地点をクリック
2. **座標確認**: 選択された座標が表示されることを確認
3. **パノラマ生成**: 「パノラマ生成」ボタンをクリック
4. **結果確認**: 生成されたパノラマ画像を確認
5. **ダウンロード**: 「ダウンロード」ボタンで画像を保存

## ⚠️ 注意事項

- ストリートビューが利用できない地点では画像が生成されません
- API使用量に制限があります（1日25,000リクエストまで無料）
- 生成には数秒から数十秒かかる場合があります
- インターネット接続が必要です
- **APIキーは絶対に公開リポジトリにコミットしないでください**

## 🐛 トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - APIキーが正しく設定されているか確認
   - APIが有効化されているか確認
   - `.env`ファイルが正しく作成されているか確認

2. **画像が生成されない**
   - 選択した地点でストリートビューが利用可能か確認
   - ネットワーク接続を確認

3. **サーバーが起動しない**
   - ポート3000が使用中でないか確認
   - 依存関係が正しくインストールされているか確認

4. **地図が表示されない**
   - Google Maps APIキーが正しく設定されているか確認
   - ブラウザのコンソールでエラーを確認

5. **デプロイエラー**
   - 環境変数が正しく設定されているか確認
   - `vercel.json`ファイルが存在するか確認
   - Node.jsバージョンが16以上であることを確認

## 📄 ライセンス

ISC License

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

## 📞 サポート

問題が発生した場合は、GitHubのイシューを作成してください。 