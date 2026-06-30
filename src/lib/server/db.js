import fs from 'fs';
import path from 'path';

// Memory cache for the datasets
const cache = {};

export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
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

export async function getNlcData(level, year = '2026') {
  const cacheKey = `${level}-${year}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  // Use a promise for the cache to prevent concurrent identical reads
  const dataPromise = (async () => {
    // Load datasets
    const publicDir = path.resolve('public');
    const schedulesPath = path.join(publicDir, `data/${level}/${year}/schedules.json`);

    let schedulesRawStr;
    try {
      schedulesRawStr = await fs.promises.readFile(schedulesPath, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }

    const schedulesRaw = JSON.parse(schedulesRawStr);
    const allData = deduplicateEntries(schedulesRaw);

    let winnersData = null;
    try {
      const winnersPath = path.join(publicDir, `data/${level}/${year}/winners.json`);
      const winnersRawStr = await fs.promises.readFile(winnersPath, 'utf8');
      winnersData = JSON.parse(winnersRawStr);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`Winners error for ${level}/${year}: ${e.message}`);
      }
    }

    let workshopsData = [];
    try {
      const workshopsPath = path.join(publicDir, `data/${level}/${year}/workshops.json`);
      const workshopsRawStr = await fs.promises.readFile(workshopsPath, 'utf8');
      workshopsData = JSON.parse(workshopsRawStr);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`Workshops error for ${level}/${year}: ${e.message}`);
      }
    }

  // Group stats
  const stateUniqueCompetitors = {};
  const schoolUniqueCompetitors = {};
  const eventCounts = {};
  const eventDetails = {};

  allData.forEach(entry => {
    if (!stateUniqueCompetitors[entry.state]) {
      stateUniqueCompetitors[entry.state] = new Set();
    }
    if (!schoolUniqueCompetitors[entry.school_name]) {
      schoolUniqueCompetitors[entry.school_name] = new Set();
    }

    entry.competitors.forEach(comp => {
      const cleanedComp = comp.trim().toLowerCase();
      const uniqueKey = `${cleanedComp}||${entry.school_name.toLowerCase()}||${entry.state.toLowerCase()}`;
      stateUniqueCompetitors[entry.state].add(uniqueKey);
      schoolUniqueCompetitors[entry.school_name].add(uniqueKey);
    });

    eventCounts[entry.event_name] = (eventCounts[entry.event_name] || 0) + entry.team_size;

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
    if (entry.event_location) {
      eventDetails[entry.event_name].locations.add(entry.event_location);
    } else {
      eventDetails[entry.event_name].locations.add("Stars at Night");
    }
  });

  const stateCounts = {};
  Object.keys(stateUniqueCompetitors).forEach(state => {
    stateCounts[state] = stateUniqueCompetitors[state].size;
  });

  const schoolCounts = {};
  Object.keys(schoolUniqueCompetitors).forEach(school => {
    schoolCounts[school] = schoolUniqueCompetitors[school].size;
  });

  // Convert Sets to Arrays in eventDetails for serialization
  const serializedEventDetails = {};
  Object.keys(eventDetails).forEach(name => {
    const detail = eventDetails[name];
    serializedEventDetails[name] = {
      ...detail,
      whens: Array.from(detail.whens),
      locations: Array.from(detail.locations)
    };
  });

  const result = {
    allData,
    winnersData,
    workshopsData,
    stateCounts,
    schoolCounts,
    eventCounts,
    eventDetails: serializedEventDetails
  };

    return result;
  })();

  cache[cacheKey] = dataPromise;

  try {
    return await dataPromise;
  } catch (e) {
    // Ensure failed promises are not cached
    delete cache[cacheKey];
    throw e;
  }
}
