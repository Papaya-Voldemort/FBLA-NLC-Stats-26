import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve('dist');
const PUBLIC_DIR = path.resolve('public');

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function deduplicateEntries(data) {
  const map = new Map();
  data.forEach(entry => {
    const sortedComp = [...entry.competitors].sort().map(n => n.trim().toLowerCase()).join('|');
    const key = `${entry.event_name}::${entry.state}::${entry.school_name}::${sortedComp}`;
    if (!map.has(key)) {
      map.set(key, { ...entry });
    } else {
      const existing = map.get(key);
      if (!existing.arrival_time && entry.arrival_time) {
        existing.arrival_time = entry.arrival_time;
        existing.page = entry.page;
        existing.event_when = entry.event_when;
        existing.event_location = entry.event_location;
      }
    }
  });
  return Array.from(map.values());
}

let htmlTemplate;

async function run() {
  console.log('Starting SEO Prerendering...');
  
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('dist/index.html template not found! Make sure to run the build first.');
    process.exit(1);
  }
  htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  // Load datasets
  const hsSchedules = deduplicateEntries(JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'data/high-school/2026/schedules.json'), 'utf8')));
  const colSchedules = deduplicateEntries(JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'data/collegiate/2026/schedules.json'), 'utf8')));
  
  let colWinners = null;
  try {
    colWinners = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'data/collegiate/2026/winners.json'), 'utf8'));
  } catch (e) {
    console.warn('Collegiate winners not loaded.');
  }

  let hsWorkshops = [];
  try {
    hsWorkshops = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'data/high-school/2026/workshops.json'), 'utf8'));
  } catch (e) {
    console.warn('High School workshops not loaded.');
  }

  const sitemapUrls = [];
  sitemapUrls.push({ url: '/', priority: '1.0', changefreq: 'daily' });

  const configs = [
    {
      level: 'high-school',
      levelLabel: 'High School & Middle School',
      schedules: hsSchedules,
      workshops: hsWorkshops,
      winners: null
    },
    {
      level: 'collegiate',
      levelLabel: 'Collegiate',
      schedules: colSchedules,
      workshops: [],
      winners: colWinners
    }
  ];

  for (const config of configs) {
    const { level, levelLabel, schedules, workshops, winners } = config;
    const levelShort = level === 'collegiate' ? 'Collegiate' : 'HS/MS';
    const year = 2026;
    
    // Group states
    const stateCounts = {};
    const schoolCounts = {};
    const eventDetails = {};
    
    schedules.forEach(entry => {
      // Competitor counting
      entry.competitors.forEach(comp => {
        const cleanedComp = comp.trim().toLowerCase();
        const uniqueKey = `${cleanedComp}||${entry.school_name.toLowerCase()}||${entry.state.toLowerCase()}`;
        
        if (!stateCounts[entry.state]) stateCounts[entry.state] = new Set();
        stateCounts[entry.state].add(uniqueKey);
        
        if (!schoolCounts[entry.school_name]) schoolCounts[entry.school_name] = new Set();
        schoolCounts[entry.school_name].add(uniqueKey);
      });

      // Event details
      if (!eventDetails[entry.event_name]) {
        eventDetails[entry.event_name] = {
          name: entry.event_name,
          division: entry.division,
          whens: new Set(),
          locations: new Set(),
          entries: []
        };
      }
      eventDetails[entry.event_name].entries.push(entry);
      if (entry.event_when) eventDetails[entry.event_name].whens.add(entry.event_when);
      if (entry.event_location) eventDetails[entry.event_name].locations.add(entry.event_location);
    });

    const statesList = Object.keys(stateCounts).sort();
    const sortedStates = statesList.map(st => [st, stateCounts[st].size]).sort((a, b) => b[1] - a[1]);
    const sortedSchools = Object.keys(schoolCounts).map(sch => {
      const match = schedules.find(e => e.school_name === sch);
      return [sch, schoolCounts[sch].size, match?.division || 'HS'];
    }).sort((a, b) => b[1] - a[1]);

    // 1. Division Overview Page
    const overviewPath = `/${level}/${year}`;
    const overviewTitle = `FBLA ${levelShort} NLC ${year} Stats & Schedules`;
    const overviewDesc = `Explore registration statistics, school chapters leaderboard, state association rankings, and competitive event schedules for FBLA ${levelLabel} at the ${year} National Leadership Conference.`;
    
    let overviewNoScript = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
        <h1>FBLA ${levelLabel} National Leadership Conference (NLC) ${year} Registration & Schedule Breakdown</h1>
        <p>Welcome to the unofficial <strong>FBLA ${levelLabel} NLC Stats Tracker</strong>, a community-driven analytics dashboard for the ${year} NLC.</p>
        
        <h2>Dashboard Views</h2>
        <ul>
          <li><a href="/${level}/${year}/events" style="color: #FFC72C; font-weight: bold;">Competitive Events Explorer</a></li>
          <li><a href="/${level}/${year}/states-schools" style="color: #FFC72C; font-weight: bold;">States & Chapters Leaderboards</a></li>
          <li><a href="/${level}/${year}/search" style="color: #FFC72C; font-weight: bold;">Competitor Schedule Finder</a></li>
          ${workshops.length > 0 ? `<li><a href="/${level}/${year}/workshops" style="color: #FFC72C; font-weight: bold;">Professional Development Workshops</a></li>` : ''}
        </ul>

        <h2>Divisions & Roster Insights</h2>
        <ul>
          <li><strong>Total Scheduled Competitors:</strong> ${schedules.reduce((acc, curr) => acc + curr.team_size, 0)} entries</li>
          <li><strong>Unique Competitors Analyzed:</strong> ${Object.values(schoolCounts).reduce((acc, set) => acc + set.size, 0)} student leaders</li>
          <li><strong>FBLA State Associations:</strong> ${statesList.length} represented</li>
        </ul>

        <h2>Top 10 State Delegations</h2>
        <ol>
          ${sortedStates.slice(0, 10).map(([st, count]) => `<li><strong>${st} FBLA:</strong> ${count} competitors</li>`).join('\n')}
        </ol>
      </div>
    `;
    
    writePrerenderedPage(overviewPath, overviewTitle, overviewDesc, overviewNoScript);
    sitemapUrls.push({ url: overviewPath, priority: '0.9', changefreq: 'weekly' });

    // 2. Tab pages
    const tabs = [
      {
        id: 'events',
        title: `FBLA ${levelShort} NLC ${year} Competitive Events`,
        desc: `Browse schedules, test times, presentation arrival configurations, and national results for all ${Object.keys(eventDetails).length} FBLA ${levelLabel} competitive events.`,
        noscript: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
            <h1>FBLA ${levelLabel} NLC ${year} Competitive Events</h1>
            <p>Select a competitive event below to view its specific presentation times, location, and scheduled competitor rosters.</p>
            <h2>Available Events (${Object.keys(eventDetails).length})</h2>
            <ul style="column-count: 2; list-style-type: none; padding: 0;">
              ${Object.keys(eventDetails).sort().map(evName => {
                const slug = slugify(evName);
                return `<li style="margin-bottom: 8px;"><a href="/${level}/${year}/events/${slug}" style="color: #FFC72C; text-decoration: none;">${evName}</a></li>`;
              }).join('\n')}
            </ul>
          </div>
        `
      },
      {
        id: 'states-schools',
        title: `FBLA ${levelShort} NLC ${year} State & Chapter Standings`,
        desc: `State association rankings and local chapter competitor counts for FBLA ${levelLabel} Division at the ${year} NLC.`,
        noscript: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
            <h1>FBLA ${levelLabel} NLC ${year} State Standings & Chapters</h1>
            
            <h2>State Associations Ranks</h2>
            <p>Explore competitor lists for each state delegation:</p>
            <ul style="column-count: 2; list-style-type: none; padding: 0;">
              ${sortedStates.map(([st, count]) => {
                const slug = slugify(st);
                return `<li style="margin-bottom: 8px;"><a href="/${level}/${year}/states/${slug}" style="color: #FFC72C; text-decoration: none;"><strong>${st} FBLA:</strong> ${count} competitors</a></li>`;
              }).join('\n')}
            </ul>

            <h2>Top 50 Local Chapters (Schools)</h2>
            <ol>
              ${sortedSchools.slice(0, 50).map(([sch, count, div]) => `<li><strong>${sch}</strong> (${div}): ${count} competitors</li>`).join('\n')}
            </ol>
          </div>
        `
      },
      {
        id: 'search',
        title: `FBLA ${levelShort} NLC ${year} Competitor Search`,
        desc: `Search tool to look up FBLA competitor testing hours, presentation locations, and schedules for the ${year} National Leadership Conference.`,
        noscript: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
            <h1>FBLA ${levelLabel} NLC ${year} Competitor & Roster Lookup</h1>
            <p>Search for competitive events schedules by state or school chapter to find individual test times and presentation slots.</p>
            <p>Use the interactive dashboard to perform real-time search across all ${schedules.reduce((acc, curr) => acc + curr.team_size, 0)} registered slots.</p>
            <h3>How to Find Roster Schedules:</h3>
            <ul>
              <li>Go to the <a href="/${level}/${year}/states-schools" style="color: #FFC72C;">States & Chapters</a> explorer to browse by delegation.</li>
              <li>Go to the <a href="/${level}/${year}/events" style="color: #FFC72C;">Events Explorer</a> to browse schedules for individual competitions.</li>
            </ul>
          </div>
        `
      }
    ];

    if (workshops.length > 0) {
      tabs.push({
        id: 'workshops',
        title: `FBLA NLC ${year} Workshops & Speakers`,
        desc: `Complete schedule of training sessions, leadership seminars, and professional workshops available at the FBLA NLC ${year}.`,
        noscript: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
            <h1>FBLA NLC ${year} Professional Development Workshops</h1>
            <p>Enhance your leadership potential by attending these official FBLA workshops during the National Leadership Conference.</p>
            
            <h2>Scheduled Workshops (${workshops.length})</h2>
            ${workshops.map(ws => `
              <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 16px 0;">
                <h3 style="color: #FFC72C; margin-top: 0;">${ws.name || ws.title}</h3>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Presenter:</strong> ${ws.presenter || 'Guest Speaker'} | <strong>Time:</strong> ${ws.time || ws.date_time || 'Scheduled'}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${ws.location || 'Conference Center'}</p>
                ${ws.description ? `<p style="opacity: 0.8; font-size: 13px;">${ws.description}</p>` : ''}
              </div>
            `).join('\n')}
          </div>
        `
      });
    }

    for (const tab of tabs) {
      const tabPath = `/${level}/${year}/${tab.id}`;
      writePrerenderedPage(tabPath, tab.title, tab.desc, tab.noscript);
      sitemapUrls.push({ url: tabPath, priority: '0.8', changefreq: 'weekly' });
    }

    // 3. Event Detail Pages
    for (const evName of Object.keys(eventDetails)) {
      const detail = eventDetails[evName];
      const slug = slugify(evName);
      const eventPath = `/${level}/${year}/events/${slug}`;
      const eventTitle = `${evName} Schedule & Winners | FBLA ${levelShort} ${year}`;
      
      const locList = Array.from(detail.locations).filter(Boolean);
      const whenList = Array.from(detail.whens).filter(Boolean);
      const locationText = locList.length > 0 ? locList.join(', ') : 'Stars at Night / Assigned Locations';
      const whenText = whenList.length > 0 ? whenList.join(', ') : 'Scheduled Session';
      
      const eventDesc = `Scheduled competitors, presentation test times, and locations for the FBLA ${levelLabel} ${evName} event at the NLC ${year} in ${locationText}.`;
      
      // Standings section (if winners exist)
      let winnersHtml = '';
      if (winners && winners[evName]) {
        const topWinners = winners[evName];
        winnersHtml = `
          <h2>National Top 10 Winners</h2>
          <table border="1" cellpadding="8" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-color: rgba(255,255,255,0.2);">
            <thead>
              <tr style="background: rgba(255,199,44,0.1); color: #FFC72C;">
                <th align="left">Place</th>
                <th align="left">Competitor(s)</th>
                <th align="left">School (Chapter)</th>
                <th align="left">State</th>
              </tr>
            </thead>
            <tbody>
              ${topWinners.map(w => `
                <tr>
                  <td><strong>${w.rank || w.place || ''}</strong></td>
                  <td>${w.competitors ? w.competitors.join(', ') : (w.name || 'Competitor')}</td>
                  <td>${w.school_name || w.school || 'Chapter'}</td>
                  <td>${w.state}</td>
                </tr>
              `).join('\n')}
            </tbody>
          </table>
        `;
      }

      // Roster section
      const entriesSorted = detail.entries.sort((a, b) => a.school_name.localeCompare(b.school_name));
      const rosterTable = `
        <h2>Scheduled Roster & Presentation Times</h2>
        <p>Total competitor entries: ${entriesSorted.length}</p>
        <table border="1" cellpadding="8" style="width: 100%; border-collapse: collapse; border-color: rgba(255,255,255,0.1);">
          <thead>
            <tr style="background: rgba(255,255,255,0.05);">
              <th align="left">School Chapter</th>
              <th align="left">State</th>
              <th align="left">Competitors</th>
              <th align="left">Section</th>
              <th align="left">Time</th>
            </tr>
          </thead>
          <tbody>
            ${entriesSorted.map(entry => `
              <tr>
                <td><strong>${entry.school_name}</strong></td>
                <td>${entry.state}</td>
                <td>${entry.competitors.join(', ')}</td>
                <td><span style="background: rgba(255,199,44,0.1); color: #FFC72C; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${entry.section_name || 'Main'}</span></td>
                <td>${entry.arrival_time || 'Scheduled'}</td>
              </tr>
            `).join('\n')}
          </tbody>
        </table>
      `;

      const eventNoScript = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
          <a href="/${level}/${year}/events" style="color: #FFC72C; text-decoration: none;">&larr; Back to ${levelLabel} Events</a>
          <h1>${evName} - FBLA ${levelLabel} NLC ${year}</h1>
          
          <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Division:</strong> FBLA ${levelLabel}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${locationText}</p>
            <p style="margin: 4px 0;"><strong>Schedule:</strong> ${whenText}</p>
          </div>

          ${winnersHtml}
          ${rosterTable}
        </div>
      `;

      writePrerenderedPage(eventPath, eventTitle, eventDesc, eventNoScript);
      sitemapUrls.push({ url: eventPath, priority: '0.7', changefreq: 'weekly' });
    }

    // 4. State Detail Pages
    for (const stateName of statesList) {
      const stateSlug = slugify(stateName);
      const statePath = `/${level}/${year}/states/${stateSlug}`;
      const stateTitle = `${stateName} FBLA Roster & Schedules | NLC ${year}`;
      const stateDesc = `Complete team roster, scheduled events, and presentation times for all FBLA competitors representing ${stateName} at the ${year} National Leadership Conference.`;
      
      const stateEntries = schedules.filter(e => e.state === stateName).sort((a, b) => a.school_name.localeCompare(b.school_name));
      const uniqueCompetitors = Array.from(stateCounts[stateName]);

      const stateNoScript = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e2e8f0; background: #0f172a;">
          <a href="/${level}/${year}/states-schools" style="color: #FFC72C; text-decoration: none;">&larr; Back to ${levelLabel} States</a>
          <h1>${stateName} FBLA - NLC ${year} Roster & Schedule</h1>
          
          <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Division:</strong> FBLA ${levelLabel}</p>
            <p style="margin: 4px 0;"><strong>Total Scheduled Entries:</strong> ${stateEntries.length} competitions</p>
            <p style="margin: 4px 0;"><strong>Unique Competitors:</strong> ${uniqueCompetitors.length} student leaders</p>
          </div>

          <h2>Competitor Entries & Presentation Times</h2>
          <table border="1" cellpadding="8" style="width: 100%; border-collapse: collapse; border-color: rgba(255,255,255,0.1);">
            <thead>
              <tr style="background: rgba(255,255,255,0.05);">
                <th align="left">School Chapter</th>
                <th align="left">Competitor(s)</th>
                <th align="left">Competitive Event</th>
                <th align="left">Section</th>
                <th align="left">Time</th>
              </tr>
            </thead>
            <tbody>
              ${stateEntries.map(entry => `
                <tr>
                  <td><strong>${entry.school_name}</strong></td>
                  <td>${entry.competitors.join(', ')}</td>
                  <td><a href="/${level}/${year}/events/${slugify(entry.event_name)}" style="color: #FFC72C; text-decoration: none;">${entry.event_name}</a></td>
                  <td>${entry.section_name || 'Main'}</td>
                  <td>${entry.arrival_time || 'Scheduled'}</td>
                </tr>
              `).join('\n')}
            </tbody>
          </table>
        </div>
      `;

      writePrerenderedPage(statePath, stateTitle, stateDesc, stateNoScript);
      sitemapUrls.push({ url: statePath, priority: '0.6', changefreq: 'weekly' });
    }
  }

  // Generate sitemap.xml
  generateSitemap(sitemapUrls);
  console.log(`SEO Prerendering completed. Generated ${sitemapUrls.length} pages.`);
}

function formatLevelName(level) {
  return level === 'collegiate' ? 'Collegiate' : 'High School';
}

function generateJsonLd(urlPath, title, description) {
  const baseUrl = 'https://fbla.elinelson.dev';
  const canonicalUrl = `${baseUrl}${urlPath === '/' ? '' : urlPath}`;
  
  const baseSchema = {
    "@context": "https://schema.org",
  };

  const parts = urlPath.split('/').filter(Boolean);

  // 1. Homepage
  if (parts.length === 0) {
    return {
      ...baseSchema,
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": `${baseUrl}/#webapplication`,
          "name": "FBLA NLC 2026 Stats: Registration & Schedules",
          "url": baseUrl,
          "description": description,
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "All",
          "browserRequirements": "Requires HTML5 and JavaScript.",
          "author": {
            "@type": "Organization",
            "name": "FBLA Community"
          }
        },
        {
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          "url": baseUrl,
          "name": "FBLA NLC 2026 Stats & Schedules",
          "description": description
        }
      ]
    };
  }

  const level = parts[0];
  const year = parts[1];
  const levelLabel = formatLevelName(level);
  
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": baseUrl
    }
  ];
  
  // Overview page: /level/year
  if (parts.length === 2) {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 2,
      "name": `${levelLabel} ${year}`,
      "item": canonicalUrl
    });
  } else if (parts.length === 3) {
    const tabId = parts[2];
    let tabName = tabId.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (tabId === 'states-schools') tabName = 'States & Chapters';
    
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 2,
      "name": `${levelLabel} ${year}`,
      "item": `${baseUrl}/${level}/${year}`
    });
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": tabName,
      "item": canonicalUrl
    });
  } else if (parts.length === 4) {
    const section = parts[2]; // 'events' or 'states'
    const sectionUrl = section === 'events' ? 'events' : 'states-schools';
    
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 2,
      "name": `${levelLabel} ${year}`,
      "item": `${baseUrl}/${level}/${year}`
    });
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": section === 'events' ? 'Competitive Events' : 'State Associations',
      "item": `${baseUrl}/${level}/${year}/${sectionUrl}`
    });
    
    let detailName = title.split(' | ')[0].split(' - ')[0];
    detailName = detailName.replace(' Schedule & Winners', '').replace(' Roster & Schedules', '');
    
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 4,
      "name": detailName,
      "item": canonicalUrl
    });
  }

  const graph = [
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": title,
      "description": description,
      "isPartOf": {
        "@id": `${baseUrl}/#website`
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      "itemListElement": breadcrumbs
    }
  ];

  return {
    ...baseSchema,
    "@graph": graph
  };
}

function writePrerenderedPage(urlPath, title, description, noscriptHtml) {
  const fileDir = path.join(DIST_DIR, urlPath);
  ensureDir(fileDir);
  const filePath = path.join(fileDir, 'index.html');

  // Generate html template with replaced variables
  let content = htmlTemplate;

  // Replace Title tags
  content = content.replace(/<title>[^<]*<\/title>/g, `<title>${title}</title>`);
  content = content.replace(/<meta name="title" content="[^"]*">/g, `<meta name="title" content="${title}">`);
  content = content.replace(/<meta property="og:title" content="[^"]*">/g, `<meta property="og:title" content="${title}">`);
  content = content.replace(/<meta property="twitter:title" content="[^"]*">/g, `<meta property="twitter:title" content="${title}">`);

  // Replace Description tags
  content = content.replace(/<meta name="description" content="[^"]*">/g, `<meta name="description" content="${description}">`);
  content = content.replace(/<meta property="og:description" content="[^"]*">/g, `<meta property="og:description" content="${description}">`);
  content = content.replace(/<meta property="twitter:description" content="[^"]*">/g, `<meta property="twitter:description" content="${description}">`);

  // Replace Canonical URL
  const canonicalUrl = `https://fbla.elinelson.dev${urlPath}`;
  content = content.replace(/<link rel="canonical" href="[^"]*">/g, `<link rel="canonical" href="${canonicalUrl}">`);
  content = content.replace(/<meta property="og:url" content="[^"]*">/g, `<meta property="og:url" content="${canonicalUrl}">`);
  content = content.replace(/<meta property="twitter:url" content="[^"]*">/g, `<meta property="twitter:url" content="${canonicalUrl}">`);

  // Replace <noscript> block
  content = content.replace(/<noscript>[\s\S]*?<\/noscript>/g, `<noscript>${noscriptHtml}</noscript>`);

  // Replace Structured Data JSON-LD
  const jsonLd = generateJsonLd(urlPath, title, description);
  content = content.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`);

  fs.writeFileSync(filePath, content, 'utf8');
}

function generateSitemap(urls) {
  const currentBuildDate = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>https://fbla.elinelson.dev${u.url}</loc>
    <lastmod>${currentBuildDate}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log('Saved dynamic sitemap to dist/sitemap.xml');
}

run();
