import fs from 'fs';

const hs = JSON.parse(fs.readFileSync('public/data/high-school/2026/schedules.json', 'utf8'));
const col = JSON.parse(fs.readFileSync('public/data/collegiate/2026/schedules.json', 'utf8'));

const hsEvents = new Set(hs.map(e => e.event_name));
const colEvents = new Set(col.map(e => e.event_name));

console.log('High School 2026 unique events:', hsEvents.size);
console.log('Collegiate 2026 unique events:', colEvents.size);
console.log('High School events sample:', Array.from(hsEvents).slice(0, 10));
console.log('Collegiate events sample:', Array.from(colEvents).slice(0, 10));
