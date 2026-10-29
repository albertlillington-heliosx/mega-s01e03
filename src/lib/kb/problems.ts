// The problems inside one merged ticket, counted the desk's way. causes.ts places every report by its
// tenant. The reports the desk read as a one-day move (desk-notes.json) have no swapped month: they are
// a problem of their own, and, like any report read differently, they stay counted where they're filed.
import { groupByCause, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // Reports whose intake tag names a different problem than the one they belong to.
  mistagged: number;
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // For a cause: how many of its reports the desk read as a one-day move.
  alsoOneDay: number;
};

const count = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

function group(problem: Problem, rs: Report[], oneDay: readonly string[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: count(rs.map((r) => r.channel)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    alsoOneDay: problem === 'one-day' ? 0 : rs.filter((r) => oneDay.includes(r.id)).length,
  };
}

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byCause = groupByCause(merged, tenantOf).map((g) => group(g.cause, g.reports, oneDay));
  const moved = merged.filter((r) => oneDay.includes(r.id));
  return moved.length ? [...byCause, group('one-day', moved, oneDay)] : byCause;
}
