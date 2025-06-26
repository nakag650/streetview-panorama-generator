const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageProcessor {
    constructor() {
        this.outputDir = path.join(__dirname, '../output');
        this.ensureOutputDir();
    }

    /**
     * 出力ディレクトリが存在することを確認
     */
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * 8方向の画像からパノラマ画像を生成（中央320pxのみ使用）
     * @param {Array} images - 画像データの配列
     * @param {number} lat - 緯度
     * @param {number} lng - 経度
     * @returns {Promise<string>} 生成された画像のパス
     */
    async createPanorama(images, lat, lng) {
        if (!images || images.length === 0) {
            throw new Error('画像データがありません');
        }

        console.log('パノラマ画像を生成中...（中央320pxのみ使用）');

        try {
            // 画像を正しい順序でソート（方位角順）
            const sortedImages = images.sort((a, b) => a.heading - b.heading);
            
            // 各画像を640x640にリサイズし、中央320pxだけを切り出し
            const processedImages = await Promise.all(
                sortedImages.map(img => this.cropCenter(img.data, 320, 640))
            );

            // パノラマ画像を生成（2560x640）
            const panoramaBuffer = await this.combineImages(processedImages, 320, 640);
            
            // ファイル名を生成
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `panorama_${lat}_${lng}_${timestamp}.png`;
            const filepath = path.join(this.outputDir, filename);

            // ファイルに保存
            await sharp(panoramaBuffer).png().toFile(filepath);

            console.log(`パノラマ画像を保存しました: ${filename}`);
            return `/output/${filename}`;

        } catch (error) {
            console.error('パノラマ生成エラー:', error);
            throw error;
        }
    }

    /**
     * 画像の中央部分を切り出す
     * @param {Buffer} imageBuffer - 元画像データ
     * @param {number} cropWidth - 切り出す幅
     * @param {number} cropHeight - 切り出す高さ
     * @returns {Promise<Buffer>} 切り出された画像データ
     */
    async cropCenter(imageBuffer, cropWidth, cropHeight) {
        // 640x640の中央320x640を切り出し
        const left = Math.floor((640 - cropWidth) / 2);
        return await sharp(imageBuffer)
            .resize(640, 640, { fit: 'fill' })
            .extract({ left, top: 0, width: cropWidth, height: cropHeight })
            .png()
            .toBuffer();
    }

    /**
     * 複数の画像を横に結合してパノラマを作成
     * @param {Array<Buffer>} imageBuffers - 画像バッファの配列
     * @param {number} imageWidth - 各画像の幅
     * @param {number} imageHeight - 各画像の高さ
     * @returns {Promise<Buffer>} 結合されたパノラマ画像
     */
    async combineImages(imageBuffers, imageWidth, imageHeight) {
        const panoramaWidth = imageWidth * imageBuffers.length; // 2560px (8枚 × 320px)
        const panoramaHeight = imageHeight; // 640px

        console.log(`パノラマサイズ: ${panoramaWidth}x${panoramaHeight}`);

        // 各画像を横に並べて結合
        const composite = [];
        
        for (let i = 0; i < imageBuffers.length; i++) {
            composite.push({
                input: imageBuffers[i],
                left: i * imageWidth,
                top: 0
            });
        }

        // パノラマ画像を生成
        const panoramaBuffer = await sharp({
            create: {
                width: panoramaWidth,
                height: panoramaHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite(composite)
        .png()
        .toBuffer();

        return panoramaBuffer;
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
}

module.exports = ImageProcessor; 