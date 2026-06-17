<script>
  import Icon from '@iconify/svelte';
  let { eventCounts, eventDetails, activeEventId = $bindable() } = $props();

  // Component state
  let sidebarQuery = $state('');
  let detailQuery = $state('');
  let showSidebarMobile = $state(true);

  // Auto-hide sidebar when active event is selected by parent
  $effect(() => {
    if (activeEventId) {
      showSidebarMobile = false;
    }
  });

  // Sorted and filtered event keys
  const sortedEvents = $derived(
    Object.keys(eventCounts)
      .sort()
      .filter(name => name.toLowerCase().includes(sidebarQuery.toLowerCase()))
  );

  const activeEvent = $derived(activeEventId ? eventDetails[activeEventId] : null);

  // Filtered detail entries
  const filteredEntries = $derived(
    activeEvent
      ? activeEvent.entries
          .filter(e => {
            if (!detailQuery) return true;
            const q = detailQuery.toLowerCase().trim();
            const competitorsStr = e.competitors.join(' ').toLowerCase();
            return (
              e.school_name.toLowerCase().includes(q) ||
              e.state.toLowerCase().includes(q) ||
              competitorsStr.includes(q) ||
              (e.section_name && e.section_name.toLowerCase().includes(q))
            );
          })
          .sort((a, b) => {
            if (a.arrival_time && b.arrival_time) {
              return a.arrival_time.localeCompare(b.arrival_time);
            }
            return a.school_name.localeCompare(b.school_name);
          })
      : []
  );

  function selectEvent(name) {
    activeEventId = name;
    detailQuery = '';
    showSidebarMobile = false;
  }
</script>

<div class="event-split-view">
  <!-- Left Sidebar: Event List -->
  <div class="event-sidebar {showSidebarMobile ? '' : 'hide-mobile'}">
    <div class="sidebar-search">
      <div class="search-input-wrapper">
        <Icon icon="lucide:search" />
        <input 
          type="text" 
          bind:value={sidebarQuery} 
          class="search-input" 
          placeholder="Search events..." 
          style="padding-top:8px; padding-bottom:8px;"
        />
      </div>
    </div>
    <div class="sidebar-list">
      {#each sortedEvents as name}
        {@const count = eventCounts[name]}
        {@const isMS = eventDetails[name]?.division === 'MS'}
        {@const divLabel = isMS ? 'MS' : 'HS'}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="event-list-item {activeEventId === name ? 'active' : ''}" 
          onclick={() => selectEvent(name)}
        >
          <div class="event-item-name" title={name}>{name}</div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="badge {isMS ? 'badge-ms' : 'badge-hs'}" style="font-size:8px; padding:1px 3px;">{divLabel}</span>
            <span class="event-item-count">{count}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Right Content: Selected Event Schedule -->
  <div class="event-detail-content {showSidebarMobile ? 'hide-mobile' : ''}">
    {#if !activeEvent}
      <div id="event-detail-empty" class="empty-state">
        <Icon icon="lucide:file-text" width="48" height="48" style="opacity: 0.5; margin-bottom: 12px;" />
        <h3>No Event Selected</h3>
        <p>Choose an event from the list on the left to view its participants, division breakdown, scheduled times, and presentation rooms.</p>
      </div>
    {:else}
      <div id="event-detail-active" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
        <button class="mobile-back-btn" onclick={() => showSidebarMobile = true}>
          <Icon icon="lucide:arrow-left" width="14" height="14" />
          Back to Events List
        </button>
        <div class="event-detail-header">
          <h2 class="event-detail-title">
            <Icon icon="lucide:book-open" width="22" height="22" style="margin-right:8px; color:var(--fbla-gold); vertical-align:middle;" />
            {activeEvent.name}
          </h2>
          <div class="event-detail-meta">
            <span class="badge {activeEvent.division === 'MS' ? 'badge-ms' : 'badge-hs'}" style="display:inline-flex; align-items:center;">
              <Icon icon={activeEvent.division === 'MS' ? 'lucide:school' : 'lucide:graduation-cap'} width="12" height="12" style="margin-right:4px;" />
              {activeEvent.division === 'MS' ? 'Middle School Division' : 'High School Division'}
            </span>
            <span class="badge badge-location" style="display:inline-flex; align-items:center;">
              <Icon icon="lucide:map-pin" width="12" height="12" style="margin-right:4px;" />
              Location(s): {Array.from(activeEvent.locations).join(', ')}
            </span>
            <span class="badge badge-time" style="display:inline-flex; align-items:center;">
              <Icon icon="lucide:calendar" width="12" height="12" style="margin-right:4px;" />
              Schedule(s): {Array.from(activeEvent.whens).join(' | ')}
            </span>
            <span class="badge badge-hs" style="display:inline-flex; align-items:center;">
              <Icon icon="lucide:users" width="12" height="12" style="margin-right:4px;" />
              {eventCounts[activeEventId]} Competitors
            </span>
          </div>
        </div>
        
        <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size: 14px; font-weight:600; color:var(--text-secondary);">Scheduled Sessions</div>
          <input 
            type="text" 
            bind:value={detailQuery} 
            class="search-input" 
            placeholder="Filter school, state, or name..." 
            style="max-width:240px; padding: 6px 12px; font-size:12px; height: 32px;"
          />
        </div>

        <div class="event-detail-body">
          <div class="table-responsive" style="margin-bottom:0; max-height:100%;">
            <table>
              <thead>
                <tr>
                  <th style="width: 22%;">School</th>
                  <th style="width: 10%;">State</th>
                  <th style="width: 15%;">Section</th>
                  <th style="width: 33%;">Competitor(s)</th>
                  <th style="width: 13%;">Scheduled Time</th>
                  <th style="width: 7%;">Page</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredEntries as entry}
                  <tr>
                    <td style="font-weight:600;">{entry.school_name}</td>
                    <td><span style="font-family:'Outfit'; font-weight:700;">{entry.state}</span></td>
                    <td><span class="badge badge-hs" style="font-size:11px;">{entry.section_name || 'Main'}</span></td>
                    <td>
                      <div class="competitors-cell">
                        {#each entry.competitors as name}
                          <span class="competitor-tag">{name}</span>
                        {:else}
                          <span style="color:red; font-size:11px;">[Not parsed]</span>
                        {/each}
                      </div>
                    </td>
                    <td>
                      <span class="badge {entry.arrival_time ? 'badge-time' : 'badge-location'}">
                        {entry.arrival_time || entry.event_when.split(' ').slice(-5).join(' ') || 'Scheduled'}
                      </span>
                    </td>
                    <td style="font-family:'Outfit'; font-weight:600; text-align:center; color:var(--fbla-gold);">{entry.page}</td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="6" style="text-align:center; padding: 30px; color:var(--text-secondary);">
                      No competitor schedules found matching "{detailQuery}"
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
