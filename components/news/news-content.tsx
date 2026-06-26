import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

export async function NewsContent() {
  const allPosts = await getNewsPosts();
  const posts = getPublishedPosts(allPosts).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            Nu există noutăți publicate momentan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
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
                    <Badge className={categoryColors[post.category]}>
                      <Tag className="h-3 w-3 mr-1" />
                      {categoryLabels[post.category]}
                    </Badge>
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
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <Link href={`/noutati/${post.slug}`}>
                    <Button variant="link" className="p-0 h-auto text-primary">
                      Citește mai mult →
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export async function NewsDetailContent({ slugOrId }: { slugOrId: string }) {
  const posts = await getNewsPosts();
  const post = posts.find((p) => p.slug === slugOrId || p.id === slugOrId);

  if (!post) {
    return (
      <section className="py-20 text-center">
        <p className="text-muted-foreground mb-4">Articolul nu a fost găsit.</p>
        <Link href="/noutati">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la noutăți
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <article className="py-12">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <Link href="/noutati">
          <Button variant="ghost" className="gap-2 mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Button>
        </Link>
        <Badge className={`mb-4 ${categoryColors[post.category]}`}>
          {categoryLabels[post.category]}
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
          {post.title}
        </h1>
        <time dateTime={post.date} className="text-sm text-muted-foreground block mb-8">
          {new Date(post.date).toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-border mb-8">
          <Image src={post.image} alt={post.title} fill className="object-cover" />
        </div>
        <div className="prose prose-invert max-w-none">
          {post.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed text-lg mb-4">
              {paragraph}
            </p>
          ))}
          <p className="text-muted-foreground leading-relaxed mt-4">
            Pentru mai multe informații sau rezervări, contactați-ne la{' '}
            <Link href="/contact" className="text-primary hover:underline">
              pagina de contact
            </Link>{' '}
            sau sunați-ne direct.
          </p>
        </div>
      </div>
    </article>
  );
}
