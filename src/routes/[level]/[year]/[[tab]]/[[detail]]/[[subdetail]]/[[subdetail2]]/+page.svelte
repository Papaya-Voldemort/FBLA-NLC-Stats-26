<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Icon from '@iconify/svelte';
  import posthog from '../../../../../../../posthog.js';

  // Import components
  import Overview from '../../../../../../../components/Overview.svelte';
  import EventExplorer from '../../../../../../../components/EventExplorer.svelte';
  import StateSchoolExplorer from '../../../../../../../components/StateSchoolExplorer.svelte';
  import CompetitorFinder from '../../../../../../../components/CompetitorFinder.svelte';
  import Workshops from '../../../../../../../components/Workshops.svelte';

  let { data } = $props();

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

  const selectedLevel = $derived(data.level);
  const selectedYear = $derived(data.year);
  const hasWorkshops = $derived(data.workshopsData.length > 0);

  const activeTab = $derived.by(() => {
    if (data.tab === 'states' || data.tab === 'states-schools') return 'states-schools';
    if (data.tab === 'events') return 'events';
    if (data.tab === 'search') return 'search';
    if (data.tab === 'workshops') return 'workshops';
    return 'overview';
  });

  let activeEventId = $state(null);
  let activeState = $state('');
  let activeSchool = $state('');
  let activeStateEvent = $state('');

  // Sync route parameters to clientside states
  $effect(() => {
    if (activeTab === 'events' && data.detail) {
      const foundEvent = Object.keys(data.eventCounts).find(name => slugify(name) === data.detail);
      if (foundEvent) {
        activeEventId = foundEvent;
      }
    } else {
      activeEventId = null;
    }

    if (activeTab === 'states-schools') {
      if (data.tab === 'states' && data.detail) {
        const foundState = Object.keys(data.stateCounts).find(name => slugify(name) === data.detail);
        if (foundState) {
          activeState = foundState;
        } else {
          activeState = '';
        }
      } else {
        activeState = '';
      }

      if (data.subdetail === 'schools' && data.subdetail2) {
        const foundSchool = Object.keys(data.schoolCounts).find(name => slugify(name) === data.subdetail2);
        if (foundSchool) {
          activeSchool = foundSchool;
        } else {
          activeSchool = '';
        }
      } else {
        activeSchool = '';
      }
    } else {
      activeState = '';
      activeSchool = '';
    }
  });

  // Sync clientside state changes back to URLs
  function navigateToState(tab, detail = null, subdetail = null, subdetail2 = null) {
    let path = `/${selectedLevel}/${selectedYear}`;
    if (tab === 'states-schools') {
      if (detail) {
        path += `/states/${slugify(detail)}`;
        if (subdetail && subdetail2) {
          path += `/schools/${slugify(subdetail2)}`;
        }
      } else {
        path += '/states-schools';
      }
    } else if (tab !== 'overview') {
      path += `/${tab}`;
      if (tab === 'events' && detail) {
        path += `/${slugify(detail)}`;
      }
    }
    
    if ($page.url.pathname !== path) {
      goto(path, { replaceState: false, noScroll: true, keepFocus: true });
    }
  }

  $effect(() => {
    if (activeTab === 'events') {
      if (activeEventId) {
        navigateToState('events', activeEventId);
      }
    } else if (activeTab === 'states-schools') {
      navigateToState('states-schools', activeState, activeSchool ? 'schools' : null, activeSchool);
    }
  });

  function handleEventSelect(eventName) {
    activeEventId = eventName;
    navigateToState('events', eventName);
  }

  const pageTitle = $derived.by(() => {
    if (activeTab === 'overview') {
      return `FBLA ${selectedLevel === 'collegiate' ? 'Collegiate' : 'HS/MS'} NLC ${selectedYear} Stats & Schedules`;
    }
    if (activeTab === 'events') {
      if (activeEventId) {
        return `${activeEventId} Roster & Winners | FBLA ${selectedLevel === 'collegiate' ? 'Collegiate' : 'HS/MS'} ${selectedYear}`;
      }
      return `FBLA ${selectedLevel === 'collegiate' ? 'Collegiate' : 'HS/MS'} NLC ${selectedYear} Competitive Events`;
    }
    if (activeTab === 'states-schools') {
      if (activeSchool) {
        return `${activeSchool} (${activeState}) Roster | FBLA NLC ${selectedYear}`;
      }
      if (activeState) {
        return `${activeState} FBLA Roster & Schedules | NLC ${selectedYear}`;
      }
      return `FBLA ${selectedLevel === 'collegiate' ? 'Collegiate' : 'HS/MS'} NLC ${selectedYear} State & Chapter Standings`;
    }
    if (activeTab === 'search') {
      return `FBLA ${selectedLevel === 'collegiate' ? 'Collegiate' : 'HS/MS'} NLC ${selectedYear} Competitor Search`;
    }
    if (activeTab === 'workshops') {
      return `FBLA NLC ${selectedYear} Workshops & Speakers`;
    }
    return "FBLA NLC 2026 Stats: Registration & Schedules";
  });

  const pageDescription = $derived.by(() => {
    if (activeTab === 'overview') {
      return `Explore registration statistics, school chapters leaderboard, state association rankings, and competitive event schedules for FBLA ${selectedLevel} at the ${selectedYear} National Leadership Conference.`;
    }
    if (activeTab === 'events') {
      if (activeEventId) {
        return `Scheduled competitors, presentation test times, section lists, and top 10 national award winners for the FBLA ${activeEventId} event at the NLC ${selectedYear}.`;
      }
      return `Browse schedules, test times, presentation arrival configurations, and national results for all FBLA competitive events.`;
    }
    if (activeTab === 'states-schools') {
      if (activeSchool) {
        return `Competitor roster, registered events, location details, and presentation times for students representing ${activeSchool} (${activeState}) at the FBLA NLC ${selectedYear}.`;
      }
      if (activeState) {
        return `Complete team roster, scheduled events, and presentation times for all FBLA competitors representing ${activeState} at the ${selectedYear} National Leadership Conference.`;
      }
      return `State association rankings and local chapter competitor counts for FBLA Division at the ${selectedYear} NLC.`;
    }
    return "Explore FBLA NLC stats, registration details, competitive events schedules, and national standings/results.";
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="twitter:title" content={pageTitle} />
  <meta property="twitter:description" content={pageDescription} />
</svelte:head>

{#if activeTab === 'overview'}
  <Overview 
    allData={data.allData} 
    stateCounts={data.stateCounts} 
    schoolCounts={data.schoolCounts} 
    eventCounts={data.eventCounts} 
    eventDetails={data.eventDetails}
    theme="dark"
    onSelectEvent={handleEventSelect}
  />
{:else}
  <div class={activeTab === 'events' ? 'tab-content active' : 'tab-content'}>
    <EventExplorer 
      eventCounts={data.eventCounts} 
      eventDetails={data.eventDetails} 
      winnersData={data.winnersData}
      bind:activeEventId
    />
  </div>

  <div class={activeTab === 'states-schools' ? 'tab-content active' : 'tab-content'}>
    <StateSchoolExplorer 
      allData={data.allData}
      stateCounts={data.stateCounts} 
      schoolCounts={data.schoolCounts} 
      onSelectEvent={handleEventSelect}
      bind:explorerSelectedState={activeState}
      bind:explorerSelectedSchool={activeSchool}
      bind:explorerSelectedEvent={activeStateEvent}
    />
  </div>

  <div class={activeTab === 'search' ? 'tab-content active' : 'tab-content'}>
    <CompetitorFinder 
      allData={data.allData} 
      stateCounts={data.stateCounts}
      onSelectEvent={handleEventSelect}
    />
  </div>

  {#if hasWorkshops}
    <div class={activeTab === 'workshops' ? 'tab-content active' : 'tab-content'}>
      <Workshops 
        workshops={data.workshopsData}
      />
    </div>
  {/if}
{/if}
