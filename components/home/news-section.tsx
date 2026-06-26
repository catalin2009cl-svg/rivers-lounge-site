import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNewsPosts, getPublishedPosts } from '@/lib/server-data';

const categoryLabels: Record<string, string> = {
  events: 'Eveniment',
  'daily-menu': 'Meniul Zilei',
  promotions: 'Promoție',
};

const categoryColors: Record<string, string> = {
  events: 'bg-blue-500/20 text-blue-400',
  'daily-menu': 'bg-green-500/20 text-green-400',
  promotions: 'bg-primary/20 text-primary',
};

export async function NewsSection() {
  const allPosts = await getNewsPosts();
  const latestPosts = getPublishedPosts(allPosts)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (latestPosts.length === 0) return null;

  return (
    <section className="py-20 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Noutăți & <span className="text-primary">Evenimente</span>
            </h2>
            <p className="text-muted-foreground">
              Află ultimele noutăți, evenimente și promoții de la River&apos;s Lounge
            </p>
          </div>
          <Link href="/noutati">
            <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
              Vezi toate
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPosts.map((post) => (
            <article
              key={post.id}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${categoryColors[post.category]}`}>
                    <Tag className="h-3 w-3" />
                    {categoryLabels[post.category]}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <Link
                  href={`/noutati/${post.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Citește mai mult
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
