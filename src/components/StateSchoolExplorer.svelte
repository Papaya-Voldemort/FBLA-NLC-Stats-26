<script>
  import Icon from '@iconify/svelte';
  let { allData, stateCounts, schoolCounts, onSelectEvent } = $props();

  // Search queries for leaderboards
  let stateRankQuery = $state('');
  let schoolRankQuery = $state('');

  // Interactive Explorer state
  let explorerSelectedState = $state('');
  let explorerSelectedSchool = $state('');
  let explorerSelectedEvent = $state('');
  let schoolSearchQuery = $state('');

  // Refs for scrolling Column 2 school elements
  let schoolScrollAreaEl;

  // 1. Leaderboards computed properties
  const sortedStateRanks = $derived(
    Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([state]) => state.toLowerCase().includes(stateRankQuery.toLowerCase()))
  );

  const sortedSchoolRanks = $derived(
    Object.entries(schoolCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([school]) => school.toLowerCase().includes(schoolRankQuery.toLowerCase()))
      .slice(0, 50) // Top 50
  );

  // 2. State selection outputs
  const stateEntries = $derived(
    explorerSelectedState ? allData.filter(e => e.state === explorerSelectedState) : []
  );

  // Column 1 state events list
  const stateEvents = $derived(() => {
    const counts = {};
    stateEntries.forEach(entry => {
      counts[entry.event_name] = (counts[entry.event_name] || 0) + entry.team_size;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  });

  // Column 2 state schools list
  const stateSchools = $derived(() => {
    const counts = {};
    stateEntries.forEach(entry => {
      counts[entry.school_name] = (counts[entry.school_name] || 0) + entry.team_size;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  });

  // Filtered state schools list in Column 2
  const filteredStateSchools = $derived(
    stateSchools().filter(([schoolName]) =>
      schoolName.toLowerCase().includes(schoolSearchQuery.toLowerCase())
    )
  );

  // 3. Roster outputs (Column 3)
  // School student roster
  const schoolRosterEntries = $derived(
    explorerSelectedSchool
      ? allData
          .filter(e => e.school_name === explorerSelectedSchool && e.state === explorerSelectedState)
          .sort((a, b) => a.competitors[0]?.localeCompare(b.competitors[0]))
      : []
  );

  // State-Event competitor roster
  const stateEventRosterEntries = $derived(
    explorerSelectedEvent
      ? allData
          .filter(e => e.state === explorerSelectedState && e.event_name === explorerSelectedEvent)
          .sort((a, b) => a.school_name.localeCompare(b.school_name))
      : []
  );

  // Select state handler
  function handleStateChange(e) {
    explorerSelectedState = e.target.value;
    explorerSelectedSchool = '';
    explorerSelectedEvent = '';
    schoolSearchQuery = '';
  }

  // Select state event in Column 1
  function selectStateEvent(eventName) {
    explorerSelectedEvent = eventName;
    explorerSelectedSchool = ''; // clear school
  }

  // Select school in Column 2
  function selectSchool(schoolName) {
    explorerSelectedSchool = schoolName;
    explorerSelectedEvent = ''; // clear event
  }

  // Jump from state-event roster to select school in Column 2
  function selectExplorerSchool(schoolName) {
    schoolSearchQuery = ''; // Clear search so school is guaranteed to be in the DOM
    explorerSelectedSchool = schoolName;
    explorerSelectedEvent = '';

    // Scroll selected school item into view
    setTimeout(() => {
      if (schoolScrollAreaEl) {
        const activeItem = schoolScrollAreaEl.querySelector('.explorer-list-item.active');
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 50);
  }

  // Mobile auto-scrolling UX when state selection is made (Scrolls to Column 2)
  $effect(() => {
    if (explorerSelectedState && typeof window !== 'undefined' && window.innerWidth <= 768) {
      setTimeout(() => {
        const col2 = document.querySelector('.explorer-col:nth-child(2)');
        if (col2) {
          col2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  });

  // Mobile auto-scrolling UX when school or event selection is made (Scrolls to Column 3)
  $effect(() => {
    if ((explorerSelectedSchool || explorerSelectedEvent) && typeof window !== 'undefined' && window.innerWidth <= 768) {
      setTimeout(() => {
        const col3 = document.querySelector('.explorer-col:nth-child(3)');
        if (col3) {
          col3.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  });
</script>

<div class="dashboard-row">
  <!-- States Card -->
  <div class="glass-panel col-6">
    <div class="glass-panel-header">
      <h2>
        <Icon icon="lucide:map" width="18" height="18" style="color: var(--fbla-gold); vertical-align: middle; margin-right: 6px;" />
        FBLA States Leaderboard
      </h2>
    </div>
    <div class="search-box-container">
      <div class="search-input-wrapper">
        <Icon icon="lucide:search" />
        <input 
          type="text" 
          bind:value={stateRankQuery} 
          class="search-input" 
          placeholder="Search states..." 
          style="padding-top:8px; padding-bottom:8px;"
        />
      </div>
    </div>
    <div class="list-wrapper" style="max-height: 350px;">
      {#each sortedStateRanks as [state, count], index}
        <div class="rank-item">
          <div class="rank-name-area">
            <div class="rank-badge">{index + 1}</div>
            <div>
              <div class="rank-label">{state}</div>
              <div class="rank-sub">FBLA State Association</div>
            </div>
          </div>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="rank-value" 
            style="cursor:pointer;" 
            title="Explore this State" 
            onclick={() => { explorerSelectedState = state; onExplorerStateChangeSelect(); }}
          >
            {count} Students
          </div>
        </div>
      {:else}
        <div style="text-align:center; padding: 20px; color: var(--text-secondary);">No states match filter</div>
      {/each}
    </div>
  </div>

  <!-- Schools Card -->
  <div class="glass-panel col-6">
    <div class="glass-panel-header">
      <h2>
        <Icon icon="lucide:building-2" width="18" height="18" style="color: var(--fbla-gold); vertical-align: middle; margin-right: 6px;" />
        Top Schools (Local Chapters)
      </h2>
    </div>
    <div class="search-box-container">
      <div class="search-input-wrapper">
        <Icon icon="lucide:search" />
        <input 
          type="text" 
          bind:value={schoolRankQuery} 
          class="search-input" 
          placeholder="Search schools..." 
          style="padding-top:8px; padding-bottom:8px;"
        />
      </div>
    </div>
    <div class="list-wrapper" style="max-height: 350px;">
      {#each sortedSchoolRanks as [school, count], index}
        {@const divisionText = school.toLowerCase().includes('middle') ? 'Middle School' : 'High School'}
        <div class="rank-item">
          <div class="rank-name-area">
            <div class="rank-badge">{index + 1}</div>
            <div style="max-width: 250px;">
              <div class="rank-label" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">{school}</div>
              <div class="rank-sub">{divisionText}</div>
            </div>
          </div>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="rank-value" 
            style="cursor:pointer;" 
            title="Explore this School"
            onclick={() => {
              // Locate state of this school
              const match = allData.find(e => e.school_name === school);
              if (match) {
                explorerSelectedState = match.state;
                selectExplorerSchool(school);
              }
            }}
          >
            {count} Students
          </div>
        </div>
      {:else}
        <div style="text-align:center; padding: 20px; color: var(--text-secondary);">No schools match filter</div>
      {/each}
    </div>
  </div>
</div>

<!-- Interactive Explorer -->
<div class="glass-panel" style="margin-top: 24px;">
  <div class="glass-panel-header">
    <h2>
      <Icon icon="lucide:compass" width="20" height="20" style="color: var(--fbla-gold); vertical-align: middle; margin-right: 8px;" />
      Interactive State & School Explorer
    </h2>
  </div>
  <div class="explorer-grid">
    
    <!-- Column 1: Select State & Events Breakdown -->
    <div class="explorer-col active">
      <div class="explorer-col-title">
        <Icon icon="lucide:map-pin" width="14" height="14" />
        Select State
      </div>
      <select 
        value={explorerSelectedState} 
        onchange={handleStateChange}
        class="select-filter" 
        style="width: 100%; margin-bottom: 12px; min-width: 100%;"
      >
        <option value="">-- Choose State --</option>
        {#each Object.keys(stateCounts).sort() as state}
          <option value={state}>{state} ({stateCounts[state]} competitors)</option>
        {/each}
      </select>
      
      <div class="explorer-scroll-area">
        {#if !explorerSelectedState}
          <div class="empty-state" style="padding: 20px 10px;">
            <p style="font-size:12px;">Select a state to view its competitive event registration breakdown.</p>
          </div>
        {:else}
          {#each stateEvents() as [evName, evCount]}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="explorer-list-item {explorerSelectedEvent === evName ? 'active' : ''}" 
              onclick={() => selectStateEvent(evName)}
            >
              <div style="font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:160px;" title={evName}>{evName}</div>
              <div class="rank-value" style="padding:2px 8px; font-size:11px;">{evCount}</div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Column 2: Schools in Selected State -->
    <div class="explorer-col {explorerSelectedState ? 'active' : 'inactive'}">
      <div class="explorer-col-title">
        <Icon icon="lucide:school" width="14" height="14" />
        Chapters (Schools)
      </div>
      <div class="search-input-wrapper" style="width: 100%; margin-bottom: 12px; flex: none;">
        <Icon icon="lucide:search" />
        <input 
          type="text" 
          bind:value={schoolSearchQuery} 
          disabled={!explorerSelectedState}
          class="search-input" 
          placeholder={explorerSelectedState ? "Search state schools..." : "Select a state first..."}
          style="width: 100%; padding-top: 8px; padding-bottom: 8px;"
        />
      </div>
      
      <div class="explorer-scroll-area" bind:this={schoolScrollAreaEl}>
        {#if !explorerSelectedState}
          <div class="empty-state" style="padding: 20px 10px;">
            <p style="font-size:12px;">Select a state first to see its local FBLA chapters.</p>
          </div>
        {:else}
          {#each filteredStateSchools as [schoolName, count]}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="explorer-list-item {explorerSelectedSchool === schoolName ? 'active' : ''}" 
              onclick={() => selectSchool(schoolName)}
            >
              <div style="font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:170px;" title={schoolName}>{schoolName}</div>
              <div class="rank-value" style="padding:2px 8px; font-size:11px;">{count}</div>
            </div>
          {:else}
            <div class="empty-state" style="padding: 20px 10px;">
              <p style="font-size:12px;">No chapters match search.</p>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Column 3: Roster Details -->
    <div class="explorer-col {explorerSelectedSchool || explorerSelectedEvent ? 'active' : 'inactive'}" style="flex: 1.5;">
      <div class="explorer-col-title">
        <Icon icon="lucide:users" width="14" height="14" />
        Student Roster & Schedule
      </div>
      
      <div class="explorer-scroll-area">
        {#if explorerSelectedSchool}
          {@const divisionText = schoolRosterEntries[0]?.division === 'MS' ? 'Middle School' : 'High School'}
          {@const totalStudents = schoolRosterEntries.reduce((acc, curr) => acc + curr.team_size, 0)}
          
          <div class="roster-header-card">
            <h4 style="display:inline-flex; align-items:center; gap:8px;">
              <Icon icon="lucide:building-2" width="16" height="16" style="color:var(--fbla-gold);" />
              {explorerSelectedSchool}
            </h4>
            <p>{explorerSelectedState} • {divisionText} Division • {totalStudents} Competitors Scheduled</p>
          </div>
          
          <div class="table-responsive" style="margin: 0; max-height: 380px;">
            <table>
              <thead>
                <tr>
                  <th style="width: 35%;">Competitor</th>
                  <th style="width: 35%;">Event</th>
                  <th style="width: 15%;">Section</th>
                  <th style="width: 15%;">Time</th>
                </tr>
              </thead>
              <tbody>
                {#each schoolRosterEntries as entry}
                  <tr>
                    <td style="font-weight:600; font-size:12px;">{entry.competitors.join(', ')}</td>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <td 
                      style="font-size:12px; font-weight:500; color:var(--text-primary); cursor:pointer;" 
                      class="explorer-roster-event-click" 
                      onclick={() => onSelectEvent(entry.event_name)}
                    >
                      {entry.event_name}
                    </td>
                    <td><span class="badge badge-hs" style="font-size:9px; padding:2px 4px;">{entry.section_name || 'Main'}</span></td>
                    <td>
                      <span class="badge badge-time" style="font-size:9px; padding:2px 4px;">
                        {entry.arrival_time || 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

        {:else if explorerSelectedEvent}
          {@const totalCompetitors = stateEventRosterEntries.reduce((acc, curr) => acc + curr.team_size, 0)}
          {@const uniqueSchoolsCount = new Set(stateEventRosterEntries.map(e => e.school_name)).size}
          
          <div class="roster-header-card">
            <h4 style="display:inline-flex; align-items:center; gap:8px;">
              <Icon icon="lucide:book-open" width="16" height="16" style="color:var(--fbla-gold);" />
              {explorerSelectedEvent}
            </h4>
            <p>{explorerSelectedState} Association • {totalCompetitors} Competitors from {uniqueSchoolsCount} Chapters</p>
          </div>
          
          <div class="table-responsive" style="margin: 0; max-height: 380px;">
            <table>
              <thead>
                <tr>
                  <th style="width: 35%;">School</th>
                  <th style="width: 35%;">Competitor(s)</th>
                  <th style="width: 15%;">Section</th>
                  <th style="width: 15%;">Time</th>
                </tr>
              </thead>
              <tbody>
                {#each stateEventRosterEntries as entry}
                  <tr>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <td 
                      style="font-weight:600; font-size:12px; cursor:pointer;" 
                      class="explorer-roster-school-click" 
                      title="Explore this School chapter"
                      onclick={() => selectExplorerSchool(entry.school_name)}
                    >
                      {entry.school_name}
                    </td>
                    <td style="font-size:12px; font-weight:500; color:var(--text-primary);">{entry.competitors.join(', ')}</td>
                    <td><span class="badge badge-hs" style="font-size:9px; padding:2px 4px;">{entry.section_name || 'Main'}</span></td>
                    <td>
                      <span class="badge badge-time" style="font-size:9px; padding:2px 4px;">
                        {entry.arrival_time || 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

        {:else}
          <div class="empty-state">
            <Icon icon="lucide:info" width="32" height="32" style="margin-bottom:12px; opacity:0.5;" />
            <p style="font-size:13px;">
              Select a school chapter from Column 2 or a state event from Column 1 to view rosters and schedules.
            </p>
          </div>
        {/if}
      </div>
    </div>
    
  </div>
</div>
