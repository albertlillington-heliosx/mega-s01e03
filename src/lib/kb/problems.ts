// The problems inside one merged ticket. causes.ts places a report by its tenant; a report the desk
// read as a one-day move (desk-notes.json) has no swapped month at all, so it is a problem of its own.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDay: ReadonlySet<string>): Problem {
  if (oneDay.has(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // Reports whose intake tag names a different problem than the one they belong to.
  mistagged: number;
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const count = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): ProblemGroup[] {
  const moved = new Set(oneDay);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of uniqueById(reports).filter((r) => r.mergedInto === ticket)) {
    const p = problemOf(r, tenantOf(r), moved);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: count(rs.map((r) => r.channel)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
