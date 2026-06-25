<script>
  import Icon from '@iconify/svelte';
  import posthog from '../posthog.js';
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>FBLA NLC 2026 Stats: Registration & Schedules</title>
  <meta name="description" content="Explore FBLA NLC stats, registration details, competitive events schedules, and national standings/results for the 2026 Future Business Leaders of America National Leadership Conference.">
</svelte:head>

<div class="start-screen-container">
  <div class="start-title-area">
    <h1>NLC Stats Analyzer</h1>
    <p>Choose an educational level to begin exploring competitive event schedule breakdowns and final standings.</p>
  </div>

  <div class="level-grid">
    <!-- High School Card -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="level-card hs-card" onclick={() => { posthog.capture('level selected', { level: 'high-school' }); goto('/high-school'); }}>
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
    <div class="level-card col-card" onclick={() => { posthog.capture('level selected', { level: 'collegiate' }); goto('/collegiate'); }}>
      <div class="level-icon-wrapper">
        <Icon icon="lucide:award" width="36" height="36" />
      </div>
      <h2>Collegiate</h2>
      <p>Analyze preliminary schedule assignments and view complete final national winners standings for College competitors.</p>
      <button class="btn">Select</button>
    </div>
  </div>
</div>
