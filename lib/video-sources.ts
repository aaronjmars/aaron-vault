/**
 * Asset URL resolver. The source project served media from a CDN; the files
 * this page uses are vendored under public/, so paths resolve locally unless
 * NEXT_PUBLIC_MEDIA_BASE points somewhere else.
 */

export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/$/, "");

export function mediaUrl(path: string): string {
  return MEDIA_BASE ? `${MEDIA_BASE}${path}` : path;
}

export function ransomUrl(file: string): string {
  return mediaUrl(`/vault/ransom/${file}`);
}

export interface VideoSource {
  src: string;
  type: string;
}

// no av1 encode is shipped for the local clips, so offer vp9 then mp4
export function videoSources(base: string): VideoSource[] {
  return [
    { src: mediaUrl(`${base}.vp9.webm`), type: 'video/webm; codecs="vp9"' },
    { src: mediaUrl(`${base}.mp4`), type: "video/mp4" },
  ];
}
