import { getSocialSettings } from '@/lib/server-data';

function extractTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

export async function SocialSection() {
  const settings = await getSocialSettings();

  const showFb = settings.showFacebook && settings.facebookVideos.length > 0;
  const showTt = settings.showTiktok && settings.tiktokVideos.length > 0;

  if (!showFb && !showTt) return null;

  type VideoItem =
    | { platform: 'facebook'; id: string; url: string }
    | { platform: 'tiktok'; id: string; embedId: string };

  const videos: VideoItem[] = [];

  if (showFb) {
    for (const v of settings.facebookVideos.slice(0, 3)) {
      videos.push({ platform: 'facebook', id: v.id, url: v.url });
    }
  }
  if (showTt) {
    for (const v of settings.tiktokVideos.slice(0, 3)) {
      const embedId = extractTikTokId(v.url);
      if (embedId) videos.push({ platform: 'tiktok', id: v.id, embedId });
    }
  }

  if (videos.length === 0) return null;

  const gridClass =
    videos.length === 1
      ? 'grid-cols-1'
      : videos.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-20 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Urmărește-ne pe <span className="text-primary">Social Media</span>
          </h2>
          <p className="text-muted-foreground">
            Fii la curent cu ultimele noutăți și momente speciale
          </p>
        </div>

        <div className={`grid gap-6 justify-items-center ${gridClass}`}>
          {videos.map((video) => {
            if (video.platform === 'facebook') {
              return (
                <div
                  key={`fb-${video.id}`}
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#1A1A1A',
                    border: '1px solid #2E2E2E',
                    width: 325,
                    height: 575,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/*
                    Facebook video/reel embed — funcționează pe localhost ȘI pe domeniu live.
                    Nu necesită înregistrare Meta (spre deosebire de Page Plugin).
                  */}
                  <iframe
                    src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&width=325&show_text=false&height=575`}
                    width="325"
                    height="575"
                    style={{ border: 'none', display: 'block' }}
                    scrolling="no"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                </div>
              );
            }

            // TikTok
            return (
              <iframe
                key={`tt-${video.id}`}
                src={`https://www.tiktok.com/embed/v2/${video.embedId}`}
                width="325"
                height="575"
                style={{ border: 'none', maxWidth: '100%', borderRadius: '12px' }}
                frameBorder={0}
                scrolling="no"
                allowFullScreen
                allow="encrypted-media; picture-in-picture"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
