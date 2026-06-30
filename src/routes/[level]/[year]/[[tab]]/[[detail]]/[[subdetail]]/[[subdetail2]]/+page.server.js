import { getNlcData } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export async function load({ params, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=3600, s-maxage=3600'
  });
  const { level, year, tab, detail, subdetail, subdetail2 } = params;
  
  if (year !== '2026') {
    throw error(404, 'Only 2026 NLC data is currently supported.');
  }
  
  const dbData = await getNlcData(level, year);
  
  if (!dbData) {
    throw error(404, `Data not found for division '${level}' and year '${year}'.`);
  }
  
  return {
    level,
    year,
    tab: tab || 'overview',
    detail: detail || null,
    subdetail: subdetail || null,
    subdetail2: subdetail2 || null,
    allData: dbData.allData,
    winnersData: dbData.winnersData,
    workshopsData: dbData.workshopsData,
    stateCounts: dbData.stateCounts,
    schoolCounts: dbData.schoolCounts,
    eventCounts: dbData.eventCounts,
    eventDetails: dbData.eventDetails
  };
}
