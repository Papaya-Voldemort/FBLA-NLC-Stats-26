import { getNlcData, slugify } from '$lib/server/db.js';

export async function GET() {
  const levels = ['high-school', 'collegiate'];
  const year = '2026';
  
  const urls = [];
  urls.push('https://fbla.elinelson.dev/');
  
  for (const level of levels) {
    urls.push(`https://fbla.elinelson.dev/${level}`);
    urls.push(`https://fbla.elinelson.dev/${level}/${year}`);
    urls.push(`https://fbla.elinelson.dev/${level}/${year}/states-schools`);
    urls.push(`https://fbla.elinelson.dev/${level}/${year}/search`);
    
    const dbData = await getNlcData(level, year);
    if (dbData) {
      if (dbData.workshopsData && dbData.workshopsData.length > 0) {
        urls.push(`https://fbla.elinelson.dev/${level}/${year}/workshops`);
      }
      
      // Add all events
      Object.keys(dbData.eventCounts).forEach(eventName => {
        urls.push(`https://fbla.elinelson.dev/${level}/${year}/events/${slugify(eventName)}`);
      });
      
      // Add all states
      Object.keys(dbData.stateCounts).forEach(stateName => {
        urls.push(`https://fbla.elinelson.dev/${level}/${year}/states/${slugify(stateName)}`);
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === 'https://fbla.elinelson.dev/' ? '1.0' : '0.7'}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
