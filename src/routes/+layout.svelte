<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';
  import posthog from '../posthog.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { children } = $props();

  let currentTheme = $state('dark');

  onMount(() => {
    const savedTheme = localStorage.getItem('fbla-analytics-theme') || 'dark';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  });

  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('fbla-analytics-theme', newTheme);
    posthog.capture('theme toggled', { new_theme: newTheme });
  }

  // Derive level, year, activeTab from page URL
  const selectedLevel = $derived($page.params.level || null);
  const selectedYear = $derived($page.params.year || null);
  const activeTab = $derived.by(() => {
    const path = $page.url.pathname;
    if (path.includes('/events')) return 'events';
    if (path.includes('/states-schools') || path.includes('/states/') || path.includes('/schools/')) return 'states-schools';
    if (path.includes('/search')) return 'search';
    if (path.includes('/workshops')) return 'workshops';
    if (selectedLevel && selectedYear) return 'overview';
    return null;
  });

  const hasWorkshops = $derived(selectedLevel === 'high-school');

  function handleTabChange(tab) {
    if (!selectedLevel || !selectedYear) return;
    if (tab === 'overview') {
      goto(`/${selectedLevel}/${selectedYear}`);
    } else if (tab === 'states-schools') {
      goto(`/${selectedLevel}/${selectedYear}/states-schools`);
    } else {
      goto(`/${selectedLevel}/${selectedYear}/${tab}`);
    }
  }

  function handleBackToStart() {
    goto('/');
  }
</script>

<Header 
  {activeTab} 
  theme={currentTheme}
  {selectedLevel}
  {selectedYear}
  {hasWorkshops}
  onTabChange={handleTabChange} 
  onThemeToggle={toggleTheme} 
  onBackToStart={handleBackToStart}
/>

<div class="scroll-container">
  <main class="container">
    {@render children()}
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2026 Future Business Leaders of America (FBLA) NLC Registration Analyzer.</p>
      <p style="margin-top: 8px; font-size: 11px; opacity: 0.6;">Built using SvelteKit 2 & Svelte 5. Parsed from official FBLA schedule releases.</p>
      <p style="margin-top: 12px; font-size: 10px; opacity: 0.5; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.4;">
        Disclaimer: This is an unofficial, independent analytics platform created solely for educational purposes. It is not affiliated with, authorized, maintained, sponsored, or endorsed by Future Business Leaders of America, Inc. (FBLA). All product and company names are the registered trademarks of their original owners.
      </p>
    </div>
  </footer>
</div>
