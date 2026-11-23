/**
 * عميل YouTube Data API v3 مقتصد في استهلاك الحصة — مشترك بين Edge Function والأداة المحلية.
 * التكلفة: channels.list = 1، playlistItems.list = 1 لكل 50، videos.list = 1 لكل 50.
 * لا نستخدم search.list (100 وحدة).
 */
import { parseIsoDuration } from './videoMatch.ts';

const BASE = 'https://www.googleapis.com/youtube/v3';

// deno-lint-ignore no-explicit-any
type Json = any;
type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<Json>; text(): Promise<string> }>;

export interface YouTubeClient {
  quota: number;
  get(path: string, params: Record<string, string>): Promise<Json>;
}

export function createYouTube(apiKey: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): YouTubeClient {
  const client: YouTubeClient = {
    quota: 0,
    async get(path, params) {
      client.quota += 1;
      const res = await fetchImpl(`${BASE}/${path}?${new URLSearchParams(params)}`, { headers: { 'X-Goog-Api-Key': apiKey } });
      if (!res.ok) throw new Error(`YouTube ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return res.json();
    },
  };
  return client;
}

export interface ResolvedChannel {
  channelId: string;
  uploadsPlaylistId: string;
  title: string;
}

export async function resolveChannel(yt: YouTubeClient, ref: { channelId?: string | null; handle?: string | null }): Promise<ResolvedChannel> {
  const params: Record<string, string> = { part: 'contentDetails,snippet' };
  if (ref.channelId) params.id = ref.channelId;
  else if (ref.handle) params.forHandle = `@${ref.handle.replace(/^@/, '')}`;
  else throw new Error('channel needs an id or a handle');
  const info = await yt.get('channels', params);
  const item = info.items?.[0];
  if (!item) throw new Error(`channel not found: ${ref.channelId ?? ref.handle}`);
  return { channelId: item.id, uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads, title: item.snippet?.title ?? '' };
}

export interface FetchedVideo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  durationSec: number | null;
  raw: Json;
}

export const MIN_DURATION_SEC = 90; // نتجاهل المقاطع القصيرة (Shorts)

/**
 * يجلب الفيديوهات الجديدة فقط من قائمة uploads: يتوقف عند أول صفحة فيها فيديو معروف.
 * isKnown: يعيد مجموعة المعرّفات الموجودة مسبقاً من بين المعرّفات المعطاة.
 */
export async function collectNewVideos(
  yt: YouTubeClient,
  uploadsPlaylistId: string,
  isKnown: (ids: string[]) => Promise<Set<string>>,
  maxPages = 4,
): Promise<FetchedVideo[]> {
  const fresh: Json[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const list = await yt.get('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    const items: Json[] = list.items ?? [];
    const known = await isKnown(items.map((i) => i.contentDetails.videoId));
    const unseen = items.filter((i) => !known.has(i.contentDetails.videoId));
    fresh.push(...unseen);
    if (unseen.length < items.length || !list.nextPageToken) break; // وصلنا إلى ما جلبناه سابقاً
    pageToken = list.nextPageToken;
  }

  const durations = new Map<string, number | null>();
  for (let i = 0; i < fresh.length; i += 50) {
    const ids = fresh.slice(i, i + 50).map((v) => v.contentDetails.videoId);
    const details = await yt.get('videos', { part: 'contentDetails', id: ids.join(',') });
    for (const d of details.items ?? []) durations.set(d.id, parseIsoDuration(d.contentDetails?.duration));
  }

  return fresh
    .map((v) => {
      const s = v.snippet ?? {};
      const id = v.contentDetails.videoId as string;
      return {
        youtubeId: id,
        title: s.title ?? '',
        description: (s.description ?? '').slice(0, 2000),
        thumbnailUrl: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? null,
        publishedAt: v.contentDetails.videoPublishedAt ?? s.publishedAt ?? null,
        durationSec: durations.get(id) ?? null,
        raw: { snippet: s, contentDetails: v.contentDetails },
      };
    })
    .filter((v) => v.title !== 'Private video' && v.title !== 'Deleted video')
    .filter((v) => (v.durationSec ?? MIN_DURATION_SEC) >= MIN_DURATION_SEC);
}

/**
 * قراءة الخلاصة العامة للقناة (بدون مفتاح API): https://www.youtube.com/feeds/videos.xml?channel_id=…
 * تعطي آخر 15 فيديو فقط، وبلا مدة. مفيدة للبدء قبل توفر المفتاح.
 */
export const channelFeedUrl = (channelId: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

const xmlDecode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');

export function parseChannelFeed(xml: string): FetchedVideo[] {
  const out: FetchedVideo[] = [];
  for (const entry of xml.split('<entry>').slice(1)) {
    const tag = (name: string) => entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1];
    const id = tag('yt:videoId');
    if (!id) continue;
    out.push({
      youtubeId: id,
      title: xmlDecode(tag('title') ?? '').trim(),
      description: xmlDecode(tag('media:description') ?? '').slice(0, 2000),
      thumbnailUrl: entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] ?? null,
      publishedAt: tag('published') ?? null,
      durationSec: null,
      raw: { source: 'feed' },
    });
  }
  return out;
}
