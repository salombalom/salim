import { seedDatabase } from '../seed';
const g = Number(process.argv[2]);
for (const s of seedDatabase.subjects.filter((x) => x.grade === g))
  for (const u of s.units)
    for (const l of u.lessons) {
      const qs = seedDatabase.questions.filter((q) => q.lessonId === l.id).slice(0, 3).map((q) => q.prompt.slice(0, 50));
      console.log(`${l.id} | ${u.title} | ${l.title} | ${l.objectives.join(' / ')} | ${qs.join(' ؛ ')}`);
    }
