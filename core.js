/* Shared engine for the Family Language offline tools.
 * Every page loads this. The word list lives in localStorage under the same key the
 * Lookup page (index.html) uses, so importing once anywhere feeds every tool.
 * Grammar rules (endings, irregulars) are in RULES below. Edit them there when the grammar changes.
 */
(function () {
  'use strict';
  const KEY = 'wordlookup.v1';
  const STAR_KEY = 'wordlookup.stars.v1';

  // ---------- storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
  };

  // ---------- text helpers ----------
  const VOWELS = 'aeiouëāēīōūąęįų';
  const SILENT = /[ąęįųçş]/g;           // phonology §4b silent letters
  const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const soundKey = s => fold(s.toLowerCase().replace(SILENT, ''));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const isVowel = ch => VOWELS.includes(ch);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- parsing (same formats as the Lookup page) ----------
  function splitWordIpa(s) {
    const m = s.match(/^(.*?)\s*\/([^/]*)\/\s*$/);
    return m ? { word: m[1].trim(), ipa: m[2].trim() } : { word: s.trim(), ipa: '' };
  }
  function parseCSVLine(line, sep) {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i+1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true;
      else if (c === sep) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map(s => s.trim());
  }
  const HEAD = {
    id: ['word id', 'id', 'wid'], word: ['word', 'conlang', 'lemma', 'headword', 'spelling'],
    ipa: ['ipa', 'pronunciation', 'pron'], pos: ['part of speech', 'pos', 'class', 'type'],
    meaning: ['meaning', 'gloss', 'definition', 'english', 'translation']
  };
  function mapHeader(cells) {
    const low = cells.map(c => c.toLowerCase().trim()); const idx = {};
    for (const [k, names] of Object.entries(HEAD)) { const i = low.findIndex(c => names.includes(c)); if (i >= 0) idx[k] = i; }
    return idx.word !== undefined ? idx : null;
  }
  function rowsToWords(rows) {
    if (!rows.length) return [];
    let idx = mapHeader(rows[0]), body = rows;
    if (idx) body = rows.slice(1);
    else if (rows[0].length >= 4) idx = { id: 0, word: 1, pos: 2, meaning: 3 };
    else if (rows[0].length === 3) idx = { word: 0, pos: 1, meaning: 2 };
    else idx = { word: 0, meaning: 1 };
    const words = [];
    body.forEach((r, n) => {
      const get = k => idx[k] !== undefined ? (r[idx[k]] || '').trim() : '';
      let { word, ipa } = splitWordIpa(get('word'));
      if (!ipa) ipa = get('ipa').replace(/^\/|\/$/g, '');
      if (!word || /^-+$/.test(word)) return;
      words.push({ id: get('id') || ('r' + (n + 1)), word, ipa, pos: get('pos'), meaning: get('meaning') });
    });
    return words;
  }
  function parseWordList(text) {
    text = text.replace(/^﻿/, '').trim();
    if (!text) return [];
    if (/^[\[{]/.test(text)) {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : (data.words || data.entries || []);
      return arr.map((o, n) => {
        const g = (...ks) => { for (const k of ks) if (o[k] != null) return String(o[k]); return ''; };
        let { word, ipa } = splitWordIpa(g('word', 'conlang', 'lemma', 'headword'));
        ipa = ipa || g('ipa', 'pronunciation').replace(/^\/|\/$/g, '');
        return { id: g('id', 'wordId', 'word_id') || ('r' + (n + 1)), word, ipa,
          pos: g('pos', 'partOfSpeech', 'part_of_speech', 'class'), meaning: g('meaning', 'gloss', 'definition', 'english') };
      }).filter(w => w.word);
    }
    // markdown tables (lexicon files) -> strip leading/trailing pipes
    const lines = text.split(/\r?\n/).map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !/^\|?\s*-{2,}/.test(l))
      .map(l => l.replace(/^\|\s*/, '').replace(/\s*\|$/, ''));
    const sample = lines.slice(0, 5).join('\n');
    let sep = '|';
    if (!sample.includes('|')) sep = sample.includes('\t') ? '\t' : ',';
    const rows = lines.filter(l => sep !== '|' || l.includes('|'))
      .map(l => sep === '|' ? l.split('|').map(s => s.trim()) : parseCSVLine(l, sep));
    return rowsToWords(rows);
  }

  // ---------- library ----------
  let lib = store.get(KEY, { name: '', words: [], importedAt: null });
  const byKey = new Map();   // folded spelling -> [entries]
  const bySound = new Map(); // spelling without silent letters -> [entries]
  function push(map, k, w) { if (!k) return; const a = map.get(k); a ? a.push(w) : map.set(k, [w]); }
  function reindex() {
    byKey.clear(); bySound.clear();
    for (const w of lib.words) { push(byKey, fold(w.word), w); push(bySound, soundKey(w.word), w); }
  }
  reindex();
  function setWords(words, mode, name) {
    if (mode === 'merge' && lib.words.length) {
      const map = new Map(lib.words.map(w => [w.id, w]));
      for (const w of words) {
        const old = map.get(w.id);
        map.set(w.id, old ? { ...old, ...Object.fromEntries(Object.entries(w).filter(([, v]) => v)) } : w);
      }
      lib.words = [...map.values()];
    } else lib.words = words;
    if (name) lib.name = name;
    lib.importedAt = new Date().toISOString();
    const clean = { ...lib, words: lib.words.map(({ id, word, ipa, pos, meaning }) => ({ id, word, ipa, pos, meaning })) };
    if (!store.set(KEY, clean)) toast('Could not save. The list will reset on reload.');
    reindex();
    document.dispatchEvent(new CustomEvent('wl:words'));
  }
  const words = () => lib.words;
  const defined = () => lib.words.filter(w => w.meaning);
  function find(form) {
    const f = fold(form);
    return byKey.get(f) || bySound.get(soundKey(form)) || [];
  }

  // ---------- stars (shared with Lookup) ----------
  const stars = new Set(store.get(STAR_KEY, []));
  function toggleStar(id) { stars.has(id) ? stars.delete(id) : stars.add(id); store.set(STAR_KEY, [...stars]); return stars.has(id); }

  // ---------- grammar rules (canon/grammar.md, as of 2026-11-17) ----------
  const RULES = {
    // ending: { forms: [after-consonant, after-vowel] or single, tag, label, kind }
    suffixes: [
      { id: 'past', forms: ['ka'], tag: 'PST', label: 'past (-ka)', kind: 'tense' },
      { id: 'fut', forms: ['ši'], tag: 'FUT', label: 'future (-ši)', kind: 'tense', sDrop: true },
      { id: 'would', forms: ['kaši'], tag: 'WOULD', label: 'would (-kaši)', kind: 'tense' },
      { id: 'cmd', forms: ['šta'], tag: 'CMD', label: 'command (-šta)', kind: 'tense', sDrop: true },
      { id: 'noun', forms: ['al', 'la'], tag: 'NOUN', label: 'noun / quality (-al/-la)', kind: 'derive' },
      { id: 'desc', forms: ['on', 'na'], tag: 'DESC', label: 'describer (-on/-na)', kind: 'derive' },
      { id: 'dim', forms: ['be'], tag: 'DIM', label: 'small / dear (-be)', kind: 'derive' },
      { id: 'doer', forms: ['il', 'li'], tag: 'DOER', label: 'doer (-il/-li)', kind: 'derive' },
      { id: 'place', forms: ['el', 'so'], tag: 'PLACE', label: 'place (-el/-so)', kind: 'derive', frozen: true },
      { id: 'tool', forms: ['es', 'se'], tag: 'TOOL', label: 'tool (-es/-se)', kind: 'derive', frozen: true },
      // family possession: the pronoun joins onto a family word (grammar §4)
      { id: 'my', forms: ['sa'], tag: 'my', label: 'my (family)', kind: 'family' },
      { id: 'your', forms: ['to'], tag: 'your', label: 'your (family)', kind: 'family' },
      { id: 'his', forms: ['ža'], tag: 'his/her', label: 'his/her (family)', kind: 'family' },
      { id: 'ourI', forms: ['hi'], tag: 'our.incl', label: 'our, incl. you (family)', kind: 'family' },
      { id: 'ourX', forms: ['ro'], tag: 'our.excl', label: 'our, not you (family)', kind: 'family' },
      { id: 'yall', forms: ['tros'], tag: "y'all's", label: "you all's (family)", kind: 'family' },
      { id: 'their', forms: ['dzu'], tag: 'their', label: 'their (family)', kind: 'family' },
    ],
    prefixes: [
      { id: 'opp', forms: ['ul'], tag: 'OPP', label: 'opposite (ul-)' },
      { id: 'again', forms: ['mo', 'om'], tag: 'AGAIN', label: 'again (mo-/om-)' }, // mo- before consonant or ç, om- before vowel
    ],
    // whole-word irregulars (grammar §5)
    irregular: {
      e: { root: 'a', tags: ['PST'], gloss: 'was' },
      zla: { root: 'vo', tags: ['PST'], gloss: 'went' },
      zlaši: { root: 'vo', tags: ['WOULD'], gloss: 'would go' },
      eši: { root: 'a', tags: ['WOULD'], gloss: 'would be' },
      can: { root: 'hem', tags: [], gloss: 'better' },
      cam: { root: 'hem', tags: [], gloss: 'best' },
      abu: { root: 'fube', tags: ['PL'], gloss: 'children' },
    },
    // build-side irregular joins: root + suffix id -> form
    irregularJoin: { 'vo+past': 'zla', 'a+past': 'e', 'vo+would': 'zlaši', 'a+would': 'eši', 'fube+pl': 'abu' },
    // s-verbs: lose s and lengthen the vowel before any ending (mōka, dōši, gūka, clūšta)
    sVerbs: { mos: 'mō', dos: 'dō', gus: 'gū', clus: 'clū' },
  };
  // map lengthened stems back
  const sVerbStem = Object.fromEntries(Object.entries(RULES.sVerbs).map(([k, v]) => [v, k]));

  // ---------- word analysis (reading direction) ----------
  const famWord = w => /family/i.test(w.pos);
  function lexHits(form) {
    if (sVerbStem[form]) return find(sVerbStem[form]).map(e => ({ entry: e, note: 's-verb' }));
    return find(form).map(e => ({ entry: e }));
  }
  function analyzeCore(form, depth) {
    const out = [];
    const irr = RULES.irregular[fold(form)] || RULES.irregular[form];
    if (irr) {
      const e = find(irr.root)[0];
      out.push({ parts: [{ form, type: 'root', entry: e, gloss: irr.gloss }], tags: irr.tags, irregular: true, cost: 0 });
    }
    for (const h of lexHits(form)) out.push({ parts: [{ form, type: 'root', entry: h.entry }], tags: [], cost: 0 });
    if (depth >= 3 || form.length < 3) return out;
    // suffixes, longest first
    const sufs = RULES.suffixes.flatMap(s => s.forms.map(f => ({ s, f }))).sort((a, b) => b.f.length - a.f.length);
    for (const { s, f } of sufs) {
      if (!form.endsWith(f) || form.length - f.length < 1) continue;
      const stem = form.slice(0, -f.length);
      const stems = [stem];
      if (s.sDrop) stems.push(stem + 's', stem + 'š', stem + 'ş');
      for (const st of stems) {
        for (const sub of analyzeCore(st, depth + 1)) {
          const root = sub.parts[0].entry;
          if (s.kind === 'family' && !(root && famWord(root) && sub.parts.length === 1)) continue;
          const parts = sub.parts.map((p, i) => i === sub.parts.length - 1 && st !== stem ? { ...p, form: stem, restored: st } : p);
          out.push({ parts: [...parts, { form: f, type: 'suffix', rule: s }], tags: [...sub.tags, s.tag],
            cost: sub.cost + (s.kind === 'family' ? 1 : 2) + (st !== stem ? 0.5 : 0) + (s.frozen ? 1 : 0), irregular: sub.irregular });
        }
      }
    }
    for (const p of RULES.prefixes) for (const f of p.forms) {
      if (!form.startsWith(f) || form.length - f.length < 2) continue;
      for (const sub of analyzeCore(form.slice(f.length), depth + 1)) {
        out.push({ parts: [{ form: f, type: 'prefix', rule: p }, ...sub.parts], tags: [p.tag, ...sub.tags], cost: sub.cost + 2.5 });
      }
    }
    return out;
  }
  // Main entry: returns { token, clean, liaison, best, all }
  function analyze(token) {
    let t = token.toLowerCase().replace(/[’`]/g, "'");
    let liaison = '';
    const lm = t.match(/^([a-zš])'(.+)$/);       // d'an, l'uliva, r'e
    if (lm) { liaison = lm[1]; t = lm[2]; }
    t = t.replace(/^'+|'+$/g, '');
    const all = analyzeCore(t, 0);
    all.sort((a, b) => a.cost - b.cost || (b.parts.find(p => p.type === 'root')?.entry?.meaning ? 1 : 0) - (a.parts.find(p => p.type === 'root')?.entry?.meaning ? 1 : 0));
    // dedupe by breakdown
    const seen = new Set(), uniq = [];
    for (const a of all) { const k = a.parts.map(p => p.form + ':' + (p.entry?.id || p.rule?.id || '')).join('|'); if (!seen.has(k)) { seen.add(k); uniq.push(a); } }
    // last resort: a two-root compound (blerčavi = bler + čavi, luculogrol = lucu + l + ogrol)
    if (!uniq.length && t.length >= 5) {
      for (let i = 2; i <= t.length - 2; i++) {
        const a = t.slice(0, i); let b = t.slice(i), link = '';
        const A = find(a)[0];
        if (!A) continue;
        let B = find(b)[0];
        if (!B && b[0] === 'l' && b.length > 2) { B = find(b.slice(1))[0]; if (B) { link = 'l'; b = b.slice(1); } }
        if (B) uniq.push({ parts: [{ form: a, type: 'root', entry: A }, ...(link ? [{ form: 'l', type: 'suffix', rule: { tag: 'LINK', label: 'linking l between two vowels' } }] : []),
          { form: b, type: 'root', entry: B }], tags: [], cost: 6, compound: true });
      }
    }
    return { token, clean: t, liaison, best: uniq[0] || null, all: uniq.slice(0, 5) };
  }
  // Short English gloss for an analysis: "go-PST", "dad-my"
  function shortMeaning(m) {
    if (!m) return '';
    let s = m.split(/[;,(]/)[0].trim().replace(/^to /, '');
    return s.length > 18 ? s.slice(0, 17) + '…' : s;
  }
  function glossOf(a) {
    if (!a) return '?';
    const rg = p => (p.gloss || (p.entry ? shortMeaning(p.entry.meaning) || '(no meaning)' : '?')).replace(/\s+/g, '.');
    return a.parts.filter(p => p.rule?.tag !== 'LINK').map(p => p.type === 'root' ? rg(p) : p.rule.tag).join('-');
  }
  function rootEntry(a) { return a?.parts.find(p => p.type === 'root')?.entry || null; }

  // ---------- word building (writing direction) ----------
  function variantFor(rule, stem) {
    if (rule.forms.length === 1) return rule.forms[0];
    const last = stem[stem.length - 1];
    if (rule.id === 'again') return (isVowel(stem[0]) && stem[0] !== 'ç') ? rule.forms[1] : rule.forms[0];
    return isVowel(last) ? rule.forms[1] : rule.forms[0];
  }
  // steps: [{type:'prefix'|'suffix', id}] applied in order; returns { form, notes[] }
  function build(rootWord, steps) {
    let form = rootWord, notes = [];
    let bare = true;
    for (const st of steps) {
      const rule = (st.type === 'prefix' ? RULES.prefixes : RULES.suffixes).find(r => r.id === st.id);
      if (!rule) continue;
      if (st.type === 'prefix') {
        const v = variantFor(rule, form);
        form = v + form;
        if (rule.id === 'again') notes.push(v === 'om' ? 'om- before a vowel' : 'mo- before a consonant or silent ç');
        continue;
      }
      const ij = bare && RULES.irregularJoin[form + '+' + rule.id];
      if (ij) { form = ij; notes.push('irregular: ' + ij); bare = false; continue; }
      let stem = form;
      if (bare && RULES.sVerbs[stem]) { stem = RULES.sVerbs[stem]; notes.push('s-verb: drops s, long vowel'); }
      else if (rule.sDrop && /[sšş]$/.test(stem)) { stem = stem.slice(0, -1); notes.push('final s/š drops before -' + rule.forms[0]); }
      const v = variantFor(rule, stem);
      if (rule.forms.length > 1) notes.push(`-${v} after a ${isVowel(stem[stem.length - 1]) ? 'vowel' : 'consonant'}`);
      if (/[ąęįų]$/.test(stem)) notes.push('silent letter is said again before an ending');
      if (rule.frozen) notes.push(rule.label.split(' (')[0] + ' ending is frozen: listed words only');
      form = stem + v;
      bare = false;
    }
    return { form, notes };
  }

  // ---------- UI helpers ----------
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const TOOLS = [
    ['index.html', 'Lookup'], ['flashcards.html', 'Cards'], ['quiz.html', 'Quiz'],
    ['glosser.html', 'Gloss'], ['builder.html', 'Build'], ['phrasebook.html', 'Phrases'], ['reader.html', 'Read'],
  ];
  function nav() {
    const here = location.pathname.split('/').pop() || 'index.html';
    return `<nav class="tools">${TOOLS.map(([h, n]) => `<a href="${h}" class="${h === here ? 'on' : ''}">${n}</a>`).join('')}</nav>`;
  }
  function mountNav() {
    const h = $('header.top');
    if (h) h.insertAdjacentHTML('afterbegin', nav());
  }

  // Generic file/paste import dialog. opts: { title, help, accept, onText(text, name, mode), modes }
  function importDialog(opts) {
    const d = document.createElement('dialog');
    d.innerHTML = `<h3 style="margin-top:0">${esc(opts.title || 'Import')}</h3>
      <p class="muted">${opts.help || ''}</p>
      <div class="drop"><input type="file" accept="${opts.accept || '.txt,.csv,.tsv,.json,.md,text/*'}"><div class="muted">or drop a file here</div></div>
      <textarea placeholder="…or paste it here"></textarea>
      ${opts.modes === false ? '' : `<div class="row" style="margin-top:10px">
        <label class="chk"><input type="radio" name="m" value="replace" checked> Replace</label>
        <label class="chk"><input type="radio" name="m" value="merge"> Merge</label></div>`}
      <div class="row" style="margin-top:12px; justify-content:flex-end">
        <button data-x>Close</button><button class="primary" data-go>Import</button></div>`;
    document.body.appendChild(d);
    let name = '';
    const ta = $('textarea', d), file = $('input[type=file]', d), drop = $('.drop', d);
    const read = async f => { name = f.name.replace(/\.[^.]+$/, ''); ta.value = await f.text(); toast(`Loaded ${f.name}. Tap Import.`); };
    file.onchange = e => e.target.files[0] && read(e.target.files[0]);
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); e.dataTransfer.files[0] && read(e.dataTransfer.files[0]); };
    $('[data-x]', d).onclick = () => { d.close(); d.remove(); };
    $('[data-go]', d).onclick = () => {
      try {
        const mode = $('input[name=m]:checked', d)?.value || 'replace';
        if (opts.onText(ta.value, name, mode) !== false) { d.close(); d.remove(); }
      } catch (err) { toast('Import failed: ' + err.message); }
    };
    d.showModal();
  }
  function importWords() {
    importDialog({
      title: 'Import word list',
      help: "Your app's meaning sheet (<code>id | word /ipa/ | part of speech | meaning</code>), a lexicon .md table, CSV, TSV or JSON. Every tool shares this list.",
      onText(text, name, mode) {
        const w = parseWordList(text);
        if (!w.length) { toast('No words found in that text'); return false; }
        setWords(w, mode, name); toast(`Imported ${w.length} words`);
      }
    });
  }
  function noWordsHTML() {
    return `<div class="empty-state"><p style="font-size:40px">📖</p><p><b>No words loaded yet.</b></p>
      <p>Import your word list once and every tool can use it.</p>
      <p><button class="primary" onclick="WL.importWords()">Import word list</button></p></div>`;
  }

  // Bottom sheet showing a word analysis
  function wordSheet(token) {
    let sh = $('#wlSheet');
    if (!sh) {
      sh = document.createElement('div'); sh.id = 'wlSheet'; sh.className = 'sheet';
      document.body.appendChild(sh);
      document.addEventListener('keydown', e => e.key === 'Escape' && sh.classList.remove('open'));
    }
    sh.innerHTML = '<button class="close" aria-label="Close">×</button>' + analysisHTML(analyze(token), true);
    $('.close', sh).onclick = () => sh.classList.remove('open');
    sh.classList.add('open');
  }
  function morphHTML(a) {
    return a.parts.map(p => p.type === 'root' ? esc(p.form) : `<span class="aff">${esc(p.form)}</span>`).join('<span class="sep">·</span>');
  }
  function analysisHTML(r, full) {
    if (!r.best) return `<div class="morph">${esc(r.clean || r.token)}</div>
      <p class="bad">Not found in the word list${/^[A-ZÀ-Ž]/.test(r.token) ? ' (maybe a name)' : ''}.</p>`;
    const a = r.best, e = rootEntry(a);
    const ends = a.parts.filter(p => p.type !== 'root').map(p => `<li><b>${p.type === 'prefix' ? esc(p.form) + '-' : '-' + esc(p.form)}</b> ${esc(p.rule.label)}</li>`).join('');
    const alts = full && r.all.length > 1 ? `<p class="muted">Other readings: ${r.all.slice(1).map(x => `${morphHTML(x)} (${esc(glossOf(x))})`).join(' · ')}</p>` : '';
    return `<div class="morph">${r.liaison ? `<span class="muted">${esc(r.liaison)}'</span>` : ''}${morphHTML(a)}</div>
      <div class="tag" style="margin:4px 0">${esc(glossOf(a))}</div>
      ${e ? `<div><b>${esc(e.word)}</b> ${e.ipa ? `<span class="ipa">/${esc(e.ipa)}/</span>` : ''} ${e.pos ? `<span class="pos">${esc(e.pos)}</span>` : ''}</div>
        <div>${e.meaning ? esc(e.meaning) : '<i class="muted">no meaning yet</i>'}</div>` : ''}
      ${a.compound ? `<p class="muted">Guessed as a compound: ${a.parts.filter(p => p.type === 'root').map(p => `<b>${esc(p.entry.word)}</b> (${esc(p.entry.meaning || '?')})`).join(' + ')}. Not in the list as one word.</p>` : ''}
      ${a.irregular ? `<p class="muted">Irregular form.</p>` : ''}
      ${r.liaison ? `<p class="muted">${esc(r.liaison)}' is a liaison from the word before.</p>` : ''}
      ${ends ? `<ul style="margin:6px 0; padding-left:18px">${ends}</ul>` : ''}${alts}`;
  }
  const tokenRe = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)?/gu;
  // Wrap words in a text with tappable spans
  function tappable(text) {
    let out = '', last = 0;
    for (const m of text.matchAll(tokenRe)) {
      out += esc(text.slice(last, m.index)) + `<span class="tw" data-w="${esc(m[0])}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  window.WL = {
    store, fold, soundKey, esc, $, $$, isVowel,
    parseWordList, setWords, words, defined, find, get lib() { return lib; },
    stars, toggleStar, RULES, analyze, glossOf, rootEntry, shortMeaning, build, variantFor,
    toast, download, mountNav, importDialog, importWords, noWordsHTML,
    wordSheet, analysisHTML, morphHTML, tappable, tokenRe,
  };
  document.addEventListener('DOMContentLoaded', mountNav);
})();
