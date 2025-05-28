import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { extractVideoId } from '../utils';

export const WatchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const playersRef = useRef<YT.Player[]>([]);
  const activePlayerIndexRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const mode = searchParams.get('mode') as 'video' | 'live';
  const urls = searchParams.getAll('url');
  const videoIds = urls.map(url => extractVideoId(url)).filter((id): id is string => id !== null);
  const isSyncEnabledRef = useRef(isSyncEnabled);
  const syncBaseTimesRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // 各プレイヤーの同期基準時間（0で初期化）

  useEffect(() => {
    isSyncEnabledRef.current = isSyncEnabled;
  }, [isSyncEnabled]);

  const handlePlayerReady = useCallback((index: number) => (player: YT.Player) => {
    playersRef.current[index] = player;
  }, []);

  const handleStateChange = useCallback((event: YT.OnStateChangeEvent, index: number) => {
    // Update active player whenever there's interaction
    activePlayerIndexRef.current = index;
    if (!isSyncEnabledRef.current) return;

    const state = event.data;
    const activePlayer = playersRef.current[index];
    if (!activePlayer) return;

    playersRef.current.forEach((player, i) => {
      if (i === index || !player) return;

      switch (state) {
        case YT.PlayerState.PLAYING:
          player.playVideo();
          break;
        case YT.PlayerState.PAUSED:
          player.pauseVideo();
          break;
        case YT.PlayerState.ENDED:
          player.stopVideo();
          break;
      }
    });
  }, []);

  const handleSeek = useCallback((index: number) => {
    if (!isSyncEnabledRef.current) return;
    const currentTime = Date.now();
    if (currentTime - lastSeekTimeRef.current < 300) return;
    lastSeekTimeRef.current = currentTime;

    const activePlayer = playersRef.current[index];
    if (!activePlayer) return;

    const baseTimes = syncBaseTimesRef.current;
    const activeBase = baseTimes[index] ?? activePlayer.getCurrentTime();
    const activeCurrent = activePlayer.getCurrentTime();
    const offset = activeCurrent - activeBase;

    // 他のプレイヤーも基準値＋オフセットにシーク
    playersRef.current.forEach((player, i) => {
      if (i === index || !player) return;
      const otherBase = baseTimes[i] ?? player.getCurrentTime();
      const target = otherBase + offset;
      player.seekTo(target, true);
    });
  }, []);

  const handleError = useCallback((error: YT.OnErrorEvent) => {
    console.error('YouTube Player Error:', error);
    // エラー処理をここに追加できます
  }, []);

  const playerReadyCallbacks = useMemo(
    () => videoIds.map((_, index) => (player: YT.Player) => handlePlayerReady(index)(player)),
    [videoIds, handlePlayerReady]
  );

  return (
    <div style={{ padding: '0', maxWidth: '100%', boxSizing: 'border-box' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '##1e1e1e',
        borderBottom: '1px solid rgb(34 70 139)'
      }}>
        <h2 style={{ margin: 0 }}>YouTube Sync Viewer</h2>
        <Link 
          to="/"
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          Back to Input
        </Link>
      </header>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${videoIds.length}, 1fr)`,
        width: '100vw',
        gap: '0',
        alignItems: 'stretch', // 高さを揃える
      }}>
        {videoIds.map((videoId, index) => (
          <YouTubePlayer
            key={videoId}
            videoId={videoId}
            isLive={mode === 'live'}
            onReady={playerReadyCallbacks[index]}
            onStateChange={(event) => {
              handleStateChange(event, index);
              // シーク操作の検出（再生状態が変わらない場合）
              if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.PAUSED) {
                handleSeek(index);
              }
            }}
            onError={handleError}
          />
        ))}
      </div>
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center',
        width: '100%'
      }}>
        <button
          onClick={() => {
            setIsSyncEnabled(!isSyncEnabled);
            if (!isSyncEnabled) {
              // 同期モードOFF時に各プレイヤーの現在位置を基準値として保存
              syncBaseTimesRef.current = playersRef.current.map(player => player?.getCurrentTime() ?? 0);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: isSyncEnabled ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isSyncEnabled ? '同期中' : '同期OFF'}
        </button>
      </div>
    </div>
  );
};
