import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/cont/', '/recenzie'],
      },
    ],
    sitemap: 'https://riverslounge.ro/sitemap.xml',
    host: 'https://riverslounge.ro',
  };
}
