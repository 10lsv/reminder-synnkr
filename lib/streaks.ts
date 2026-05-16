// Calcul de streaks (séries) sur la liste des done_at d'un user.
//
// Hypothèse : on raisonne sur le YYYY-MM-DD UTC. Pour un user en Europe ça
// peut décaler la frontière de jour de quelques heures vs sa wall clock, mais
// l'effet est marginal (au plus +/- 1 jour aux heures de minuit) et v1.1 vit
// très bien avec.

export interface StreakStats {
  current: number; // jours d'affilée se terminant aujourd'hui ou hier
  longest: number; // plus longue série jamais réalisée
  totalDone: number;
}

function toDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeStreaks(
  doneTimestamps: Array<string | null>,
  now: Date = new Date(),
): StreakStats {
  const days = new Set<string>();
  let totalDone = 0;
  for (const t of doneTimestamps) {
    if (!t) continue;
    totalDone++;
    days.add(toDayKey(new Date(t)));
  }

  if (days.size === 0) return { current: 0, longest: 0, totalDone: 0 };

  // Plus longue série : iter les jours triés et compter les runs consécutifs.
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]).getTime();
    const curr = new Date(sorted[i]).getTime();
    if (Math.round((curr - prev) / 86_400_000) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Série en cours : aujourd'hui si elle a une done, sinon hier en
  // rétrocompatibilité (l'user a peut-être pas encore agi aujourd'hui).
  const todayKey = toDayKey(now);
  const yesterday = new Date(now.getTime() - 86_400_000);
  const yesterdayKey = toDayKey(yesterday);

  let cursor: Date | null = null;
  if (days.has(todayKey)) cursor = new Date(now);
  else if (days.has(yesterdayKey)) cursor = yesterday;

  let current = 0;
  while (cursor && days.has(toDayKey(cursor))) {
    current++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return { current, longest, totalDone };
}
