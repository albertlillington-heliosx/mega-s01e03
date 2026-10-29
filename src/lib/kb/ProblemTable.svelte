<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByProblem, type Problem } from '#lib/kb/problems';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // `tickets`: where each problem is tracked now, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const rows = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const unique = $derived(uniqueById(rows).length);
  const groups = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const causes = $derived(groups.filter((g) => g.problem !== 'one-day'));
  const mistagged = $derived(causes.reduce((n, g) => n + g.mistagged, 0));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{unique}</strong> reports in #{ticket} ({rows.length} rows in the export, {rows.length - unique} of them repeats) ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tracked in</th><th>tenants</th><th>came in by</th><th>seen</th><th>intake tag wrong</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{#if tickets[g.problem]}<a href={tickets[g.problem]}>{tickets[g.problem]?.replace(/^.*\/issues\//, 'issue #')}</a>{:else}<span class="none">no ticket</span>{/if}</td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td class="muted">{g.firstSeen} → {g.lastSeen}</td>
        <td>{g.mistagged}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each causes as g (g.problem)}
  {#if g.alsoOneDay}
    <p class="muted">{g.alsoOneDay} of the <code>{g.problem}</code> reports read as a one-day move: counted under <code>{g.problem}</code> by tenant, and again under <code>one-day</code>.</p>
  {/if}
{/each}

<p class="muted">Intake's tag names the wrong cause for {mistagged} of these {unique} reports: it is guessed from the reporter's browser, not the tenant.</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
