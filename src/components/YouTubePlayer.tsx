import { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  isLive: boolean;
  onReady: (player: YT.Player) => void;
  onStateChange: (event: YT.OnStateChangeEvent) => void;
  onError: (error: YT.OnErrorEvent) => void;
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  isLive,
  onReady,
  onStateChange,
  onError,
}) => {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevProps = useRef<YouTubePlayerProps | null>(null);
  
  useEffect(() => {
    prevProps.current = { videoId, isLive, onReady, onStateChange, onError };
  });
  useEffect(() => {
    if (!videoId) return;

    const loadPlayer = () => {
      console.log('Loading YouTube Player for videoId:', videoId);
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          ...(isLive && { liveChat: 0 }),
        },
        events: {
          onReady: (event: YT.PlayerEvent) => onReady(event.target),
          onStateChange: (event: YT.OnStateChangeEvent) => onStateChange(event),
          onError,
        },
      });
    };

    if (window.YT?.Player) {
      loadPlayer();
    } else {
      window.onYouTubeIframeAPIReady = loadPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, isLive]);

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        position: 'relative',
        backgroundColor: '#000',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>    
  );
};
