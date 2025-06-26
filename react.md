推奨ライブラリ：@vis.gl/react-google-mapsReactプロジェクトにおいて、要求された機能を実現するための最も優れた選択肢は、@vis.gl/react-google-mapsです。これはGoogleが公式にスポンサーとなっている最新のライブラリであり、活発なメンテナンスと豊富なドキュメント、そして現代的なReactのベストプラクティスに基づいた設計が特徴です 1。コアアーキテクチャこのライブラリは、フック（Hooks）を中心とした宣言的なアプローチを採用しており、直感的かつ効率的な開発を可能にします。<APIProvider>: ライブラリのルートとなるコンポーネントです。Google Maps APIスクリプトの読み込みを管理し、子コンポーネントがAPIにアクセスするためのコンテキストを提供します。Google Maps APIキーは、このコンポーネントのapiKeyプロパティとして設定します。<Map>: 地図を描画する主要なコンポーネントです。フック: このライブラリの真価は、強力なフックにあります。useMap(): このフックを使用することで、コンポーネントツリー内のどこからでも、基盤となるgoogle.maps.Mapインスタンスへ直接アクセスできます。これにより、イベントリスナーの追加など、命令的な操作を簡単に行えます。useMapsLibrary(): Google Maps JavaScript APIの追加ライブラリ（streetView、places、geocodingなど）を動的に、かつ安全に読み込むためのフックです。これにより、初期ロードのパフォーマンスを最適化し、必要な機能だけをオンデマンドで利用できます。3.2. 実装ガイド：クリックによるストリートビュー表示機能の構築このライブラリの公式ドキュメントやサンプルには、本件で要求されている「地図のクリックでストリートビューを更新する」という特定のユースケースの直接的な例は存在しません 2。以下のガイドは、そのギャップを埋め、セクション1で確立した基本ロジックをReactの流儀で実装する方法をステップバイステップで解説します。ステップ1：コンポーネントの構造化まず、地図とストリートビューを表示するためのUIをレイアウトします。APIProviderで全体をラップし、その内部に<Map>コンポーネントと、ストリートビューを表示するためのプレーンな<div>要素を配置します。この<div>にはrefを設定して、後でDOMノードにアクセスできるようにします。

JavaScript
""import React, { useRef } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

function StreetViewApp() {
  const panoramaRef = useRef(null);

  return (
    <APIProvider apiKey={'YOUR_API_KEY'}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ width: '50%', height: '100%' }}>
          <Map defaultCenter={{ lat: 42.345573, lng: -71.098326 }} defaultZoom={14}>
            {/* Map-related components will go here */}
          </Map>
        </div>
        <div ref={panoramaRef} style={{ width: '50%', height: '100%' }} />
      </div>
    </APIProvider>
  );
}""
ステップ2：必要なライブラリの読み込みuseMapsLibraryフックを使用して、streetViewライブラリを動的に読み込みます。このフックはライブラリがロードされるまでnullを返し、ロードが完了するとライブラリのオブジェクトを返すため、コンポーネントが自動的に再レンダリングされます。ステップ3：StreetViewPanoramaとStreetViewServiceのインスタンス化useEffectフック内で、streetViewライブラリが利用可能になったことを確認してから、StreetViewPanoramaとStreetViewServiceのインスタンスを生成します。StreetViewPanoramaはステップ1で作成したrefに関連付けます。これらのインスタンスは、コンポーネントのライフサイクルを通じて維持するためにuseStateで管理します。ステップ4：地図へのクリックリスナーの追加useMapフックで地図インスタンスを取得し、useEffect内でクリックリスナーを追加します。このリスナーは、ユーザーが地図をクリックするたびに発火します。ステップ5：クリックハンドラのロジック実装と状態更新クリックハンドラ関数内で、StreetViewServiceのgetPanorama()を呼び出して、クリックされた地点のパノラマデータを取得します。データが正常に取得できたら、その情報を使ってStreetViewPanoramaの状態をsetPano()、setPov()、setVisible()で更新します。以下に、これらのステップを統合した完全なコンポーネントのコード例を示します。JavaScript
""
import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // ここにAPIキーを入力

function StreetViewComponent() {
  const map = useMap();
  const streetViewLibrary = useMapsLibrary('streetView');
  const [panorama, setPanorama] = useState(null);
  const = useState(null);
  const panoramaRef = useRef(null);

  useEffect(() => {
    if (!streetViewLibrary ||!panoramaRef.current) return;

    const panoramaInstance = new streetViewLibrary.StreetViewPanorama(panoramaRef.current, {
      visible: false, // 最初は非表示
    });
    const serviceInstance = new streetViewLibrary.StreetViewService();
    
    setPanorama(panoramaInstance);
    setStreetViewService(serviceInstance);
  }, [streetViewLibrary]);

  useEffect(() => {
    if (!map ||!streetViewService ||!panorama) return;

    const handleClick = (event) => {
      streetViewService.getPanorama({ location: event.latLng, radius: 50 }, (data, status) => {
        if (status === 'OK' && data) {
          panorama.setPano(data.location.pano);
          panorama.setPov({ heading: 270, pitch: 0 });
          panorama.setVisible(true);
        } else {
          console.error('Street View data not found for this location.');
          panorama.setVisible(false);
        }
      });
    };

    const clickListener = map.addListener('click', handleClick);

    // クリーンアップ関数
    return () => {
      google.maps.event.removeListener(clickListener);
    };
  },);

  return <div ref={panoramaRef} style={{ width: '100%', height: '100%' }} />;
}

export default function App() {
  const position = { lat: 42.345573, lng: -71.098326 };

  return (
    <APIProvider apiKey={API_KEY}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ width: '50%', height: '100%' }}>
          <Map defaultCenter={position} defaultZoom={14} streetViewControl={false} />
        </div>
        <div style={{ width: '50%', height: '100%' }}>
          <StreetViewComponent />
        </div>
      </div>
    </APIProvider>
  );
}""
