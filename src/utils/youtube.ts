/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Try to create URL object
  let videoUrl: URL;
  try {
    videoUrl = new URL(url);
  } catch {
    return null;
  }

  // Handle youtu.be format
  if (videoUrl.hostname === 'youtu.be') {
    return videoUrl.pathname.slice(1);
  }

  // Handle youtube.com formats
  if (videoUrl.hostname === 'youtube.com' || videoUrl.hostname === 'www.youtube.com') {
    // Handle /watch?v= format
    const searchParams = new URLSearchParams(videoUrl.search);
    const videoId = searchParams.get('v');
    if (videoId) return videoId;

    // Handle /shorts/ format
    if (videoUrl.pathname.startsWith('/shorts/')) {
      return videoUrl.pathname.slice(8);
    }

    // Handle /embed/ format
    if (videoUrl.pathname.startsWith('/embed/')) {
      return videoUrl.pathname.slice(7);
    }
  }

  return null;
}

/**
 * Validate YouTube video ID format
 * YouTube video IDs are 11 characters long and contain alphanumeric characters,
 * underscores, and dashes
 */
export function isValidVideoId(videoId: string): boolean {
  if (!videoId) return false;
  return /^[A-Za-z0-9_-]{11}$/.test(videoId);
}

/**
 * Get YouTube video thumbnail URL
 * Available qualities:
 * - default: 120x90
 * - mqdefault: 320x180
 * - hqdefault: 480x360
 * - sddefault: 640x480
 * - maxresdefault: original resolution
 */
export function getVideoThumbnail(videoId: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'mqdefault'): string {
  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid video ID');
  }
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Format video duration from seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if a video URL is valid
 */
export function isValidVideoUrl(url: string): boolean {
  const videoId = extractVideoId(url);
  return videoId !== null && isValidVideoId(videoId);
}

/**
 * Get embed URL for a video
 */
export function getEmbedUrl(videoId: string): string {
  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid video ID');
  }
  return `https://www.youtube.com/embed/${videoId}`;
}