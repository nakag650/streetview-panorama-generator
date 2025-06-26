const axios = require('axios');
const fs = require('fs');
const path = require('path');

class StreetViewService {
    constructor() {
        this.apiKey = process.env.GOOGLE_STREET_VIEW_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/streetview';
        
        if (!this.apiKey) {
            throw new Error('GOOGLE_STREET_VIEW_API_KEYが設定されていません');
        }
    }

    /**
     * 指定された座標から8方向のストリートビュー画像を取得
     * @param {number} lat - 緯度
     * @param {number} lng - 経度
     * @returns {Promise<Array>} 画像データの配列
     */
    async getStreetViewImages(lat, lng) {
        const directions = [0, 45, 90, 135, 180, 225, 270, 315]; // 8方向
        const images = [];

        console.log(`8方向の画像を取得中: ${lat}, ${lng}`);

        for (let i = 0; i < directions.length; i++) {
            const heading = directions[i];
            try {
                console.log(`方向 ${heading}° の画像を取得中... (${i + 1}/8)`);
                
                const imageData = await this.getStreetViewImage(lat, lng, heading);
                if (imageData) {
                    images.push({
                        data: imageData,
                        heading: heading,
                        index: i
                    });
                }
                
                // API制限を避けるため少し待機
                await this.delay(200);
                
            } catch (error) {
                console.error(`方向 ${heading}° の画像取得に失敗:`, error.message);
            }
        }

        console.log(`${images.length}枚の画像を取得しました`);
        return images;
    }

    /**
     * 単一方向のストリートビュー画像を取得
     * @param {number} lat - 緯度
     * @param {number} lng - 経度
     * @param {number} heading - 方位角（0-360度）
     * @returns {Promise<Buffer>} 画像データ
     */
    async getStreetViewImage(lat, lng, heading) {
        const params = {
            size: '640x640',        // 最大サイズ
            location: `${lat},${lng}`,
            heading: heading,
            pitch: 0,               // 水平方向
            fov: 90,                // 視野角90度
            key: this.apiKey
        };

        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}?${queryString}`;

        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000
            });

            if (response.status === 200) {
                return Buffer.from(response.data);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`方向 ${heading}° ではストリートビューが利用できません`);
                return null;
            }
            throw error;
        }
    }

    /**
     * 指定された時間だけ待機
     * @param {number} ms - 待機時間（ミリ秒）
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * ストリートビューが利用可能かチェック
     * @param {number} lat - 緯度
     * @param {number} lng - 経度
     * @returns {Promise<boolean>}
     */
    async isStreetViewAvailable(lat, lng) {
        try {
            const image = await this.getStreetViewImage(lat, lng, 0);
            return image !== null;
        } catch (error) {
            return false;
        }
    }
}

module.exports = StreetViewService; 