<script>
  import Icon from '@iconify/svelte';
  import posthog from '../posthog.js';
  let { allData, stateCounts, onSelectEvent } = $props();

  // Search filters state
  let query = $state('');
  let divFilter = $state('all');
  let stateFilter = $state('all');
  let teamFilter = $state('all');

  // Pagination state
  let currentPage = $state(1);
  const itemsPerPage = 15;

  // Reactively filter data using Svelte 5 derived rune
  const filteredData = $derived(
    allData.filter(entry => {
      let matchesQuery = true;
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const competitorsStr = entry.competitors.join(' ').toLowerCase();
        matchesQuery = entry.school_name.toLowerCase().includes(q) ||
                       entry.state.toLowerCase().includes(q) ||
                       entry.event_name.toLowerCase().includes(q) ||
                       competitorsStr.includes(q);
      }

      let matchesDivision = true;
      if (divFilter !== 'all') {
        matchesDivision = entry.division === divFilter;
      }

      let matchesState = true;
      if (stateFilter !== 'all') {
        matchesState = entry.state === stateFilter;
      }

      let matchesTeam = true;
      if (teamFilter !== 'all') {
        const targetSize = parseInt(teamFilter);
        matchesTeam = entry.team_size === targetSize;
      }

      return matchesQuery && matchesDivision && matchesState && matchesTeam;
    })
  );

  // Derived properties for pagination
  const totalItems = $derived(filteredData.length);
  const totalPages = $derived(Math.ceil(totalItems / itemsPerPage) || 1);
  const startIndex = $derived(totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage);
  const endIndex = $derived(Math.min(startIndex + itemsPerPage, totalItems));
  const pageData = $derived(filteredData.slice(startIndex, endIndex));

  // Reset page when filters change
  $effect(() => {
    // Accessing filters registers dependency
    query; divFilter; stateFilter; teamFilter;
    currentPage = 1;
  });

  // Debounced search tracking
  let searchTimeout;
  $effect(() => {
    const q = query;
    clearTimeout(searchTimeout);
    if (q.trim().length >= 2) {
      searchTimeout = setTimeout(() => {
        posthog.capture('competitor searched', { query: q.trim(), results_count: filteredData.length });
      }, 600);
    }
  });

  const sortedStates = $derived(Object.keys(stateCounts).sort());
  const availableDivisions = $derived([...new Set(allData.map(e => e.division))].sort());

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function handleDivFilterChange(e) {
    divFilter = e.target.value;
    posthog.capture('competitor filter changed', { filter_type: 'division', value: e.target.value });
  }

  function handleStateFilterChange(e) {
    stateFilter = e.target.value;
    posthog.capture('competitor filter changed', { filter_type: 'state', value: e.target.value });
  }

  function handleTeamFilterChange(e) {
    teamFilter = e.target.value;
    posthog.capture('competitor filter changed', { filter_type: 'team_size', value: e.target.value });
  }
</script>

<div class="glass-panel">
  <div class="glass-panel-header">
    <h2>
      <Icon icon="lucide:search" width="20" height="20" style="margin-right:8px; color:var(--fbla-gold); vertical-align:middle;" />
      Master Competitor & Schedule Finder
    </h2>
  </div>

  <!-- Filters Box -->
  <div class="search-box-container">
    <div class="search-input-wrapper">
      <Icon icon="lucide:search" />
      <input 
        type="text" 
        bind:value={query} 
        class="search-input" 
        placeholder="Search by name, school, state, or event..."
      />
    </div>

    <select value={divFilter} onchange={handleDivFilterChange} class="select-filter">
      <option value="all">All Divisions</option>
      {#each availableDivisions as div}
        <option value={div}>
          {#if div === 'HS'}
            High School (HS)
          {:else if div === 'MS'}
            Middle School (MS)
          {:else if div === 'Collegiate'}
            Collegiate
          {:else}
            {div}
          {/if}
        </option>
      {/each}
    </select>

    <select value={stateFilter} onchange={handleStateFilterChange} class="select-filter">
      <option value="all">All States</option>
      {#each sortedStates as state}
        <option value={state}>{state} ({stateCounts[state]})</option>
      {/each}
    </select>

    <select value={teamFilter} onchange={handleTeamFilterChange} class="select-filter">
      <option value="all">All Team Sizes</option>
      <option value="1">Individual (1)</option>
      <option value="2">2-Person Team</option>
      <option value="3">3-Person Team</option>
    </select>
  </div>

  <!-- Results Table -->
  <div class="table-responsive">
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Competitor(s)</th>
          <th style="width: 23%;">Event</th>
          <th style="width: 20%;">School</th>
          <th style="width: 10%;">State</th>
          <th style="width: 12%;">Div</th>
          <th style="width: 10%;">Time</th>
        </tr>
      </thead>
      <tbody>
        {#each pageData as entry}
          {@const divBadge = entry.division === 'MS' ? 'badge-ms' : entry.division === 'Collegiate' ? 'badge-collegiate' : 'badge-hs'}
          <tr>
            <td data-label="Competitor(s)">
              <div class="competitors-cell">
                {#each entry.competitors as name}
                  <span class="competitor-tag">{name}</span>
                {/each}
              </div>
            </td>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <td 
              data-label="Event"
              style="font-weight:600; cursor:pointer;" 
              onclick={() => onSelectEvent(entry.event_name)}
            >
              {entry.event_name}
            </td>
            <td data-label="School" style="color:var(--text-secondary); font-size:13px;">{entry.school_name}</td>
            <td data-label="State"><span style="font-family:'Outfit'; font-weight:700;">{entry.state}</span></td>
            <td data-label="Division"><span class="badge {divBadge}">{entry.division}</span></td>
            <td data-label="Time"><span class="badge badge-time">{entry.arrival_time || 'Check Event'}</span></td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" style="text-align:center; padding: 40px; color: var(--text-secondary);">
              <Icon icon="lucide:search" width="32" height="32" style="margin-bottom:12px; opacity:0.5;" />
              <br/>No competitor schedules match your search filters. Try refining your keywords.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="pagination-container">
    <div class="pagination-stats">
      {#if totalItems > 0}
        Showing {startIndex + 1} to {endIndex} of {totalItems} entries
      {:else}
        Showing 0 to 0 of 0 entries
      {/if}
    </div>
    <div class="pagination-buttons">
      <button class="page-btn" onclick={prevPage} disabled={currentPage === 1} aria-label="Previous Page">Previous</button>
      <button class="page-btn" onclick={nextPage} disabled={currentPage === totalPages} aria-label="Next Page">Next</button>
    </div>
  </div>
</div>
