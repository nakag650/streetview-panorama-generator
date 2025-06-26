const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

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
     * 8方向の画像からパノラマ画像を生成（中央350pxを使用してオーバーラップ）
     * @param {Array} images - 画像データの配列
     * @param {number} lat - 緯度
     * @param {number} lng - 経度
     * @returns {Promise<string>} 生成された画像のパス
     */
    async createPanorama(images, lat, lng) {
        try {
            console.log('パノラマ画像生成開始...');
            
            // 画像を横に結合
            const panorama = await sharp({
                create: {
                    width: 5120,
                    height: 640,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
            .composite(images.map((imageBuffer, index) => ({
                input: imageBuffer,
                left: index * 640,
                top: 0
            })))
            .png()
            .toBuffer();

            // ファイル名を生成
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `panorama_${lat}_${lng}_${timestamp}.png`;
            const filepath = path.join(this.outputDir, filename);

            // ファイルに保存
            await sharp(panorama).toFile(filepath);

            console.log(`パノラマ画像生成完了: ${filepath}`);
            return `/api/download/${filename}`;

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
        // 640x640の中央部分を切り出し（350x640または指定サイズ）
        const left = Math.floor((640 - cropWidth) / 2);
        return await sharp(imageBuffer)
            .resize(640, 640, { fit: 'fill' })
            .extract({ left, top: 0, width: cropWidth, height: cropHeight })
            .png()
            .toBuffer();
    }

    /**
     * 複数の画像をオーバーラップしてブレンドしながらパノラマを作成
     * @param {Array<Buffer>} imageBuffers - 画像バッファの配列
     * @param {number} imageWidth - 各画像の幅
     * @param {number} imageHeight - 各画像の高さ
     * @returns {Promise<Buffer>} 結合されたパノラマ画像
     */
    async blendImages(imageBuffers, imageWidth, imageHeight) {
        const overlapWidth = 30; // 30pxのオーバーラップ
        const effectiveWidth = imageWidth - overlapWidth; // 320px
        const panoramaWidth = effectiveWidth * imageBuffers.length + overlapWidth; // 2530px
        const panoramaHeight = imageHeight; // 640px

        console.log(`パノラマサイズ: ${panoramaWidth}x${panoramaHeight} (オーバーラップ: ${overlapWidth}px)`);

        // ベースキャンバスを作成
        let panoramaBuffer = await sharp({
            create: {
                width: panoramaWidth,
                height: panoramaHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .png()
        .toBuffer();

        // 各画像を順番に合成
        for (let i = 0; i < imageBuffers.length; i++) {
            const left = i * effectiveWidth;
            
            if (i === 0) {
                // 最初の画像はそのまま配置
                panoramaBuffer = await sharp(panoramaBuffer)
                    .composite([{
                        input: imageBuffers[i],
                        left: left,
                        top: 0
                    }])
                    .png()
                    .toBuffer();
            } else {
                // 2枚目以降はフェザリングマスク付きで合成
                const maskedImage = await this.createMaskedImage(imageBuffers[i], imageWidth, imageHeight, overlapWidth);
                panoramaBuffer = await sharp(panoramaBuffer)
                    .composite([{
                        input: maskedImage,
                        left: left,
                        top: 0,
                        blend: 'over'
                    }])
                    .png()
                    .toBuffer();
            }
        }

        return panoramaBuffer;
    }

    /**
     * 画像にアルファグラデーションマスクを適用
     * @param {Buffer} imageBuffer - 画像バッファ
     * @param {number} imageWidth - 画像幅
     * @param {number} imageHeight - 画像高さ
     * @param {number} overlapWidth - オーバーラップ幅
     * @returns {Promise<Buffer>} マスク適用済み画像
     */
    async createMaskedImage(imageBuffer, imageWidth, imageHeight, overlapWidth) {
        // アルファグラデーションマスクを生成（左端のオーバーラップ部分）
        const alphaMask = await this.createAlphaGradientMask(imageWidth, imageHeight, overlapWidth);
        
        // 元画像にアルファマスクを適用して透明度を制御
        return await sharp(imageBuffer)
            .ensureAlpha()
            .composite([{
                input: alphaMask,
                blend: 'dest-in'  // アルファチャンネルのみを制御
            }])
            .png()
            .toBuffer();
    }

    /**
     * アルファグラデーションマスクを作成（透明度ベース）
     * @param {number} width - マスク幅
     * @param {number} height - マスク高さ
     * @param {number} gradientWidth - グラデーション幅
     * @returns {Promise<Buffer>} アルファグラデーションマスク
     */
    async createAlphaGradientMask(width, height, gradientWidth) {
        // SVGでアルファグラデーションマスクを作成（透明度制御）
        const svgAlphaGradient = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="alphaFadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:white;stop-opacity:0" />
                        <stop offset="${(gradientWidth / width) * 100}%" style="stop-color:white;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:white;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="${width}" height="${height}" fill="url(#alphaFadeGradient)" />
            </svg>
        `;
        
        return await sharp(Buffer.from(svgAlphaGradient))
            .png()
            .toBuffer();
    }

    /**
     * グラデーションマスクを作成（後方互換性のため保持）
     * @param {number} width - マスク幅
     * @param {number} height - マスク高さ
     * @param {number} gradientWidth - グラデーション幅
     * @returns {Promise<Buffer>} グラデーションマスク
     */
    async createGradientMask(width, height, gradientWidth) {
        // 新しいアルファグラデーションマスクを使用
        return await this.createAlphaGradientMask(width, height, gradientWidth);
    }

    /**
     * 複数の画像を横に結合してパノラマを作成（旧メソッド - 後方互換性のため保持）
     * @param {Array<Buffer>} imageBuffers - 画像バッファの配列
     * @param {number} imageWidth - 各画像の幅
     * @param {number} imageHeight - 各画像の高さ
     * @returns {Promise<Buffer>} 結合されたパノラマ画像
     */
    async combineImages(imageBuffers, imageWidth, imageHeight) {
        // 新しいブレンドメソッドを使用
        return await this.blendImages(imageBuffers, imageWidth, imageHeight);
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