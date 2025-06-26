const express = require('express');
const router = express.Router();
const StreetViewService = require('./streetViewService');
const ImageProcessor = require('./imageProcessor');
const path = require('path');
const fs = require('fs');

// Google Maps APIキーを安全に提供するエンドポイント
router.get('/maps-api-key', (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Google Maps APIキーが設定されていません' });
    }
    res.json({ apiKey });
});

// ストリートビューパノラマ生成エンドポイント
router.post('/generate-panorama', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: '緯度と経度が必要です' });
        }

        console.log(`パノラマ生成開始: ${lat}, ${lng}`);

        // ストリートビュー画像を取得
        const streetViewService = new StreetViewService();
        const images = await streetViewService.getStreetViewImages(lat, lng);

        if (!images || images.length === 0) {
            return res.status(404).json({ error: 'この地点ではストリートビューが利用できません' });
        }

        // パノラマ画像を生成
        const imageProcessor = new ImageProcessor();
        const panoramaPath = await imageProcessor.createPanorama(images, lat, lng);

        res.json({
            success: true,
            panoramaPath: panoramaPath,
            message: 'パノラマ画像が生成されました'
        });

    } catch (error) {
        console.error('パノラマ生成エラー:', error);
        res.status(500).json({ error: 'パノラマ生成中にエラーが発生しました' });
    }
});

// 画像ダウンロードエンドポイント
router.get('/download/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const outputDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../output');
        const filepath = path.join(outputDir, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'ファイルが見つかりません' });
        }

        res.download(filepath, filename);
    } catch (error) {
        console.error('ダウンロードエラー:', error);
        res.status(500).json({ error: 'ダウンロードに失敗しました' });
    }
});

// 生成された画像の一覧を取得
router.get('/panoramas', (req, res) => {
    try {
        const outputDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../output');
        
        if (!fs.existsSync(outputDir)) {
            return res.json({ panoramas: [] });
        }

        const files = fs.readdirSync(outputDir)
            .filter(file => file.endsWith('.png'))
            .map(file => ({
                filename: file,
                path: `/api/download/${file}`,
                timestamp: fs.statSync(path.join(outputDir, file)).mtime
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

        res.json({ panoramas: files });
    } catch (error) {
        console.error('画像一覧取得エラー:', error);
        res.status(500).json({ error: '画像一覧の取得に失敗しました' });
    }
});

module.exports = router; 