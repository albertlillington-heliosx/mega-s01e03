<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByProblem, type Problem } from '#lib/kb/problems';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // `tickets`: where each problem is tracked now, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const rows = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const unique = $derived(groups.reduce((n, g) => n + g.reports.length, 0));
  const mistagged = $derived(groups.reduce((n, g) => n + g.mistagged, 0));
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

<p class="muted">Intake tagged {mistagged} of these {unique} reports with the wrong problem: the tag comes from the reporter's browser, the problem from the tenant.</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
