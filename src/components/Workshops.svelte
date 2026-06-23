<!-- src/components/Workshops.svelte -->
<script>
  import Icon from '@iconify/svelte';
  import posthog from '../posthog.js';
  
  let { workshops = [] } = $props();
  
  // State variables
  let query = $state('');
  let selectedCategory = $state('All');
  let currentPage = $state(1);
  const itemsPerPage = 12;
  
  // Helper to categorize workshops
  function getWorkshopCategories(title, desc) {
    const categories = [];
    const t = (title + " " + desc).toLowerCase();
    
    if (t.includes('ai') || t.includes('artificial intelligence') || t.includes('vr') || t.includes('virtual reality') || t.includes('tech') || t.includes('simulation')) {
      categories.push({ name: 'Tech & AI', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' });
    }
    if (t.includes('lead') || t.includes('influence') || t.includes('character') || t.includes('officer') || t.includes('servant')) {
      categories.push({ name: 'Leadership', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' });
    }
    if (t.includes('career') || t.includes('college') || t.includes('resume') || t.includes('interview') || t.includes('job') || t.includes('employ') || t.includes('scholarship')) {
      categories.push({ name: 'Career & College', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' });
    }
    if (t.includes('finance') || t.includes('wealth') || t.includes('money') || t.includes('stock') || t.includes('credit') || t.includes('debt') || t.includes('tax') || t.includes('dollar')) {
      categories.push({ name: 'Finance', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' });
    }
    if (t.includes('speak') || t.includes('speech') || t.includes('pitch') || t.includes('voice') || t.includes('communication') || t.includes('conversation') || t.includes('talk')) {
      categories.push({ name: 'Public Speaking', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)' });
    }
    if (t.includes('chapter') || t.includes('adviser') || t.includes('classroom') || t.includes('cte') || t.includes('member') || t.includes('school')) {
      categories.push({ name: 'Chapter Ops', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' });
    }
    if (t.includes('network') || t.includes('collab') || t.includes('friend') || t.includes('team') || t.includes('connect')) {
      categories.push({ name: 'Networking', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.12)' });
    }
    
    if (categories.length === 0) {
      categories.push({ name: 'General', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.12)' });
    }
    
    return categories;
  }
  
  // Reactively attach categories to all workshops
  const workshopsWithCategories = $derived(
    workshops.map(w => ({
      ...w,
      categories: getWorkshopCategories(w.title, w.description)
    }))
  );
  
  // Filter workshops
  const filteredWorkshops = $derived(
    workshopsWithCategories.filter(w => {
      // 1. Text Query Filter
      let matchesQuery = true;
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        matchesQuery = w.title.toLowerCase().includes(q) ||
                       w.description.toLowerCase().includes(q) ||
                       w.presenter.toLowerCase().includes(q) ||
                       w.organization.toLowerCase().includes(q);
      }
      
      // 2. Category Filter
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        matchesCategory = w.categories.some(c => c.name === selectedCategory);
      }
      
      return matchesQuery && matchesCategory;
    })
  );
  
  // Derived pagination variables
  const totalItems = $derived(filteredWorkshops.length);
  const totalPages = $derived(Math.ceil(totalItems / itemsPerPage) || 1);
  const startIndex = $derived(totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage);
  const endIndex = $derived(Math.min(startIndex + itemsPerPage, totalItems));
  const pageData = $derived(filteredWorkshops.slice(startIndex, endIndex));
  
  // Reset pagination when query or category changes
  $effect(() => {
    query; selectedCategory;
    currentPage = 1;
  });
  
  // Track searches on PostHog
  let searchTimeout;
  $effect(() => {
    const q = query;
    clearTimeout(searchTimeout);
    if (q.trim().length >= 2) {
      searchTimeout = setTimeout(() => {
        posthog.capture('workshop searched', { query: q.trim(), results_count: filteredWorkshops.length });
      }, 600);
    }
  });
  
  const categoriesList = ['All', 'Tech & AI', 'Leadership', 'Career & College', 'Finance', 'Public Speaking', 'Chapter Ops', 'Networking'];
  
  function handleCategorySelect(cat) {
    selectedCategory = cat;
    posthog.capture('workshop category selected', { category: cat });
  }
  
  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
  
  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  let activeWorkshop = $state(null);
  let dialogRef = $state();

  function openWorkshopDetail(w) {
    activeWorkshop = w;
    posthog.capture('workshop clicked', {
      title: w.title,
      presenter: w.presenter,
      organization: w.organization,
      categories: w.categories.map(c => c.name)
    });
    if (dialogRef) {
      dialogRef.showModal();
    }
  }

  function closeWorkshopDetail() {
    if (dialogRef) {
      dialogRef.close();
    }
    activeWorkshop = null;
  }

  function handleResetFilters() {
    query = '';
    selectedCategory = 'All';
    posthog.capture('workshop filters reset');
  }

  $effect(() => {
    if (dialogRef && !('closedBy' in HTMLDialogElement.prototype)) {
      const handleLightDismiss = (event) => {
        if (event.target !== dialogRef) return;
        const rect = dialogRef.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          closeWorkshopDetail();
        }
      };
      dialogRef.addEventListener('click', handleLightDismiss);
      return () => {
        dialogRef.removeEventListener('click', handleLightDismiss);
      };
    }
  });
</script>

<div class="explorer-header flex-header" style="margin-bottom: 24px;">
  <div>
    <h2 style="font-family: 'Outfit'; font-weight: 700; margin: 0; font-size: 24px;">NLC Workshops Explorer</h2>
    <p style="color: var(--text-secondary); margin-top: 4px; font-size: 14px;">Browse and search educational workshops, presenter lineups, and topics for NLC 2026.</p>
  </div>
  <div class="stats-card-badge">
    <Icon icon="lucide:presentation" class="badge-icon" />
    <span>{totalItems} Available Sessions</span>
  </div>
</div>

<!-- Filters Bar -->
<div class="glass-panel" style="padding: 20px; margin-bottom: 24px;">
  <div class="search-grid" style="display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: center;">
    
    <!-- Search Input -->
    <div class="search-input-wrapper">
      <Icon icon="lucide:search" />
      <input 
        type="text" 
        placeholder="Search workshops by title, description, presenter, or org..." 
        bind:value={query}
        class="search-input"
      />
      {#if query}
        <button class="clear-btn" onclick={() => query = ''} aria-label="Clear Search">
          <Icon icon="lucide:x" width="16" height="16" />
        </button>
      {/if}
    </div>
    
    <!-- Category Pills -->
    <div class="category-filters-container">
      <span class="filter-label"><Icon icon="lucide:filter" width="14" height="14" /> Filter Topics:</span>
      <div class="category-pills">
        {#each categoriesList as cat}
          <button 
            class="pill-btn {selectedCategory === cat ? 'active' : ''}" 
            onclick={() => handleCategorySelect(cat)}
          >
            {cat}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Workshops Grid -->
{#if pageData.length > 0}
  <div class="workshops-grid">
    {#each pageData as w}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="glass-panel workshop-card hover-glow" onclick={() => openWorkshopDetail(w)}>
        <!-- Tags -->
        <div class="card-tags-area">
          {#each w.categories as cat}
            <span class="tag-badge" style="color: {cat.color}; background: {cat.bg}; border: 1px solid rgba(255, 255, 255, 0.05);">
              {cat.name}
            </span>
          {/each}
        </div>
        
        <h3 class="card-title">{w.title}</h3>
        
        <p class="card-description">{w.description}</p>
        
        <div class="card-footer-presenter">
          {#if w.presenter}
            <div class="footer-info-row">
              <Icon icon="lucide:user" class="footer-info-icon presenter-color" />
              <span class="footer-text presenter-name">{w.presenter}</span>
            </div>
          {/if}
          
          {#if w.organization}
            <div class="footer-info-row">
              <Icon icon="lucide:briefcase" class="footer-info-icon org-color" />
              <span class="footer-text org-name">{w.organization}</span>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Pagination Controls -->
  {#if totalPages > 1}
    <div class="pagination-container" style="margin-top: 32px;">
      <div class="pagination-stats">
        Showing <strong>{startIndex + 1} - {endIndex}</strong> of <strong>{totalItems}</strong> workshops
      </div>
      <div class="pagination-buttons">
        <button class="pagination-btn" onclick={prevPage} disabled={currentPage === 1} aria-label="Previous Page">
          <Icon icon="lucide:chevron-left" width="18" height="18" />
        </button>
        <span class="page-indicator">Page {currentPage} of {totalPages}</span>
        <button class="pagination-btn" onclick={nextPage} disabled={currentPage === totalPages} aria-label="Next Page">
          <Icon icon="lucide:chevron-right" width="18" height="18" />
        </button>
      </div>
    </div>
  {/if}
{:else}
  <!-- Empty State -->
  <div class="glass-panel empty-state-container" style="padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
    <div class="empty-icon-wrapper">
      <Icon icon="lucide:search-slash" width="36" height="36" style="color: var(--text-secondary);" />
    </div>
    <h3 style="font-family: 'Outfit'; font-weight: 700; margin: 0; font-size: 20px;">No Workshops Found</h3>
    <p style="color: var(--text-secondary); max-width: 450px; font-size: 14px; margin: 0;">We couldn't find any workshops matching your search queries or category filters. Try refining your keywords or selecting "All" topics.</p>
    <button class="btn btn-secondary" onclick={handleResetFilters}>Reset Filters</button>
  </div>

  <!-- Workshop Detail Dialog (Modal Overlay) -->
  <dialog 
    bind:this={dialogRef} 
    closedby="any" 
    class="glass-panel workshop-dialog"
    aria-labelledby="dialog-title"
  >
    {#if activeWorkshop}
      <div class="dialog-content">
        <div class="card-tags-area" style="margin-bottom: 8px;">
          {#each activeWorkshop.categories as cat}
            <span class="tag-badge" style="color: {cat.color}; background: {cat.bg}; border: 1px solid rgba(255, 255, 255, 0.05);">
              {cat.name}
            </span>
          {/each}
        </div>
  
        <h2 id="dialog-title" class="dialog-title">{activeWorkshop.title}</h2>
  
        <p class="dialog-description">{activeWorkshop.description}</p>
  
        <div class="dialog-info-section">
          {#if activeWorkshop.presenter}
            <div class="dialog-info-row">
              <Icon icon="lucide:user" class="dialog-info-icon presenter-color" />
              <div>
                <div class="dialog-info-label">Presenter</div>
                <div class="dialog-info-value presenter-name">{activeWorkshop.presenter}</div>
              </div>
            </div>
          {/if}
  
          {#if activeWorkshop.organization}
            <div class="dialog-info-row">
              <Icon icon="lucide:briefcase" class="dialog-info-icon org-color" />
              <div>
                <div class="dialog-info-label">Organization</div>
                <div class="dialog-info-value org-name">{activeWorkshop.organization}</div>
              </div>
            </div>
          {/if}
        </div>
  
        <div class="dialog-actions">
          <button class="btn btn-secondary" onclick={closeWorkshopDetail}>Close</button>
        </div>
      </div>
    {/if}
  </dialog>
{/if}

<style>
  .search-input-wrapper {
    position: relative;
    width: 100%;
  }

  .search-input-wrapper :global(svg) {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
    width: 18px;
    height: 18px;
  }

  .search-input {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--panel-border);
    color: var(--text-primary);
    padding: 12px 40px 12px 42px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .search-input:focus {
    border-color: var(--fbla-gold);
    box-shadow: 0 0 10px var(--fbla-gold-glow), inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .clear-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s ease;
  }

  .clear-btn:hover {
    color: var(--text-primary);
  }

  .flex-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  
  .stats-card-badge {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    padding: 10px 16px;
    border-radius: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .stats-card-badge :global(.badge-icon) {
    color: var(--fbla-gold);
  }
  
  /* Category Filters Styling */
  .category-filters-container {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 14px;
    margin-top: 4px;
  }
  
  .filter-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .category-pills {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding: 2px 0;
    flex-wrap: wrap;
  }
  
  .category-pills::-webkit-scrollbar {
    display: none;
  }
  
  .pill-btn {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--panel-border);
    color: var(--text-secondary);
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .pill-btn:hover {
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
  }
  
  .pill-btn.active {
    background: var(--primary-blue);
    border-color: var(--primary-blue);
    color: #ffffff;
    box-shadow: 0 2px 8px var(--primary-blue-glow);
  }
  
  /* Workshops Grid Styling */
  .workshops-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  
  .workshop-card {
    padding: 24px;
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .workshop-card:hover {
    transform: translateY(-4px);
  }
  
  .card-tags-area {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  
  .tag-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }
  
  .card-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 18px;
    line-height: 1.35;
    margin: 0 0 12px 0;
    color: var(--text-primary);
  }
  
  .card-description {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 20px 0;
    flex-grow: 1;
  }
  
  .card-footer-presenter {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .footer-info-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  
  :global(.footer-info-icon) {
    margin-top: 2px;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }
  
  :global(.presenter-color) {
    color: var(--fbla-gold);
  }
  
  :global(.org-color) {
    color: var(--primary-blue);
  }
  
  .footer-text {
    font-size: 12.5px;
    line-height: 1.4;
  }
  
  .presenter-name {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .org-name {
    color: var(--text-secondary);
  }
  
  .empty-icon-wrapper {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--panel-border);
    padding: 16px;
    border-radius: 50%;
    margin-bottom: 8px;
  }
  
  @media (max-width: 768px) {
    .flex-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .stats-card-badge {
      align-self: flex-start;
    }
    
    /* ponytail: simple layout for horizontal-scrolling pills without overflowing */
    .category-filters-container {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .category-pills {
      flex-wrap: nowrap;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 6px;
      min-width: 0;
    }
    
    .workshops-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  /* Dialog Styling */
  .workshop-dialog {
    border: 1px solid var(--panel-border);
    border-radius: 20px;
    background: var(--panel-bg);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    max-width: 600px;
    width: 90%;
    padding: 30px;
    color: var(--text-primary);
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    outline: none;
    opacity: 0;
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .workshop-dialog[open] {
    opacity: 1;
  }

  .workshop-dialog::backdrop {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dialog-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 22px;
    line-height: 1.35;
    color: var(--text-primary);
    margin: 0;
  }

  .dialog-description {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
  }

  .dialog-info-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 16px 0;
    margin: 8px 0;
  }

  .dialog-info-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dialog-info-row :global(svg) {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .dialog-info-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.5px;
  }

  .dialog-info-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--panel-border);
    color: var(--text-primary);
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    .workshop-dialog {
      padding: 20px;
      width: 95%;
    }
    
    .dialog-title {
      font-size: 18px;
    }
  }
</style>
