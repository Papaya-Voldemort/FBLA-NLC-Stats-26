<script>
  import Icon from '@iconify/svelte';
  let { activeTab, theme, onTabChange, onThemeToggle } = $props();
</script>

<header>
  <div class="container header-container">
    <div class="logo-area">
      <Icon icon="lucide:award" class="logo-icon" />
      <div class="logo-text">
        <h1>NLC Stats</h1>
        <p>National Leadership Conference 2026</p>
      </div>
    </div>

    <div class="nav-controls">
      <div class="tabs-container">
        <button 
          class="tab-btn {activeTab === 'overview' ? 'active' : ''}" 
          onclick={() => onTabChange('overview')}
        >
          <Icon icon="lucide:layout-dashboard" width="16" height="16" />
          Overview
        </button>
        <button 
          class="tab-btn {activeTab === 'events' ? 'active' : ''}" 
          onclick={() => onTabChange('events')}
        >
          <Icon icon="lucide:book-open" width="16" height="16" />
          <span class="hide-mobile">Event Explorer</span>
          <span class="show-mobile">Events</span>
        </button>
        <button 
          class="tab-btn {activeTab === 'states-schools' ? 'active' : ''}" 
          onclick={() => onTabChange('states-schools')}
        >
          <Icon icon="lucide:globe" width="16" height="16" />
          <span class="hide-mobile">States & Schools</span>
          <span class="show-mobile">States</span>
        </button>
        <button 
          class="tab-btn {activeTab === 'search' ? 'active' : ''}" 
          onclick={() => onTabChange('search')}
        >
          <Icon icon="lucide:search" width="16" height="16" />
          <span class="hide-mobile">Competitor Finder</span>
          <span class="show-mobile">Search</span>
        </button>
      </div>

      <button id="theme-toggle-btn" class="theme-toggle" onclick={onThemeToggle} aria-label="Toggle Theme">
        {#if theme === 'dark'}
          <Icon icon="lucide:sun" width="20" height="20" class="sun-icon" />
        {:else}
          <Icon icon="lucide:moon" width="20" height="20" class="moon-icon" />
        {/if}
      </button>
    </div>
  </div>
</header>

