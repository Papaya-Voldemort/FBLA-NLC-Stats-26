<script>
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import Header from './components/Header.svelte';
  import Overview from './components/Overview.svelte';
  import EventExplorer from './components/EventExplorer.svelte';
  import StateSchoolExplorer from './components/StateSchoolExplorer.svelte';
  import CompetitorFinder from './components/CompetitorFinder.svelte';

  // Reactivity state via Runes
  let allData = $state([]);
  let loading = $state(true);
  let activeTab = $state('overview');
  let activeEventId = $state(null);
  let currentTheme = $state('dark');

  // Aggregated data
  let stateCounts = $state({});
  let schoolCounts = $state({});
  let eventCounts = $state({});
  let eventDetails = $state({});

  onMount(async () => {
    // Init theme from localStorage
    const savedTheme = localStorage.getItem('fbla-analytics-theme') || 'dark';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);

    try {
      const res = await fetch('/data.json');
      const data = await res.json();
      allData = data;
      
      processAnalytics(data);
      loading = false;
    } catch (err) {
      console.error('Error fetching NLC data:', err);
    }
  });

  // Effect to update theme on the DOM
  $effect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('fbla-analytics-theme', currentTheme);
  });

  function processAnalytics(data) {
    const sC = {};
    const schC = {};
    const eC = {};
    const eD = {};

    data.forEach(entry => {
      sC[entry.state] = (sC[entry.state] || 0) + entry.team_size;
      schC[entry.school_name] = (schC[entry.school_name] || 0) + entry.team_size;
      eC[entry.event_name] = (eC[entry.event_name] || 0) + entry.team_size;

      if (!eD[entry.event_name]) {
        eD[entry.event_name] = {
          name: entry.event_name,
          division: entry.division,
          whens: new Set(),
          locations: new Set(),
          entries: []
        };
      }
      eD[entry.event_name].entries.push(entry);
      if (entry.event_when) eD[entry.event_name].whens.add(entry.event_when);
      if (entry.event_location) {
        eD[entry.event_name].locations.add(entry.event_location);
      } else {
        eD[entry.event_name].locations.add("Stars at Night");
      }
    });

    stateCounts = sC;
    schoolCounts = schC;
    eventCounts = eC;
    eventDetails = eD;
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  }

  function switchTab(tabId) {
    activeTab = tabId;
    if (tabId === 'events' && !activeEventId && Object.keys(eventCounts).length > 0) {
      // Select first event in list as default
      activeEventId = Object.keys(eventCounts).sort()[0];
    }
  }

  function handleEventSelect(eventName) {
    activeEventId = eventName;
    switchTab('events');
  }
</script>

<Header 
  {activeTab} 
  theme={currentTheme}
  onTabChange={switchTab} 
  onThemeToggle={toggleTheme} 
/>

<main class="container">
  {#if loading}
    <div id="loading-overlay" class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:60px 20px; margin-bottom: 24px;">
      <Icon icon="lucide:loader-2" width="40" height="40" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
      <div style="font-family:'Outfit'; font-weight:700; font-size:18px;">Parsing & Loading Registration Data...</div>
      <p style="color:var(--text-secondary); font-size:14px; max-width:400px; text-align:center;">Analyzing 8,646 entries from the NLC database. This will take just a second.</p>
    </div>
  {:else}
    {#if activeTab === 'overview'}
      <Overview 
        {allData} 
        {stateCounts} 
        {schoolCounts} 
        {eventCounts} 
        {eventDetails}
        theme={currentTheme}
        onSelectEvent={handleEventSelect}
      />
    {:else}
      <!-- Wrap tabs in hidden/active state to maintain browser scroll states & DOM instances -->
      <div class={activeTab === 'events' ? 'tab-content active' : 'tab-content'}>
        <EventExplorer 
          {eventCounts} 
          {eventDetails} 
          bind:activeEventId
        />
      </div>

      <div class={activeTab === 'states-schools' ? 'tab-content active' : 'tab-content'}>
        <StateSchoolExplorer 
          {allData}
          {stateCounts} 
          {schoolCounts} 
          onSelectEvent={handleEventSelect}
        />
      </div>

      <div class={activeTab === 'search' ? 'tab-content active' : 'tab-content'}>
        <CompetitorFinder 
          {allData} 
          {stateCounts}
          onSelectEvent={handleEventSelect}
        />
      </div>
    {/if}
  {/if}
</main>

<footer>
  <div class="container">
    <p>&copy; 2026 Future Business Leaders of America (FBLA) NLC Registration Analyzer.</p>
    <p style="margin-top: 8px; font-size: 11px; opacity: 0.6;">Built using Svelte 5. Parsed from the preliminary schedule release (updated 6/12/2026).</p>
    <p style="margin-top: 12px; font-size: 10px; opacity: 0.5; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.4;">
      Disclaimer: This is an unofficial, independent analytics platform created solely for educational purposes. It is not affiliated with, authorized, maintained, sponsored, or endorsed by Future Business Leaders of America, Inc. (FBLA). All product and company names are the registered trademarks of their original owners.
    </p>
  </div>
</footer>
