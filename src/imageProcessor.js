const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ImageProcessor {
    constructor() {
        // Vercel環境では/tmpディレクトリを使用
        this.outputDir = process.env.NODE_ENV === 'production' 
            ? '/tmp' 
            : path.join(__dirname, '../output');
        
        // 出力ディレクトリが存在しない場合は作成
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * 8方向の画像からパノラマ画像を生成（中央320pxのみ使用）
     * @param {Array} images - 画像データの配列（Buffer配列、heading順）
     * @param {number} lat - 緯度
     * @param {number} lng - 経度
     * @returns {Promise<string>} 生成された画像のパス
     */
    async createPanorama(images, lat, lng) {
        if (!Array.isArray(images) || images.length === 0) {
            throw new Error('画像データがありません');
        }
        // images: Buffer配列（heading順）
        // 各画像の中央320pxを切り出し
        const processedImages = await Promise.all(
            images.map(img => this.cropCenter(img, 320, 640))
        );
        // 横に結合（2560x640）
        const panoramaBuffer = await this.combineImages(processedImages, 320, 640);
        // ファイル名を生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `panorama_${lat}_${lng}_${timestamp}.png`;
        const filepath = path.join(this.outputDir, filename);
        // ファイルに保存
        await sharp(panoramaBuffer).toFile(filepath);
        if (!fs.existsSync(filepath)) {
            throw new Error('パノラマ画像の保存に失敗しました');
        }
        return `/api/download/${filename}`;
    }

    /**
     * 画像の中央部分を切り出す
     * @param {Buffer} imageBuffer - 元画像データ
     * @param {number} cropWidth - 切り出す幅
     * @param {number} cropHeight - 切り出す高さ
     * @returns {Promise<Buffer>} 切り出された画像データ
     */
    async cropCenter(imageBuffer, cropWidth, cropHeight) {
        // 640x640の中央部分を切り出し（350x640または指定サイズ）
        const left = Math.floor((640 - cropWidth) / 2);
        return await sharp(imageBuffer)
            .resize(640, 640, { fit: 'fill' })
            .extract({ left, top: 0, width: cropWidth, height: cropHeight })
            .png()
            .toBuffer();
    }

    /**
     * 複数の画像を横に結合してパノラマを作成（シンプルな横並び）
     * @param {Array<Buffer>} imageBuffers - 画像バッファの配列
     * @param {number} imageWidth - 各画像の幅
     * @param {number} imageHeight - 各画像の高さ
     * @returns {Promise<Buffer>} 結合されたパノラマ画像
     */
    async combineImages(imageBuffers, imageWidth, imageHeight) {
        const panoramaWidth = imageWidth * imageBuffers.length;
        const composite = imageBuffers.map((buf, i) => ({
            input: buf,
            left: i * imageWidth,
            top: 0
        }));
        return await sharp({
            create: {
                width: panoramaWidth,
                height: imageHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite(composite)
        .png()
        .toBuffer();
    }

    /**
     * 生成されたパノラマ画像の一覧を取得
     * @returns {Array} 画像ファイル情報の配列
     */
    getPanoramaList() {
        try {
            const files = fs.readdirSync(this.outputDir)
                .filter(file => file.endsWith('.png'))
                .map(file => {
                    const filepath = path.join(this.outputDir, file);
                    const stats = fs.statSync(filepath);
                    return {
                        filename: file,
                        path: `/output/${file}`,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.modified - a.modified);

            return files;
        } catch (error) {
            console.error('パノラマ一覧取得エラー:', error);
            return [];
        }
    }

    /**
     * 指定された画像を削除
     * @param {string} filename - 削除するファイル名
     * @returns {boolean} 削除成功フラグ
     */
    deletePanorama(filename) {
        try {
            const filepath = path.join(this.outputDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`画像を削除しました: ${filename}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('画像削除エラー:', error);
            return false;
        }
    }

    async getStreetViewImages(lat, lng) {
        const images = [];
        for (let heading = 0; heading < 360; heading += 45) {
            const url = `https://maps.googleapis.com/maps/api/streetview?...&heading=${heading}&key=${process.env.GOOGLE_STREET_VIEW_API_KEY}`;
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                if (response.status === 200 && response.data && response.data.length > 0) {
                    images.push(Buffer.from(response.data));
                } else {
                    console.error('Street View APIから画像が取得できませんでした:', url);
                }
            } catch (error) {
                console.error('Street View APIリクエストエラー:', error.message, url);
            }
        }
        // Bufferでないものは除外
        return images.filter(img => Buffer.isBuffer(img));
    }
}

module.exports = ImageProcessor; 