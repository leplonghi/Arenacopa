const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.sitemapProxy = onRequest({ maxInstances: 10 }, async (req, res) => {
  const SITE_URL = 'https://arenacup.com.br';
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Helper to add URLs
  const addUrl = (url, changefreq = 'daily', priority = '0.8') => {
    sitemap += `
  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  };

  // 1. Static Routes
  const staticRoutes = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/boloes', changefreq: 'hourly', priority: '0.9' },
    { url: '/descobrir', changefreq: 'hourly', priority: '0.9' },
    { url: '/campeonatos', changefreq: 'daily', priority: '0.8' },
    { url: '/ranking', changefreq: 'hourly', priority: '0.8' },
    { url: '/noticias', changefreq: 'hourly', priority: '0.8' },
    { url: '/grupos', changefreq: 'daily', priority: '0.8' },
    { url: '/negocios', changefreq: 'weekly', priority: '0.7' }
  ];

  staticRoutes.forEach(route => addUrl(route.url, route.changefreq, route.priority));

  try {
    // 2. Dynamic Routes: Public Boloes
    const publicBoloesRef = await db.collection('boloes')
      .where('is_private', '==', false)
      .where('status', '==', 'active')
      .limit(1000)
      .get();
      
    publicBoloesRef.docs.forEach(doc => {
      addUrl(`/boloes/entrar/${doc.id}`, 'weekly', '0.7');
    });

    // 3. Dynamic Routes: Public Groups
    const publicGroupsRef = await db.collection('groups')
      .where('is_private', '==', false)
      .where('status', '==', 'active')
      .limit(100)
      .get();
      
    publicGroupsRef.docs.forEach(doc => {
      addUrl(`/grupos/entrar/${doc.id}`, 'weekly', '0.7');
    });

    // 4. Dynamic Routes: Championships
    const championshipsRef = await db.collection('championships')
      .where('status', '==', 'active')
      .limit(50)
      .get();
      
    championshipsRef.docs.forEach(doc => {
      addUrl(`/campeonato/${doc.id}`, 'daily', '0.8');
    });

  } catch (error) {
    console.error('Error generating sitemap dynamic URLs:', error);
    // Even if db query fails, we return static URLs so site isn't fully removed from index
  }

  sitemap += `\n</urlset>`;

  res.set('Content-Type', 'text/xml');
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=10800'); // Cache for 1-3 hours
  res.status(200).send(sitemap);
});
