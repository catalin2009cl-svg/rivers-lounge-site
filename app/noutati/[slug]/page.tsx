import { SiteLayout } from '@/components/layout/site-layout';
import { NewsDetailContent } from '@/components/news/news-content';
import { getNewsPosts } from '@/lib/server-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = await getNewsPosts();
  const post = posts.find((p) => p.slug === slug || p.id === slug);
  if (!post) return { title: "Noutăți | River's Lounge" };
  return {
    title: `${post.title} | River's Lounge`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.image ? [{ url: post.image, width: 1200, height: 630 }] : [],
      type: 'article',
      locale: 'ro_RO',
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <SiteLayout>
      <NewsDetailContent slugOrId={slug} />
    </SiteLayout>
  );
}
