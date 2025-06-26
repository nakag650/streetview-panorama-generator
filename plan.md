# Google Maps API ストリートビュー360度パノラマ画像生成 実装プラン

## 概要
指定された地点のGoogleストリートビューから360度パノラマ画像を生成し、一枚の画像として保存するシステムを実装します。

## 技術要件

### 必要なAPI・ライブラリ
1. **Google Maps JavaScript API** - ストリートビューデータの取得
2. **Google Street View Static API** - 高解像度画像の取得
3. **Node.js** - サーバーサイド処理
4. **Express.js** - Webサーバー
5. **Canvas API** - 画像合成処理
6. **Sharp** - 画像処理ライブラリ（ImageMagickより高速）

### 必要なAPIキー
- Google Maps JavaScript API キー
- Google Street View Static API キー

## 実装アプローチ

### 方法1: Street View Static API を使用（推奨）
1. **複数方向の画像取得**
   - 指定地点から8方向（0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°）で画像を取得
   - 各方向の画像サイズ: 640x640ピクセル（API制限内）
   - 視野角: 90度（デフォルト）

2. **画像合成処理**
   - 取得した画像をCanvas上で適切に配置
   - 重複部分のブレンディング処理
   - 最終的なパノラマ画像の生成（5120x640ピクセル）

### 方法2: Street View JavaScript API を使用
1. **ストリートビューデータの取得**
   - JavaScript APIでストリートビューのメタデータを取得
   - 利用可能な画像タイルの情報を取得

2. **タイル画像の結合**
   - 複数の画像タイルを結合
   - 360度パノラマ画像の生成

## 実装ステップ

### Phase 1: 環境構築
1. **プロジェクト初期化**
   ```bash
   npm init -y
   npm install express axios sharp canvas dotenv
   ```

2. **Google API設定**
   - Google Cloud Consoleでプロジェクト作成
   - Maps JavaScript API と Street View Static API を有効化
   - APIキーの取得と設定

### Phase 2: 基本機能実装
1. **地図クリック機能**
   - Google Maps JavaScript APIで地図表示
   - クリックイベントで座標取得
   - 座標表示機能

2. **Street View Static API 呼び出し**
   - 8方向の画像取得（1地点あたり8リクエスト）
   - エラーハンドリング
   - 進捗表示

### Phase 3: 画像処理実装
1. **画像合成アルゴリズム**
   - 8方向画像の配置ロジック
   - 重複部分のブレンディング
   - パノラマ画像の生成（5120x640）

2. **画像保存機能**
   - PNG形式で保存
   - ローカルファイルシステムに保存
   - ファイル名に座標情報を含める

### Phase 4: UI/UX実装
1. **Webインターフェース**
   - 地図表示機能
   - 地点選択機能
   - 進捗表示

2. **結果表示**
   - 生成されたパノラマ画像の表示
   - ダウンロード機能

## ファイル構造
```
streetView/
├── package.json
├── .env                    # APIキー設定
├── server.js              # Express サーバー
├── public/
│   ├── index.html         # メインUI
│   ├── style.css          # スタイル
│   └── script.js          # フロントエンドJS
├── src/
│   ├── streetViewService.js    # Street View API処理
│   ├── imageProcessor.js       # 画像処理ロジック
│   └── utils.js               # ユーティリティ関数
└── output/                # 生成された画像保存先
```

## 技術的考慮事項

### API制限
- Street View Static API: 1日あたり25,000リクエスト
- 画像サイズ制限: 最大640x640ピクセル
- 1地点あたり8リクエスト → 1日約3,125地点まで可能
- 使用量（1日20地点）: 160リクエスト/日 → 十分に無料範囲内

### 画像品質
- 入力画像: 640x640ピクセル × 8方向
- 出力画像: 5120x640ピクセル（水平パノラマ）
- 重複部分での自然なブレンディング
- メモリ使用量の最適化

### エラーハンドリング
- ストリートビューが利用できない地点の処理
- API制限エラーの処理
- ネットワークエラーの処理

## 必要な情報・確認事項

### 技術仕様
1. **出力画像の解像度** - 5120x640ピクセル（水平パノラマ）
2. **出力フォーマット** - PNG
3. **画像の向き** - 水平パノラマ

### 機能要件
1. **地点指定方法** - 地図クリック
2. **UI要件** - Webアプリ
3. **保存先** - ローカル保存

### API制限
1. **使用量** - 1日20地点ほど（160リクエスト/日）
2. **コスト** - 無料範囲内（25,000リクエスト/日まで無料）

## 実装詳細

### 画像取得戦略
- 8方向の画像を取得（0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°）
- 各方向の視野角: 90度
- 取得間隔: 45度（重複部分でブレンディング）

### 画像合成方法
1. 8枚の画像を横に並べて配置
2. 重複部分でアルファブレンディング
3. 最終的な5120x640ピクセルのパノラマ画像を生成

### ファイル命名規則
- 形式: `panorama_${lat}_${lng}_${timestamp}.png`
- 例: `panorama_35.6762_139.6503_20241201_143022.png`

## 次のステップ
1. ✅ 技術仕様の詳細化完了
2. プロトタイプの実装開始
3. Google APIキーの取得方法の案内

## 参考資料
- [Google Street View Static API Documentation](https://developers.google.com/maps/documentation/streetview/overview)
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript/overview)
- [Node.js Canvas Documentation](https://github.com/Automattic/node-canvas) 