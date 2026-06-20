<script>
  import { onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import Icon from '@iconify/svelte';
  import posthog from '../posthog.js';

  let { allData, stateCounts, schoolCounts, eventCounts, eventDetails, theme, onSelectEvent } = $props();

  let chartDivisionsCanvas;
  let chartTeamsCanvas;
  let chartStatesCanvas;
  let chartScheduleCanvas;

  let chartDivisionsInstance;
  let chartTeamsInstance;
  let chartStatesInstance;
  let chartScheduleInstance;

  // Compute stats reactively
  const totalCompetitors = $derived(allData.reduce((acc, curr) => acc + curr.team_size, 0));
  const totalEntries = $derived(allData.length);
  const hsEntries = $derived(allData.filter(e => e.division === 'HS'));
  const msEntries = $derived(allData.filter(e => e.division === 'MS'));
  const hsCompetitors = $derived(hsEntries.reduce((acc, curr) => acc + curr.team_size, 0));
  const msCompetitors = $derived(msEntries.reduce((acc, curr) => acc + curr.team_size, 0));
  const uniqueStates = $derived(Object.keys(stateCounts).length);
  const uniqueSchools = $derived(Object.keys(schoolCounts).length);
  const top10Events = $derived(
    Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  );

  // Svelte 5 Runes Effect for Chart initialization & theme sync
  $effect(() => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const panelBorder = isDark ? '#080c14' : '#fff';

    // Clear old chart instances
    if (chartDivisionsInstance) chartDivisionsInstance.destroy();
    if (chartTeamsInstance) chartTeamsInstance.destroy();
    if (chartStatesInstance) chartStatesInstance.destroy();
    if (chartScheduleInstance) chartScheduleInstance.destroy();

    // 1. Division Doughnut
    if (chartDivisionsCanvas) {
      chartDivisionsInstance = new Chart(chartDivisionsCanvas, {
        type: 'doughnut',
        data: {
          labels: ['High School', 'Middle School'],
          datasets: [{
            data: [hsCompetitors, msCompetitors],
            backgroundColor: ['#3b82f6', '#10b981'],
            borderWidth: isDark ? 2 : 1,
            borderColor: panelBorder
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            title: {
              display: true,
              text: 'Division Share',
              color: isDark ? '#f8fafc' : '#0f172a',
              font: { family: 'Outfit', size: 12, weight: 'bold' }
            }
          }
        }
      });
    }

    // 2. Team Size Configuration Pie Chart
    const team1 = allData.filter(e => e.team_size === 1).length;
    const team2 = allData.filter(e => e.team_size === 2).length;
    const team3 = allData.filter(e => e.team_size >= 3).length;

    if (chartTeamsCanvas) {
      chartTeamsInstance = new Chart(chartTeamsCanvas, {
        type: 'pie',
        data: {
          labels: ['Individual (1)', '2-Person', '3+ Person'],
          datasets: [{
            data: [team1, team2, team3],
            backgroundColor: ['#002F6C', '#FFC72C', '#a78bfa'],
            borderWidth: isDark ? 2 : 1,
            borderColor: panelBorder
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            title: {
              display: true,
              text: 'Team Configurations',
              color: isDark ? '#f8fafc' : '#0f172a',
              font: { family: 'Outfit', size: 12, weight: 'bold' }
            }
          }
        }
      });
    }

    // 3. States Leaderboard Bar Chart
    const topStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (chartStatesCanvas && topStates.length > 0) {
      chartStatesInstance = new Chart(chartStatesCanvas, {
        type: 'bar',
        data: {
          labels: topStates.map(x => x[0]),
          datasets: [{
            label: 'Competitors',
            data: topStates.map(x => x[1]),
            backgroundColor: 'rgba(255, 199, 44, 0.85)',
            hoverBackgroundColor: '#FFC72C',
            borderColor: '#FFC72C',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} Competitors` } }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
            },
            y: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Outfit', weight: 'bold' } }
            }
          }
        }
      });
    }

    // 4. Schedule Active Density Matrix
    const tuesdayHours = {
      '8:00 AM': 0, '9:00 AM': 0, '10:00 AM': 0, '11:00 AM': 0, '12:00 PM': 0,
      '1:00 PM': 0, '2:00 PM': 0, '3:00 PM': 0, '4:00 PM': 0
    };

    allData.forEach(entry => {
      if (entry.arrival_time) {
        const t = entry.arrival_time;
        const hourMatch = t.match(/^(\d{1,2}):\d{2}\s*(AM|PM)/i);
        if (hourMatch) {
          const h = parseInt(hourMatch[1]);
          const ampm = hourMatch[2].toUpperCase();
          const formattedHour = `${h}:00 ${ampm}`;
          if (tuesdayHours.hasOwnProperty(formattedHour)) {
            tuesdayHours[formattedHour] += entry.team_size;
          }
        }
      } else if (entry.event_when && entry.event_when.includes('Tuesday')) {
        if (entry.event_when.includes('8:30 AM') || entry.event_when.includes('10:00 AM')) {
          tuesdayHours['9:00 AM'] += entry.team_size;
        } else {
          tuesdayHours['2:00 PM'] += entry.team_size;
        }
      }
    });

    if (chartScheduleCanvas) {
      chartScheduleInstance = new Chart(chartScheduleCanvas, {
        type: 'line',
        data: {
          labels: Object.keys(tuesdayHours),
          datasets: [{
            label: 'Competitors Active',
            data: Object.values(tuesdayHours),
            fill: true,
            backgroundColor: 'rgba(0, 47, 108, 0.25)',
            borderColor: '#3b82f6',
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#FFC72C',
            pointBorderColor: '#002F6C',
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              bottom: 10
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} Students Active` } }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Outfit' } }
            }
          }
        }
      });
    }
  });

  onDestroy(() => {
    if (chartDivisionsInstance) chartDivisionsInstance.destroy();
    if (chartTeamsInstance) chartTeamsInstance.destroy();
    if (chartStatesInstance) chartStatesInstance.destroy();
    if (chartScheduleInstance) chartScheduleInstance.destroy();
  });
</script>

<!-- KPI Row -->
<div class="kpi-grid">
  <div class="kpi-card kpi-card-competitors">
    <div class="kpi-card-header">
      <div>
        <div class="kpi-label">Total Competitors</div>
        <div class="kpi-value">{totalCompetitors.toLocaleString()}</div>
      </div>
      <div class="kpi-icon-wrapper">
        <Icon icon="lucide:users" width="22" height="22" />
      </div>
    </div>
    <div class="kpi-subtext">Registered Students</div>
  </div>

  <div class="kpi-card kpi-card-entries">
    <div class="kpi-card-header">
      <div>
        <div class="kpi-label">Total Entries</div>
        <div class="kpi-value">{totalEntries.toLocaleString()}</div>
      </div>
      <div class="kpi-icon-wrapper">
        <Icon icon="lucide:clipboard-list" width="22" height="22" />
      </div>
    </div>
    <div class="kpi-subtext">Competitive Events Scheduled</div>
  </div>

  <div class="kpi-card kpi-card-hs">
    <div class="kpi-card-header">
      <div>
        <div class="kpi-label">High School (HS)</div>
        <div class="kpi-value">{hsCompetitors.toLocaleString()}</div>
      </div>
      <div class="kpi-icon-wrapper">
        <Icon icon="lucide:graduation-cap" width="22" height="22" />
      </div>
    </div>
    <div class="kpi-subtext">
      <span class="kpi-trend">{Math.round((hsCompetitors / totalCompetitors) * 100)}%</span> of total registrations
    </div>
  </div>

  <div class="kpi-card kpi-card-ms">
    <div class="kpi-card-header">
      <div>
        <div class="kpi-label">Middle School (MS)</div>
        <div class="kpi-value">{msCompetitors.toLocaleString()}</div>
      </div>
      <div class="kpi-icon-wrapper">
        <Icon icon="lucide:school" width="22" height="22" />
      </div>
    </div>
    <div class="kpi-subtext">
      <span class="kpi-trend">{Math.round((msCompetitors / totalCompetitors) * 100)}%</span> of total registrations
    </div>
  </div>

  <div class="kpi-card kpi-card-states">
    <div class="kpi-card-header">
      <div>
        <div class="kpi-label">Represented States</div>
        <div class="kpi-value">{uniqueStates}</div>
      </div>
      <div class="kpi-icon-wrapper">
        <Icon icon="lucide:map-pin" width="22" height="22" />
      </div>
    </div>
    <div class="kpi-subtext">Active Associations</div>
  </div>

  <div class="kpi-card kpi-card-chapters">
    <div class="kpi-card-header">
      <div>
        <div class="kpi-label">Local Chapters</div>
        <div class="kpi-value">{uniqueSchools.toLocaleString()}</div>
      </div>
      <div class="kpi-icon-wrapper">
        <Icon icon="lucide:building-2" width="22" height="22" />
      </div>
    </div>
    <div class="kpi-subtext">Schools Represented</div>
  </div>
</div>

<!-- Charts Row 1 -->
<div class="dashboard-row">
  <div class="glass-panel col-6">
    <div class="glass-panel-header">
      <h2>Demographics & Teams</h2>
    </div>
    <div class="division-split" style="margin-bottom: 24px;">
      <div class="division-box hs-theme">
        <div class="division-title" style="color:#60a5fa;">High School Division</div>
        <div class="division-count">{hsCompetitors.toLocaleString()}</div>
        <div style="font-size:12px; color:var(--text-secondary);">Registrations</div>
      </div>
      <div class="division-box ms-theme">
        <div class="division-title" style="color:#34d399;">Middle School Division</div>
        <div class="division-count">{msCompetitors.toLocaleString()}</div>
        <div style="font-size:12px; color:var(--text-secondary);">Registrations</div>
      </div>
    </div>
    <div class="chart-double-col">
      <div class="chart-wrapper">
        <canvas bind:this={chartDivisionsCanvas} style="max-height: 180px;"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas bind:this={chartTeamsCanvas} style="max-height: 180px;"></canvas>
      </div>
    </div>
  </div>

  <div class="glass-panel col-6">
    <div class="glass-panel-header">
      <h2>State Power Rankings</h2>
    </div>
    <div class="chart-container">
      <canvas bind:this={chartStatesCanvas}></canvas>
    </div>
  </div>
</div>

<!-- Charts Row 2 -->
<div class="dashboard-row">
  <div class="glass-panel col-6">
    <div class="glass-panel-header">
      <h2>Top 10 Most Popular Events</h2>
    </div>
    <div class="list-wrapper">
      {#each top10Events as [eventName, count], index}
        {@const divBadge = eventDetails[eventName]?.division === 'MS' ? 'badge-ms' : 'badge-hs'}
        {@const divText = eventDetails[eventName]?.division === 'MS' ? 'MS' : 'HS'}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="rank-item" style="cursor: pointer;" onclick={() => { posthog.capture('overview event clicked', { event_name: eventName, rank: index + 1, competitors_count: count, division: eventDetails[eventName]?.division }); onSelectEvent(eventName); }}>
          <div class="rank-name-area">
            <div class="rank-badge">{index + 1}</div>
            <div>
              <div class="rank-label">{eventName}</div>
              <div class="rank-sub">
                <span class="badge {divBadge}" style="padding: 1px 4px; font-size:9px;">{divText}</span>
                &nbsp;•&nbsp; {Array.from(eventDetails[eventName]?.locations || ['Stars at Night'])[0]}
              </div>
            </div>
          </div>
          <div class="rank-value">{count} Competitors</div>
        </div>
      {/each}
    </div>
  </div>

  <div class="glass-panel col-6">
    <div class="glass-panel-header">
      <h2>Event Schedule Load</h2>
    </div>
    <div class="chart-container">
      <canvas bind:this={chartScheduleCanvas}></canvas>
    </div>
  </div>
</div>
