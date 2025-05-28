import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { extractVideoId } from '../utils';

export const WatchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const playersRef = useRef<YT.Player[]>([]);
  const activePlayerIndexRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const mode = searchParams.get('mode') as 'video' | 'live';
  const urls = searchParams.getAll('url');
  const videoIds = urls.map(url => extractVideoId(url)).filter((id): id is string => id !== null);
  const isSyncEnabledRef = useRef(isSyncEnabled);
  const prevSeekTimeRef = useRef<number[]>([]);
  
  useEffect(() => {
    isSyncEnabledRef.current = isSyncEnabled;
  }, [isSyncEnabled]);

  const handlePlayerReady = useCallback((index: number) => (player: YT.Player) => {
    playersRef.current[index] = player;
  }, []);

  const handleStateChange = useCallback((event: YT.OnStateChangeEvent, index: number) => {
    // Update active player whenever there's interaction
    activePlayerIndexRef.current = index;
    console.log(`[handleStateChange] activePlayerIndex: ${activePlayerIndexRef.current}, index: ${index}`);
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

  const handleSeek = useCallback((event: YT.OnStateChangeEvent, index: number) => {
    console.log(`[handleSeek] isSyncEnabled${isSyncEnabledRef.current}, activePlayerIndex: ${activePlayerIndexRef.current}, index: ${index}`);
    if (!isSyncEnabledRef.current) return;

    const currentTime = Date.now();
    console.log(`[handleSeek] Current time - Last seek time: ${currentTime - lastSeekTimeRef.current}ms`);
    if (currentTime - lastSeekTimeRef.current < 300) return;
    lastSeekTimeRef.current = currentTime;

    const activePlayer = playersRef.current[index];
    if (!activePlayer) return;

    const currentTimeInSeconds = activePlayer.getCurrentTime();
    console.log(`[handleSeek] Player ${index} seeking to:`, currentTimeInSeconds);
    // シーク操作を他のプレイヤーに反映
    playersRef.current.forEach((player, i) => {
      if (i === index || !player) return;
      player.seekTo(currentTimeInSeconds, true);
    });
  }, []);

  const handleStateChangeForIndex = useCallback((index: number) => (event: YT.OnStateChangeEvent) => {
    handleStateChange(event, index);
    if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.PAUSED) {
      handleSeek(event, index);
    }
  }, [handleStateChange, handleSeek]);

  const handleError = useCallback((error: YT.OnErrorEvent) => {
    console.error('YouTube Player Error:', error);
  }, []);

  const handleSyncToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSyncEnabled = e.target.checked;
    setIsSyncEnabled(newSyncEnabled);
    
    // if (newSyncEnabled && activePlayerIndexRef.current !== null) {
    //   const activePlayer = playersRef.current[activePlayerIndexRef.current];
    //   if (activePlayer) {
    //     const currentTime = activePlayer.getCurrentTime();
    //     playersRef.current.forEach((player, i) => {
    //       if (i !== activePlayerIndexRef.current && player) {
    //         player.seekTo(currentTime, true);
    //       }
    //     });
    //   }
    // }
    // console.log('同期モード:', newSyncEnabled);
  }, []);

  const playerReadyCallbacks = useMemo(
    () => videoIds.map((_, index) => (player: YT.Player) => handlePlayerReady(index)(player)),
    [videoIds, handlePlayerReady]
  );

  const stateChangeCallbacks = useMemo(
    () => videoIds.map((_, index) => (event: YT.OnStateChangeEvent) => handleStateChangeForIndex(index)(event)),
    [videoIds, handleStateChangeForIndex]
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={isSyncEnabled}
            onChange={handleSyncToggle}
          />
          同期モード
        </label>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: `repeat(${videoIds.length}, 1fr)` }}>
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
                handleSeek(event, index);
              }
            }}
            onError={handleError}
          />
        ))}
      </div>
    </div>
  );
};
