import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://riverslounge.ro';
  const now = new Date();

  const pages: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }> = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/meniu', priority: 0.9, changeFrequency: 'daily' },
    { path: '/rezervari', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/cabana', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/rivers-land', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/rivers-marina', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/catering', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/noutati', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/despre', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/cariere', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/suport', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/confidentialitate', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/termeni', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
  ];

  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
