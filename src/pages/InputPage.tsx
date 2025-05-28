import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidYouTubeUrl } from '../utils';

type Mode = 'video' | 'live';

export const InputPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('video');
  const [urls, setUrls] = useState<string[]>(['']);

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    // 最後のURLが有効な場合、新しい入力欄を追加
    if (index === urls.length - 1 && isValidYouTubeUrl(value) && urls.length < 3) {
      setUrls([...newUrls, '']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = urls.filter(url => isValidYouTubeUrl(url));
    if (validUrls.length === 0) return;

    const queryParams = new URLSearchParams();
    queryParams.set('mode', mode);
    validUrls.forEach(url => queryParams.append('url', url));
    navigate(`/watch?${queryParams.toString()}`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Sync YouTube Viewer</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>
            <input
              type="radio"
              value="video"
              checked={mode === 'video'}
              onChange={(e) => setMode(e.target.value as Mode)}
            />
            動画モード
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              value="live"
              checked={mode === 'live'}
              onChange={(e) => setMode(e.target.value as Mode)}
            />
            ライブ配信モード
          </label>
        </div>

        {urls.map((url, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              placeholder="YouTube URLを入力"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={!urls.some(url => isValidYouTubeUrl(url))}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          視聴開始
        </button>
      </form>
    </div>
  );
}; 