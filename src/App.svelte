<script>
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import Header from './components/Header.svelte';
  import posthog from './posthog.js';

  // Lazy loaded dashboard sub-components
  let Overview = $state(null);
  let EventExplorer = $state(null);
  let StateSchoolExplorer = $state(null);
  let CompetitorFinder = $state(null);
  let Workshops = $state(null);

  // Level & Year Selection States
  let selectedLevel = $state(null);
  let selectedYear = $state(null);

  // Reactivity state via Runes
  let allData = $state([]);
  let winnersData = $state(null);
  let workshopsData = $state([]);
  let hasWorkshops = $derived(workshopsData.length > 0);
  let loading = $state(false);
  let activeTab = $state('overview');
  let activeEventId = $state(null);
  let currentTheme = $state('dark');
  let activeState = $state('');
  let activeSchool = $state('');
  let activeStateEvent = $state('');

  // Aggregated data
  let stateCounts = $state({});
  let schoolCounts = $state({});
  let eventCounts = $state({});
  let eventDetails = $state({});

  // Precomputed maps for O(1) slug-to-name lookup
  let stateSlugMap = $derived.by(() => {
    const map = {};
    for (const name of Object.keys(stateCounts)) {
      map[slugify(name)] = name;
    }
    return map;
  });

  let eventSlugMap = $derived.by(() => {
    const map = {};
    for (const name of Object.keys(eventCounts)) {
      map[slugify(name)] = name;
    }
    return map;
  });

  function deduplicateEntries(data) {
    const map = new Map();
    
    data.forEach(entry => {
      // Create a unique key for each team/competitor within an event
      const sortedComp = [...entry.competitors].sort().map(n => n.trim().toLowerCase()).join('|');
      const key = `${entry.event_name}::${entry.state}::${entry.school_name}::${sortedComp}`;
      
      if (!map.has(key)) {
        map.set(key, { ...entry });
      } else {
        const existing = map.get(key);
        // Merge presentation schedule detail if it has specific arrival time
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

  // Fetch Schedules, Winners & Workshops for the selected Level/Year
  async function loadNlcData(level, year) {
    loading = true;
    allData = [];
    winnersData = null;
    workshopsData = [];
    activeEventId = null;
    activeTab = 'overview';
    selectedLevel = level;
    selectedYear = year;

    try {
      // 1. Fetch schedules data
      const schedulesRes = await fetch(`/data/${level}/${year}/schedules.json`);
      if (!schedulesRes.ok) throw new Error("Schedules not found for this level/year");
      const schedules = await schedulesRes.json();
      allData = deduplicateEntries(schedules);
      
      // 2. Fetch winners data (fail-safe)
      try {
        const winnersRes = await fetch(`/data/${level}/${year}/winners.json`);
        if (winnersRes.ok) {
          winnersData = await winnersRes.json();
        }
      } catch (err) {
        console.warn("Winners data not available for this NLC:", err);
      }

      // 3. Fetch workshops data (fail-safe)
      try {
        const workshopsRes = await fetch(`/data/${level}/${year}/workshops.json`);
        if (workshopsRes.ok) {
          workshopsData = await workshopsRes.json();
        }
      } catch (err) {
        console.warn("Workshops data not available for this NLC:", err);
      }
      
      processAnalytics(allData);
      posthog.capture('nlc level year loaded', { level, year, total_entries: allData.length });
    } catch (err) {
      console.error('Error fetching NLC data:', err);
    } finally {
      loading = false;
    }
  }

  function handleBackToStart() {
    selectedLevel = null;
    selectedYear = null;
    allData = [];
    winnersData = null;
    workshopsData = [];
    posthog.capture('returned to start screen');
  }

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

  const levelLabel = $derived(selectedLevel === 'collegiate' ? 'Collegiate' : 'High School & Middle School');
  const levelShort = $derived(selectedLevel === 'collegiate' ? 'Collegiate' : 'HS/MS');

  const pageTitle = $derived.by(() => {
    if (!selectedLevel || !selectedYear) {
      return "FBLA NLC 2026 Stats: Registration & Schedules";
    }
    if (activeTab === 'overview') {
      return `FBLA ${levelShort} NLC ${selectedYear} Stats & Schedules`;
    }
    if (activeTab === 'events') {
      if (activeEventId) {
        return `${activeEventId} Roster & Winners | FBLA ${levelShort} ${selectedYear}`;
      }
      return `FBLA ${levelShort} NLC ${selectedYear} Competitive Events`;
    }
    if (activeTab === 'states-schools') {
      if (activeStateEvent) {
        return `${activeStateEvent} - ${activeSchool || activeState} | FBLA ${selectedYear}`;
      }
      if (activeSchool) {
        return `${activeSchool} (${activeState}) Roster | FBLA NLC ${selectedYear}`;
      }
      if (activeState) {
        return `${activeState} FBLA Roster & Schedules | NLC ${selectedYear}`;
      }
      return `FBLA ${levelShort} NLC ${selectedYear} State & Chapter Standings`;
    }
    if (activeTab === 'search') {
      return `FBLA ${levelShort} NLC ${selectedYear} Competitor Search`;
    }
    if (activeTab === 'workshops') {
      return `FBLA NLC ${selectedYear} Workshops & Speakers`;
    }
    return "FBLA NLC 2026 Stats: Registration & Schedules";
  });

  const pageDescription = $derived.by(() => {
    if (!selectedLevel || !selectedYear) {
      return "Explore FBLA NLC stats, registration details, competitive events schedules, and national standings/results for the 2026 Future Business Leaders of America National Leadership Conference.";
    }
    if (activeTab === 'overview') {
      return `Explore registration statistics, school chapters leaderboard, state association rankings, and competitive event schedules for FBLA ${levelLabel} at the ${selectedYear} National Leadership Conference.`;
    }
    if (activeTab === 'events') {
      if (activeEventId) {
        return `Scheduled competitors, presentation test times, section lists, and top 10 national award winners for the FBLA ${levelLabel} ${activeEventId} event at the NLC ${selectedYear}.`;
      }
      return `Browse schedules, test times, presentation arrival configurations, and national results for all FBLA ${levelLabel} competitive events.`;
    }
    if (activeTab === 'states-schools') {
      if (activeStateEvent) {
        if (activeSchool) {
          return `Schedules, presentation times, sections, and competitor rosters for ${activeSchool} (${activeState}) entries in the ${activeStateEvent} event at the FBLA NLC ${selectedYear}.`;
        }
        return `Roster, section assignments, and schedule for all ${activeState} FBLA competitors competing in the ${activeStateEvent} event at the NLC ${selectedYear}.`;
      }
      if (activeSchool) {
        return `Competitor roster, registered events, location details, and presentation times for students representing ${activeSchool} (${activeState}) at the FBLA NLC ${selectedYear}.`;
      }
      if (activeState) {
        return `Complete team roster, scheduled events, and presentation times for all FBLA competitors representing ${activeState} at the ${selectedYear} National Leadership Conference.`;
      }
      return `State association rankings and local chapter competitor counts for FBLA ${levelLabel} Division at the ${selectedYear} NLC.`;
    }
    if (activeTab === 'search') {
      return `Search tool to look up FBLA competitor testing hours, presentation locations, and schedules for the ${selectedYear} National Leadership Conference.`;
    }
    if (activeTab === 'workshops') {
      return `Complete schedule of training sessions, leadership seminars, and professional workshops available at the FBLA NLC ${selectedYear}.`;
    }
    return "Explore FBLA NLC stats, registration details, competitive events schedules, and national standings/results.";
  });

  function parseLocation() {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/^\/(high-school|collegiate)\/(\d{4})(?:\/([a-z\-]+))?(?:\/([a-z0-9\-]+))?$/);
    if (match) {
      const level = match[1];
      const year = parseInt(match[2], 10);
      let tab = match[3] || 'overview';
      let eventSlug = match[4] || null;
      
      // Map 'states' tab to 'states-schools' client-side tab
      if (tab === 'states') {
        tab = 'states-schools';
      }
      return { level, year, tab, eventSlug };
    }
    return null;
  }

  function updateURL() {
    if (typeof window === 'undefined') return;
    if (!selectedLevel || !selectedYear) {
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
      return;
    }
    
    let path = `/${selectedLevel}/${selectedYear}`;
    if (activeTab && activeTab !== 'overview') {
      if (activeTab === 'states-schools') {
        if (activeState) {
          path += `/states/${slugify(activeState)}`;
        } else {
          path += '/states-schools';
        }
      } else {
        path += `/${activeTab}`;
        if (activeTab === 'events' && activeEventId) {
          path += `/${slugify(activeEventId)}`;
        }
      }
    }
    
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }

  async function handlePopState() {
    const route = parseLocation();
    if (route) {
      const levelChanged = selectedLevel !== route.level || selectedYear !== route.year;
      if (levelChanged) {
        await loadNlcData(route.level, route.year);
      }
      activeTab = route.tab;
      
      // If navigating to states, check if a specific state was in the URL
      if (route.tab === 'states-schools') {
        const findAndSetState = () => {
          const rawPath = window.location.pathname;
          const stateMatch = rawPath.match(/\/states\/([a-z0-9\-]+)$/);
          if (stateMatch && stateMatch[1]) {
            const foundState = stateSlugMap[stateMatch[1]];
            if (foundState) {
              activeState = foundState;
              activeSchool = '';
              activeStateEvent = '';
              return;
            }
          }
          activeState = '';
          activeSchool = '';
          activeStateEvent = '';
        };
        if (levelChanged) {
          setTimeout(findAndSetState, 50);
        } else {
          findAndSetState();
        }
      } else if (route.tab === 'events' && route.eventSlug) {
        const findAndSetEvent = () => {
          const foundEvent = eventSlugMap[route.eventSlug];
          if (foundEvent) {
            activeEventId = foundEvent;
          }
        };
        if (levelChanged) {
          setTimeout(findAndSetEvent, 50);
        } else {
          findAndSetEvent();
        }
      }
    } else {
      selectedLevel = null;
      selectedYear = null;
      allData = [];
      winnersData = null;
      workshopsData = [];
      activeState = '';
      activeSchool = '';
      activeStateEvent = '';
    }
  }

  onMount(async () => {
    // Init theme from localStorage
    const savedTheme = localStorage.getItem('fbla-analytics-theme') || 'dark';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Load components dynamically after initial mount to avoid blocking initial paint
    setTimeout(async () => {
      try {
        const [overviewMod, eventMod, stateMod, finderMod, workshopsMod] = await Promise.all([
          import('./components/Overview.svelte'),
          import('./components/EventExplorer.svelte'),
          import('./components/StateSchoolExplorer.svelte'),
          import('./components/CompetitorFinder.svelte'),
          import('./components/Workshops.svelte')
        ]);
        Overview = overviewMod.default;
        EventExplorer = eventMod.default;
        StateSchoolExplorer = stateMod.default;
        CompetitorFinder = finderMod.default;
        Workshops = workshopsMod.default;
      } catch (err) {
        console.error('Failed to lazy load components:', err);
      }
    }, 100);

    // Initial routing
    const route = parseLocation();
    if (route) {
      await loadNlcData(route.level, route.year);
      activeTab = route.tab;
      if (route.tab === 'states-schools') {
        const rawPath = window.location.pathname;
        const stateMatch = rawPath.match(/\/states\/([a-z0-9\-]+)$/);
        if (stateMatch && stateMatch[1]) {
          const foundState = stateSlugMap[stateMatch[1]];
          if (foundState) {
            activeState = foundState;
          }
        }
      } else if (route.tab === 'events' && route.eventSlug) {
        const foundEvent = eventSlugMap[route.eventSlug];
        if (foundEvent) {
          activeEventId = foundEvent;
        }
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  });

  // Effect to update theme on the DOM
  $effect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('fbla-analytics-theme', currentTheme);
  });

  // Sync state parameters to URL
  $effect(() => {
    selectedLevel;
    selectedYear;
    activeTab;
    activeEventId;
    activeState;
    updateURL();
  });

  // Dynamically update document title, description, and canonical URL on client-side routing
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.title = pageTitle;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', pageDescription);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', pageTitle);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', pageDescription);
      }
      const twitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', pageTitle);
      }
      const twitterDesc = document.querySelector('meta[property="twitter:description"]');
      if (twitterDesc) {
        twitterDesc.setAttribute('content', pageDescription);
      }
      
      // Update canonical url dynamically
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        let currentUrl = `https://fbla.elinelson.dev`;
        if (selectedLevel && selectedYear) {
          currentUrl += `/${selectedLevel}/${selectedYear}`;
          if (activeTab && activeTab !== 'overview') {
            if (activeTab === 'states-schools') {
              if (activeState) {
                currentUrl += `/states/${slugify(activeState)}`;
              } else {
                currentUrl += '/states-schools';
              }
            } else {
              currentUrl += `/${activeTab}`;
              if (activeTab === 'events' && activeEventId) {
                currentUrl += `/${slugify(activeEventId)}`;
              }
            }
          }
        }
        canonical.setAttribute('href', currentUrl);
      }
    }
  });

  function processAnalytics(data) {
    const stateUniqueCompetitors = {};
    const schoolUniqueCompetitors = {};
    const eC = {};
    const eD = {};

    data.forEach(entry => {
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

    const sC = {};
    Object.keys(stateUniqueCompetitors).forEach(state => {
      sC[state] = stateUniqueCompetitors[state].size;
    });

    const schC = {};
    Object.keys(schoolUniqueCompetitors).forEach(school => {
      schC[school] = schoolUniqueCompetitors[school].size;
    });

    stateCounts = sC;
    schoolCounts = schC;
    eventCounts = eC;
    eventDetails = eD;
  }

  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    currentTheme = newTheme;
    posthog.capture('theme toggled', { new_theme: newTheme });
  }

  function switchTab(tabId) {
    activeTab = tabId;
    posthog.capture('tab switched', { tab: tabId });
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
  {selectedLevel}
  {selectedYear}
  {hasWorkshops}
  onTabChange={switchTab} 
  onThemeToggle={toggleTheme} 
  onBackToStart={handleBackToStart}
/>

<div class="scroll-container">
  <main class="container">
  {#if loading}
    <div id="loading-overlay" class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:60px 20px; margin-bottom: 24px;">
      <Icon icon="lucide:loader-2" width="40" height="40" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
      <div style="font-family:'Outfit'; font-weight:700; font-size:18px;">Parsing & Loading Registration Data...</div>
      <p style="color:var(--text-secondary); font-size:14px; max-width:400px; text-align:center;">Analyzing entries from the NLC database. This will take just a second.</p>
    </div>
  {:else if !selectedLevel}
    <!-- START SCREEN (Level Selection) -->
    <div class="start-screen-container">
      <div class="start-title-area">
        <h1>NLC Stats Analyzer</h1>
        <p>Choose an educational level to begin exploring competitive event schedule breakdowns and final standings.</p>
      </div>

      <div class="level-grid">
        <!-- High School Card -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="level-card hs-card" onclick={() => { selectedLevel = 'high-school'; posthog.capture('level selected', { level: 'high-school' }); }}>
          <div class="level-icon-wrapper">
            <Icon icon="lucide:graduation-cap" width="36" height="36" />
          </div>
          <h2>High School & MS</h2>
          <p>Explore preliminary presentation schedules and objective test times for FBLA High School and Middle School competitors.</p>
          <button class="btn">Select</button>
        </div>

        <!-- Collegiate Card -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="level-card col-card" onclick={() => { selectedLevel = 'collegiate'; posthog.capture('level selected', { level: 'collegiate' }); }}>
          <div class="level-icon-wrapper">
            <Icon icon="lucide:award" width="36" height="36" />
          </div>
          <h2>Collegiate</h2>
          <p>Analyze preliminary schedule assignments and view complete final national winners standings for College competitors.</p>
          <button class="btn">Select</button>
        </div>
      </div>
    </div>
  {:else if !selectedYear}
    <!-- YEAR SELECTION SCREEN -->
    <div class="year-select-container">
      <button class="back-to-levels-btn" onclick={() => selectedLevel = null}>
        <Icon icon="lucide:arrow-left" width="16" height="16" />
        Back to Divisions
      </button>

      <div class="start-title-area" style="margin-bottom: 20px;">
        <h1>Select Year</h1>
        <p>Select the year of the NLC you want to explore. Badges indicate which data modules are available.</p>
      </div>

      <div class="year-grid-layout">
        <!-- 2026 Year Card (Active) -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="level-card active-year-card {selectedLevel === 'high-school' ? 'hs-year' : 'col-year'}" onclick={() => loadNlcData(selectedLevel, 2026)}>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="level-icon-wrapper year-icon-wrapper">
              <Icon icon="lucide:calendar" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px;">
              <h2 style="margin: 0; font-size: 20px; line-height: 1;">2026</h2>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <span class="badge badge-time">Schedules Loaded</span>
                {#if selectedLevel === 'collegiate'}
                  <span class="badge badge-collegiate" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">
                    Winners Available
                  </span>
                {/if}
              </div>
            </div>
          </div>
          <button class="btn">Select</button>
        </div>

        <!-- 2025 Year Card (Disabled) -->
        <div class="level-card disabled-year-card">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="level-icon-wrapper year-icon-wrapper">
              <Icon icon="lucide:calendar" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px;">
              <h2 style="margin: 0; font-size: 20px; line-height: 1;">2025</h2>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <span class="badge badge-hs" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2);">No Data</span>
              </div>
            </div>
          </div>
          <button class="btn" disabled>Locked</button>
        </div>

        <!-- 2024 Year Card (Disabled) -->
        <div class="level-card disabled-year-card">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="level-icon-wrapper year-icon-wrapper">
              <Icon icon="lucide:calendar" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px;">
              <h2 style="margin: 0; font-size: 20px; line-height: 1;">2024</h2>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <span class="badge badge-hs" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2);">No Data</span>
              </div>
            </div>
          </div>
          <button class="btn" disabled>Locked</button>
        </div>
      </div>
    </div>
  {:else}
    <!-- ACTIVE DASHBOARD VIEW -->
    {#if activeTab === 'overview'}
      {#if Overview}
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
        <div class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px;">
          <Icon icon="lucide:loader-2" width="30" height="30" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
          <div style="font-family:'Outfit'; font-weight:700;">Loading Overview Panel...</div>
        </div>
      {/if}
    {:else}
      <!-- Wrap tabs in hidden/active state to maintain browser scroll states & DOM instances -->
      <div class={activeTab === 'events' ? 'tab-content active' : 'tab-content'}>
        {#if EventExplorer}
          <EventExplorer 
            {eventCounts} 
            {eventDetails} 
            {winnersData}
            bind:activeEventId
          />
        {:else}
          <div class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px;">
            <Icon icon="lucide:loader-2" width="30" height="30" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
            <div style="font-family:'Outfit'; font-weight:700;">Loading Event Explorer...</div>
          </div>
        {/if}
      </div>

      <div class={activeTab === 'states-schools' ? 'tab-content active' : 'tab-content'}>
        {#if StateSchoolExplorer}
          <StateSchoolExplorer 
            {allData}
            {stateCounts} 
            {schoolCounts} 
            onSelectEvent={handleEventSelect}
            bind:explorerSelectedState={activeState}
            bind:explorerSelectedSchool={activeSchool}
            bind:explorerSelectedEvent={activeStateEvent}
          />
        {:else}
          <div class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px;">
            <Icon icon="lucide:loader-2" width="30" height="30" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
            <div style="font-family:'Outfit'; font-weight:700;">Loading States & Chapters...</div>
          </div>
        {/if}
      </div>

      <div class={activeTab === 'search' ? 'tab-content active' : 'tab-content'}>
        {#if CompetitorFinder}
          <CompetitorFinder 
            {allData} 
            {stateCounts}
            onSelectEvent={handleEventSelect}
          />
        {:else}
          <div class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px;">
            <Icon icon="lucide:loader-2" width="30" height="30" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
            <div style="font-family:'Outfit'; font-weight:700;">Loading Competitor Finder...</div>
          </div>
        {/if}
      </div>

      {#if hasWorkshops}
        <div class={activeTab === 'workshops' ? 'tab-content active' : 'tab-content'}>
          {#if Workshops}
            <Workshops 
              workshops={workshopsData}
            />
          {:else}
            <div class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px;">
              <Icon icon="lucide:loader-2" width="30" height="30" class="spinner" style="animation: spin 1s linear infinite; color: var(--fbla-gold);" />
              <div style="font-family:'Outfit'; font-weight:700;">Loading Workshops...</div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
</main>

<footer>
  <div class="container">
    <p>&copy; 2026 Future Business Leaders of America (FBLA) NLC Registration Analyzer.</p>
    <p style="margin-top: 8px; font-size: 11px; opacity: 0.6;">Built using Svelte 5. Parsed from official FBLA schedule releases.</p>
    <p style="margin-top: 12px; font-size: 10px; opacity: 0.5; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.4;">
      Disclaimer: This is an unofficial, independent analytics platform created solely for educational purposes. It is not affiliated with, authorized, maintained, sponsored, or endorsed by Future Business Leaders of America, Inc. (FBLA). All product and company names are the registered trademarks of their original owners.
    </p>
  </div>
</footer>
</div>
