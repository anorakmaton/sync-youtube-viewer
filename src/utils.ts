export const extractVideoId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const searchParams = new URLSearchParams(urlObj.search);
      return searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
};

export const isValidYouTubeUrl = (url: string): boolean => {
  return extractVideoId(url) !== null;
}; 