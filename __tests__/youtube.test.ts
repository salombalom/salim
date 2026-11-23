import { collectNewVideos, createYouTube, resolveChannel } from '@/supabase/functions/_shared/youtube';

/** يوتيوب وهمي: قائمة uploads من 120 فيديو (الأحدث أولاً) */
function fakeYouTube(total = 120, durationFor = (i: number) => (i % 10 === 0 ? 'PT45S' : 'PT8M')) {
  const calls: string[] = [];
  const item = (i: number) => ({
    snippet: { title: `درس ${i}`, description: '', thumbnails: { medium: { url: `https://i.ytimg.com/vi/v${i}/mq.jpg` } }, publishedAt: '2026-01-01T00:00:00Z' },
    contentDetails: { videoId: `v${i}`, videoPublishedAt: '2026-01-01T00:00:00Z' },
  });
  const fetchImpl = async (url: string, init?: { headers?: Record<string, string> }) => {
    const u = new URL(url);
    const path = u.pathname.split('/').pop()!;
    calls.push(path);
    expect(init?.headers?.['X-Goog-Api-Key']).toBe('KEY');
    expect(u.searchParams.has('key')).toBe(false); // المفتاح في الترويسة لا في الرابط
    let body: unknown;
    if (path === 'channels') {
      body = { items: [{ id: 'UCxxxxxxxxxxxxxxxxxxxxxx', snippet: { title: 'مورد' }, contentDetails: { relatedPlaylists: { uploads: 'UUxx' } } }] };
    } else if (path === 'playlistItems') {
      const start = Number(u.searchParams.get('pageToken') ?? 0);
      const end = Math.min(start + 50, total);
      body = { items: Array.from({ length: end - start }, (_, k) => item(start + k)), nextPageToken: end < total ? String(end) : undefined };
    } else if (path === 'videos') {
      body = { items: u.searchParams.get('id')!.split(',').map((id) => ({ id, contentDetails: { duration: durationFor(Number(id.slice(1))) } })) };
    }
    return { ok: true, status: 200, json: async () => body, text: async () => '' };
  };
  return { yt: createYouTube('KEY', fetchImpl), calls };
}

describe('youtube client', () => {
  it('resolves a channel by handle', async () => {
    const { yt } = fakeYouTube();
    const r = await resolveChannel(yt, { handle: '@mawred' });
    expect(r).toEqual({ channelId: 'UCxxxxxxxxxxxxxxxxxxxxxx', uploadsPlaylistId: 'UUxx', title: 'مورد' });
    expect(yt.quota).toBe(1);
  });

  it('first run: pages through uploads, drops shorts, and stays cheap', async () => {
    const { yt } = fakeYouTube();
    const videos = await collectNewVideos(yt, 'UUxx', async () => new Set(), 4);
    expect(videos).toHaveLength(120 - 12); // كل عاشر فيديو قصير (45 ثانية)
    expect(videos[0]).toMatchObject({ youtubeId: 'v1', durationSec: 480, thumbnailUrl: 'https://i.ytimg.com/vi/v1/mq.jpg' });
    expect(yt.quota).toBe(3 + 3); // 3 صفحات + 3 طلبات مدد
  });

  it('daily run: stops at the first known video', async () => {
    const { yt, calls } = fakeYouTube();
    const known = new Set(Array.from({ length: 115 }, (_, i) => `v${i + 5}`)); // كل شيء معروف ما عدا أحدث 5
    const videos = await collectNewVideos(yt, 'UUxx', async (ids) => new Set(ids.filter((id) => known.has(id))), 4);
    expect(videos.map((v) => v.youtubeId)).toEqual(['v1', 'v2', 'v3', 'v4']); // v0 قصير
    expect(calls).toEqual(['playlistItems', 'videos']);
    expect(yt.quota).toBe(2);
  });

  it('respects maxPages', async () => {
    const { yt } = fakeYouTube(1000);
    await collectNewVideos(yt, 'UUxx', async () => new Set(), 2);
    expect(yt.quota).toBe(2 + 2);
  });
});

describe('channel feed (no API key)', () => {
  it('parses entries, decodes entities and thumbnails', () => {
    const { parseChannelFeed } = jest.requireActual('@/supabase/functions/_shared/youtube');
    const xml = `<feed><title>مورد</title>
      <entry><yt:videoId>abc123XYZ00</yt:videoId><title>الأحياء 12 - (9-4) إدارة &amp; حماية</title>
        <published>2024-05-01T10:00:00+00:00</published>
        <media:group><media:thumbnail url="https://i2.ytimg.com/vi/abc123XYZ00/hqdefault.jpg" width="480" height="360"/>
        <media:description>درس للصف الثاني عشر</media:description></media:group></entry>
      <entry><title>بدون معرّف</title></entry></feed>`;
    const v = parseChannelFeed(xml);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      youtubeId: 'abc123XYZ00',
      title: 'الأحياء 12 - (9-4) إدارة & حماية',
      thumbnailUrl: 'https://i2.ytimg.com/vi/abc123XYZ00/hqdefault.jpg',
      description: 'درس للصف الثاني عشر',
      durationSec: null,
    });
  });
});
