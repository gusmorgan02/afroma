const dataMediaPattern = /^data:(?:image\/(?:jpeg|png|webp|gif)|video\/(?:mp4|webm));base64,/i;

export function safeMediaUrl(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  const candidate = value.trim();
  if (!candidate) return '';
  if (dataMediaPattern.test(candidate)) return candidate;

  try {
    const url = new URL(candidate, window.location.origin);
    if (url.protocol === 'https:') return url.href;
    return url.protocol === 'http:' && url.origin === window.location.origin ? url.href : '';
  } catch {
    return '';
  }
}

export function safeYouTubeEmbedUrl(videoId, origin) {
  if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return '';
  try {
    const pageOrigin = new URL(origin);
    if (pageOrigin.protocol !== 'https:' && pageOrigin.protocol !== 'http:') return '';
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(pageOrigin.origin)}`;
  } catch {
    return '';
  }
}
