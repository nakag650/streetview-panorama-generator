const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(express.json());
app.use(express.static('public'));
app.use('/output', express.static('output'));

// APIルート
app.use('/api', require('./src/routes'));

// メインページ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    console.log('Google Maps APIキーが設定されていることを確認してください');
}); 