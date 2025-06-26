// グローバル変数
let map;
let selectedMarker;
let selectedLocation = null;
let googleMapsApiKey = null;

// DOM要素
const generateBtn = document.getElementById('generateBtn');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const panoramaResult = document.getElementById('panoramaResult');
const panoramaImage = document.getElementById('panoramaImage');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');
const coordinates = document.getElementById('coordinates');
const panoramaHistory = document.getElementById('panoramaHistory');

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadGoogleMapsApi();
        initializeMap();
        loadPanoramaHistory();
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('アプリケーションの初期化に失敗しました');
    }
});

// Google Maps APIキーを取得してAPIを読み込む
async function loadGoogleMapsApi() {
    try {
        // サーバーからAPIキーを取得
        const response = await fetch('/api/maps-api-key');
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'APIキーの取得に失敗しました');
        }
        
        googleMapsApiKey = result.apiKey;
        
        // Google Maps APIを動的に読み込み
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=onGoogleMapsLoaded`;
            script.onerror = () => reject(new Error('Google Maps APIの読み込みに失敗しました'));
            document.head.appendChild(script);
            
            // グローバルコールバック関数を定義
            window.onGoogleMapsLoaded = () => {
                resolve();
            };
        });
        
    } catch (error) {
        console.error('Google Maps API読み込みエラー:', error);
        throw error;
    }
}

// Google Maps初期化
function initializeMap() {
    // 東京駅をデフォルトの中心に設定
    const defaultLocation = { lat: 35.681236, lng: 139.767125 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 15,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // 地図クリックイベント
    map.addListener('click', function(event) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        selectLocation(lat, lng);
    });
}

// 地点選択
function selectLocation(lat, lng) {
    selectedLocation = { lat, lng };
    
    // 既存のマーカーを削除
    if (selectedMarker) {
        selectedMarker.setMap(null);
    }
    
    // 新しいマーカーを追加
    selectedMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `選択された地点 (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        animation: google.maps.Animation.DROP
    });
    
    // 座標表示
    coordinates.textContent = `緯度: ${lat.toFixed(6)}, 経度: ${lng.toFixed(6)}`;
    
    // 生成ボタンを有効化
    generateBtn.disabled = false;
    
    // エラーメッセージをクリア
    hideError();
}

// パノラマ生成
async function generatePanorama() {
    if (!selectedLocation) {
        showError('地点が選択されていません');
        return;
    }
    
    try {
        // UI状態を更新
        setGeneratingState(true);
        
        // API呼び出し
        const response = await fetch('/api/generate-panorama', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedLocation)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // 成功時の処理
            displayPanorama(result.panoramaPath);
            loadPanoramaHistory(); // 履歴を更新
        } else {
            // エラー時の処理
            showError(result.error || 'パノラマ生成に失敗しました');
        }
        
    } catch (error) {
        console.error('パノラマ生成エラー:', error);
        showError('ネットワークエラーが発生しました');
    } finally {
        setGeneratingState(false);
    }
}

// 生成中のUI状態設定
function setGeneratingState(isGenerating) {
    generateBtn.disabled = isGenerating;
    
    if (isGenerating) {
        progress.classList.remove('hidden');
        generateBtn.innerHTML = '<span class="loading"></span> 生成中...';
    } else {
        progress.classList.add('hidden');
        generateBtn.innerHTML = '🎯 パノラマ生成';
    }
}

// パノラマ表示
function displayPanorama(imagePath) {
    panoramaImage.src = imagePath;
    panoramaResult.classList.remove('hidden');
    
    // ダウンロードリンクを設定
    downloadBtn.href = imagePath;
    downloadBtn.download = `panorama_${selectedLocation.lat}_${selectedLocation.lng}.png`;
    
    // 結果までスクロール
    panoramaResult.scrollIntoView({ behavior: 'smooth' });
    
    hideError();
}

// エラー表示
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    panoramaResult.classList.add('hidden');
}

// エラー非表示
function hideError() {
    errorMessage.classList.add('hidden');
}

// パノラマ履歴読み込み
async function loadPanoramaHistory() {
    try {
        const response = await fetch('/api/panoramas');
        const result = await response.json();
        
        if (response.ok) {
            displayPanoramaHistory(result.panoramas);
        }
    } catch (error) {
        console.error('履歴読み込みエラー:', error);
    }
}

// パノラマ履歴表示
function displayPanoramaHistory(panoramas) {
    if (panoramas.length === 0) {
        panoramaHistory.innerHTML = '<p class="no-history">まだパノラマが生成されていません</p>';
        return;
    }
    
    const historyHTML = panoramas.map(panorama => {
        const date = new Date(panorama.timestamp).toLocaleString('ja-JP');
        const filename = panorama.filename;
        
        // ファイル名から座標を抽出
        const coordMatch = filename.match(/panorama_([-\d.]+)_([-\d.]+)_/);
        const coords = coordMatch ? 
            `(${parseFloat(coordMatch[1]).toFixed(4)}, ${parseFloat(coordMatch[2]).toFixed(4)})` : 
            '座標不明';
        
        return `
            <div class="history-item">
                <img src="${panorama.path}" alt="パノラマサムネイル">
                <div class="history-item-info">
                    <h4>${coords}</h4>
                    <p>${date}</p>
                </div>
                <div class="history-item-actions">
                    <a href="${panorama.path}" class="btn btn-small btn-secondary" download="${filename}">📥</a>
                    <button class="btn btn-small btn-secondary" onclick="viewPanorama('${panorama.path}')">👁️</button>
                </div>
            </div>
        `;
    }).join('');
    
    panoramaHistory.innerHTML = historyHTML;
}

// 履歴からパノラマ表示
function viewPanorama(imagePath) {
    panoramaImage.src = imagePath;
    panoramaResult.classList.remove('hidden');
    panoramaResult.scrollIntoView({ behavior: 'smooth' });
    hideError();
}

// 共有機能
function sharePanorama() {
    if (navigator.share) {
        navigator.share({
            title: 'ストリートビューパノラマ',
            text: 'Googleストリートビューから生成した360度パノラマ画像',
            url: window.location.href
        });
    } else {
        // フォールバック: URLをクリップボードにコピー
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('URLをクリップボードにコピーしました');
        });
    }
}

// イベントリスナー
generateBtn.addEventListener('click', generatePanorama);
document.getElementById('shareBtn').addEventListener('click', sharePanorama);

// キーボードショートカット
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !generateBtn.disabled && selectedLocation) {
        generatePanorama();
    }
});

// エラーハンドリング
window.addEventListener('error', function(event) {
    console.error('JavaScriptエラー:', event.error);
    showError('予期しないエラーが発生しました');
});

// ネットワーク状態監視
window.addEventListener('online', function() {
    hideError();
});

window.addEventListener('offline', function() {
    showError('インターネット接続が切断されました');
});

// パノラマ一覧を表示
async function loadPanoramas() {
    try {
        const response = await fetch('/api/panoramas');
        const data = await response.json();
        
        const panoramaList = document.getElementById('panoramaList');
        panoramaList.innerHTML = '';
        
        if (data.panoramas.length === 0) {
            panoramaList.innerHTML = '<p>まだパノラマが生成されていません</p>';
            return;
        }
        
        data.panoramas.forEach(panorama => {
            const item = document.createElement('div');
            item.className = 'panorama-item';
            item.innerHTML = `
                <img src="${panorama.path}" alt="パノラマ画像" style="width: 100%; max-width: 300px;">
                <p>${panorama.filename}</p>
                <button onclick="downloadPanorama('${panorama.filename}')" class="download-btn">ダウンロード</button>
            `;
            panoramaList.appendChild(item);
        });
    } catch (error) {
        console.error('パノラマ一覧取得エラー:', error);
    }
}

// パノラマをダウンロード
async function downloadPanorama(filename) {
    try {
        const response = await fetch(`/api/download/${filename}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('ダウンロードに失敗しました');
        }
    } catch (error) {
        console.error('ダウンロードエラー:', error);
        alert('ダウンロードに失敗しました');
    }
} 