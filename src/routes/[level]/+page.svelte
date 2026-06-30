<script>
  import Icon from '@iconify/svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const level = $derived($page.params.level);
</script>

<svelte:head>
  <title>Select Year | FBLA NLC Stats Tracker</title>
</svelte:head>

<div class="year-select-container">
  <button class="back-to-levels-btn" onclick={() => goto('/')} aria-label="Back to Divisions">
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
    <div class="level-card active-year-card {level === 'high-school' ? 'hs-year' : 'col-year'}" onclick={() => goto(`/${level}/2026`)}>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="level-icon-wrapper year-icon-wrapper">
          <Icon icon="lucide:calendar" width="24" height="24" />
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px;">
          <h2 style="margin: 0; font-size: 20px; line-height: 1;">2026</h2>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <span class="badge badge-time">Schedules Loaded</span>
            {#if level === 'collegiate'}
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
