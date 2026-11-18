/* Shared phrasebook data: the built-in copy of canon/phrasebook.md (§2 and §6) plus its parser.
 * Used by the Phrases page and the Quiz's phrase-typing mode. A newer phrasebook.md loaded on the
 * Phrases page (Update button) is stored under wl.phrasebook.md and used by both.
 */
(function () {
  'use strict';
  // Snapshot of canon/phrasebook.md §2 and §6 (2026-11-17). Tap "Update" to load a newer phrasebook.md.
  const DEFAULT_MD = `
**A. Affection & goodnight**
| # | Phrase | Word by word | Meaning |
|---|---|---|---|
| 1 | amu to | love you | (I) love you |
| 2 | anmūci (an-MŪ-ci) | at early-morning | Goodnight. [Locked] fused from *an mūci*, short for *miroši to an mūci* |
| 3 | duršta ğal! | sleep-CMD well | Sleep well! |
| 4 | kofešta sa! | hug-CMD me | Hug me! (little hug: *kofebe*) |
| 5 | mwašta sa! | kiss-CMD me | Kiss me! (kiss = *mwa*, was *mja*; Chilly, 2026-11-16; little kiss: *mwabe*) |

**B. Greetings & goodbyes**
| # | Phrase | Word by word | Meaning |
|---|---|---|---|
| 6 | miroto (mi-RO-to) | see-you | Good morning / first greeting of the day. [Locked] Said only the first time you see someone that day; saying it again is rude (the first meeting of the day itself is *rēnu*) |
| 7 | tijente! | hello | Hello / hi (any later meeting). On the phone: *aloę* (said /alo/). Formal/outside: *bonžur* |
| 8 | adzer! | goodbye | Goodbye. Formal/outside: *orëvųwar* |
| 9 | miroši to an jōva | will-see you at pause | (I'll) see you at the pause |
| 10 | miroši to an ofra | will-see you at evening | (I'll) see you this evening |
| 11 | a to nëtsu! | are you here | Welcome home. [Locked] (*unur!* = welcome, for guests) |

**C. Directions & chores**
| # | Phrase | Word by word | Meaning |
|---|---|---|---|
| 12 | venšta nëtsu! | come-CMD here | Come here! |
| 13 | ētošta! | wait-CMD | Wait! |
| 14 | šomšta! | stop-CMD | Stop! |
| 15 | nešošta! | careful-CMD | Be careful! |
| 16 | vežešta ze pjas! | put.on-CMD PL shoe | Shoes on! |
| 17 | madzašta! | clothes-CMD | Get dressed! |
| 18 | sozunšta! / ugaršta tsa! | clean-CMD / put.away-CMD it | Clean up! / Put it away! |
| 19 | hifošta ze cimu! | wash-CMD PL hand | Wash your hands! |
| 20 | ādzušta! | hurry-CMD | Hurry up! |
| 21 | šta vo hi | LET go we-incl | Let's go |

**D. Praise & encouragement**
| # | Phrase | Word by word | Meaning |
|---|---|---|---|
| 22 | dzeka tsa! | did it | Good job! ("(you) did it!"). [Locked] |
| 23 | tēne to | thank you | (I) thank you. Outside: *mersi* |
| 24 | lomze o to | proud for you | (I'm) proud of you |
| 25 | šar dze tsa to! | can do it you | You can do it! (*to* kept for emphasis) |
| 26 | ēğešta! | gentle-CMD | Be gentle! |

**E. Meals**
| # | Phrase | Word by word | Meaning |
|---|---|---|---|
| 27 | šta maği hi | LET eat we-incl | Let's eat |
| 28 | venšta maği tse ro! | come-CMD eat with we-excl | Come eat with us! (exclusive *ro*: inviting someone in) |
| 29 | ğa pelda? | Q hungry | (Are you) hungry? |
| 30 | zan? | more | More? |
| 31 | ūfo | water | Water |
| 32 | pųwan (said /pwan/) | bread | Bread |
| 33 | frūtsu! | delicious | (It's) delicious! |
| 34 | urğo | full | (I'm) full |

**F. Bedtime**
| # | Phrase | Word by word | Meaning |
|---|---|---|---|
| 35 | vošta pa roği! | go-CMD to bed | Time for bed! |
| 36 | dzirušta ze dagu! | brush-CMD PL tooth | Brush your teeth! |
| 37 | klusašta! | bath-CMD | Bath time! |
| 38 | dural afa jōva | nap after pause | A nap after the pause (the pause is also time for yourself: nap, projects; lore §5) |
| 39 | wavolšta! | lie.down-CMD | Lie down! |
| 40 | nōvinši ğal | will-dream well | Sweet dreams. [Locked] |

**Idioms**
1. *wonše jōva tse to* = (I) share the pause with you → we're close. Past (*wonšeka jōva tse to*) = we go back a long way.
2. *Wonšešta jōva tse ro!* = Share the pause with us! (said to someone eating alone; lore §5).
3. *a jōvali to* = you're one of us at the pause. **Close friends only** (Lore, 2026-11-17); family stays blood and in-laws only. **For a casual guest** (Chilly, 2026-11-17): *Unur! Ğa pelda?* = welcome! hungry?
4. *Nie jōžešta!* = Don't eat alone! (a scold; *jōže* = eat the pause meal alone, "a crime"). Lore: still fits. Never scold for skipping the meal, only for eating alone.
5. *mūci sa* = (I'm) taking my quiet time → leave me be, happily. *mūci* is used as a verb (noun → verb, no marker). *sa* may drop when clear. Replaces *a d'an mūci* (Chilly, 2026-11-17: early morning is good alone time, not sad; Lore).
6. *Miroto, miroto?* = a tease for forgetting you already greeted someone.
7. [Draft] *a čāmi ža* = he's the odd one out → the special one (lore §6). Lore: stays special, with a tone-dependent edge (warm = "one of a kind", cold = a jab); Chilly is still unsure. *trahi* = a pair plus one.
8. *Ētošta ze uliva.* = Wait for the olives → be patient, good things take time.
9. *Tum gël!* = Plant a seed! → start small.
**Proverbs**
- *Tum gël, ētošta; vromši bler.* = Plant a seed, wait; a tree will grow.
- *Nie jōžešta; wonšešta jōva.* = Don't eat alone; share the pause.
- *Wonše jōva, vromši ampa.* = Share the pause, a heart will grow.
**Pet names (-be, soft forms)**: *ēgube* little star · *šëmmibe* little flower · *ampabe* little heart · *gëlbe* little seed · *Bašibe* Daddy · *Vunobe* Mommy (check: regular -be on *vuno*) · *mwabe* little kiss · *kofebe* little hug. Call the children together: *abu!*
`;

  // ---------- parse phrasebook markdown ----------
  const unmd = s => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();
  function tagOf(s) { const m = s.match(/\[(Locked|Draft)\]/); return m ? m[1] : ''; }
  const noTag = s => s.replace(/\s*\[(Locked|Draft)\]\s*/g, ' ').trim();
  function splitMeaning(s) {
    // first sentence = meaning, rest = note
    s = noTag(unmd(s));
    const m = s.match(/^(.+?[.!?])\s+(.+)$/);
    return m && m[1].length < 60 ? { meaning: m[1], note: m[2] } : { meaning: s, note: '' };
  }
  function parse(md) {
    const out = []; let cat = 'Phrases', mode = 'table';
    for (const raw of md.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      let m;
      if ((m = line.match(/^\*\*([A-Z]\.\s*.+?)\*\*\s*$/))) { cat = m[1].replace(/^[A-Z]\.\s*/, ''); mode = 'table'; continue; }
      if (/^\*\*Idioms\*\*/.test(line)) { cat = 'Idioms'; mode = 'list'; continue; }
      if (/^\*\*Proverbs\*\*/.test(line)) { cat = 'Proverbs'; mode = 'list'; continue; }
      if ((m = line.match(/^\*\*Pet names[^*]*\*\*:?\s*(.+)$/))) {
        for (const part of m[1].split('·')) {
          const pm = part.trim().match(/^\*(.+?)\*\s+(.+?)(?:\s*\((.+)\))?\.?$/);
          if (pm) out.push({ cat: 'Pet names', phrase: pm[1], wbw: '', meaning: pm[2].replace(/\.\s*Call.*$/, ''), note: pm[3] || '', tag: '' });
        }
        const call = m[1].match(/Call the children together:\s*\*(.+?)\*/);
        if (call) out.push({ cat: 'Pet names', phrase: call[1], wbw: '', meaning: 'Kids! (call the children together)', note: '', tag: '' });
        continue;
      }
      if (line.startsWith('|')) {
        const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        if (cells.length < 4 || /^-+$/.test(cells[0]) || /^#$/.test(cells[0])) continue;
        const [n, phrase, wbw, meaningCell] = cells;
        const say = phrase.match(/\(([^)]+)\)/);
        const { meaning, note } = splitMeaning(meaningCell);
        out.push({ cat, n, phrase: unmd(phrase.replace(/\s*\([^)]*\)\s*/, ' ')), say: say ? say[1] : '', wbw, meaning, note, tag: tagOf(meaningCell) });
        continue;
      }
      if (mode === 'list' && (m = line.match(/^(?:\d+\.|-)\s+(.+)$/))) {
        const body = m[1];
        if (/^\(Dropped/.test(body)) continue;
        const tag = tagOf(body), b = noTag(body);
        const pm = b.match(/^\*(.+?)\*\s*=\s*(.+)$/);
        if (!pm) continue;
        const { meaning, note } = splitMeaning(pm[2]);
        out.push({ cat, phrase: pm[1], wbw: '', meaning, note, tag });
      }
    }
    return out;
  }


  const KEY = 'wl.phrasebook.md';
  function load() {
    let md = null;
    try { md = JSON.parse(localStorage.getItem(KEY)); } catch {}
    return parse(md || DEFAULT_MD);
  }
  window.PHRASES = { DEFAULT_MD, parse, load, KEY };
})();
