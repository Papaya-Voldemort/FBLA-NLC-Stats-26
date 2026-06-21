<script>
  import Icon from '@iconify/svelte';
  let { activeTab, theme, onTabChange, onThemeToggle, selectedLevel, selectedYear, onBackToStart } = $props();
</script>

<header>
  <div class="container header-container">
    <div class="logo-area">
      <Icon icon="lucide:award" class="logo-icon" />
      <div class="logo-text">
        <h1>NLC Stats</h1>
        <p>
          {#if selectedLevel === 'collegiate'}
            Collegiate NLC {selectedYear}
          {:else if selectedLevel === 'high-school'}
            High School & MS NLC {selectedYear}
          {:else}
            National Leadership Conference 2026
          {/if}
        </p>
      </div>
    </div>

    <div class="nav-controls">
      {#if selectedLevel && selectedYear}
        <button class="change-level-btn" onclick={onBackToStart}>
          <Icon icon="lucide:arrow-left" width="14" height="14" />
          Change Division
        </button>
        <nav class="tabs-container" aria-label="Dashboard views">
          <button 
            class="tab-btn {activeTab === 'overview' ? 'active' : ''}" 
            onclick={() => onTabChange('overview')}
            aria-current={activeTab === 'overview' ? 'page' : undefined}
          >
            <Icon icon="lucide:layout-dashboard" width="16" height="16" />
            Overview
          </button>
          <button 
            class="tab-btn {activeTab === 'events' ? 'active' : ''}" 
            onclick={() => onTabChange('events')}
            aria-current={activeTab === 'events' ? 'page' : undefined}
          >
            <Icon icon="lucide:book-open" width="16" height="16" />
            <span class="hide-mobile">Event Explorer</span>
            <span class="show-mobile">Events</span>
          </button>
          <button 
            class="tab-btn {activeTab === 'states-schools' ? 'active' : ''}" 
            onclick={() => onTabChange('states-schools')}
            aria-current={activeTab === 'states-schools' ? 'page' : undefined}
          >
            <Icon icon="lucide:globe" width="16" height="16" />
            <span class="hide-mobile">States & Schools</span>
            <span class="show-mobile">States</span>
          </button>
          <button 
            class="tab-btn {activeTab === 'search' ? 'active' : ''}" 
            onclick={() => onTabChange('search')}
            aria-current={activeTab === 'search' ? 'page' : undefined}
          >
            <Icon icon="lucide:search" width="16" height="16" />
            <span class="hide-mobile">Competitor Finder</span>
            <span class="show-mobile">Search</span>
          </button>
        </nav>
      {/if}

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

