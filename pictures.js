/* Pictures for words.
 * 1) Built-in: emoji matched to the English meaning (free, every phone has them).
 * 2) Your own photos: added on the Kids page, kept on the phone (IndexedDB).
 * 3) A shared picture pack: export from one phone, put it in the repo as pictures.json,
 *    and every phone that opens the site gets the same pictures.
 */
(function () {
  'use strict';
  // English meaning (first gloss, lowercase) -> emoji
  const EMOJI = {
    // food & drink
    apple: '🍎', bread: '🍞', water: '💧', milk: '🥛', cheese: '🧀', egg: '🥚', meat: '🍖', fish: '🐟', rice: '🍚',
    soup: '🍲', stew: '🍲', cake: '🍰', 'birthday cake': '🎂', cookie: '🍪', candy: '🍬', 'ice cream': '🍦', chocolate: '🍫',
    honey: '🍯', butter: '🧈', salt: '🧂', lemon: '🍋', orange: '🍊', banana: '🍌', grape: '🍇', cherry: '🍒', pear: '🍐',
    peach: '🍑', melon: '🍈', strawberry: '🍓', pineapple: '🍍', mango: '🥭', coconut: '🥥', tomato: '🍅', potato: '🥔',
    carrot: '🥕', corn: '🌽', onion: '🧅', garlic: '🧄', cucumber: '🥒', lettuce: '🥬', cabbage: '🥬', mushroom: '🍄',
    peanut: '🥜', chestnut: '🌰', olive: '🫒', 'green olive': '🫒', 'black olive': '🫒', 'olive oil': '🫒', pumpkin: '🎃',
    'sweet potato': '🍠', beans: '🫘', pizza: '🍕', sandwich: '🥪', hamburger: '🍔', 'french fries': '🍟', spaghetti: '🍝',
    pasta: '🍝', pancake: '🥞', croissant: '🥐', baguette: '🥖', sausage: '🌭', popcorn: '🍿', coffee: '☕', tea: '🍵',
    juice: '🧃', 'orange juice': '🧃', 'apple juice': '🧃', soda: '🥤', beer: '🍺', wine: '🍷', 'baby bottle': '🍼',
    pie: '🥧', fruit: '🍉', vegetable: '🥦', 'chili pepper': '🌶️', lollipop: '🍭', yogurt: '🍶', salad: '🥗', omelet: '🍳',
    meal: '🍽️', 'the pause meal': '🍽️', snack: '🍪', dessert: '🍮', jam: '🍓', fig: '🍐', almond: '🌰', walnut: '🌰', hazelnut: '🌰', nut: '🌰',
    // animals
    dog: '🐶', puppy: '🐶', cat: '🐱', kitten: '🐱', cow: '🐮', calf: '🐮', pig: '🐷', piglet: '🐷', horse: '🐴', foal: '🐴',
    sheep: '🐑', lamb: '🐑', goat: '🐐', 'kid (young goat)': '🐐', donkey: '🫏', mule: '🫏', chicken: '🐔', chick: '🐤', rooster: '🐓',
    duck: '🦆', duckling: '🦆', goose: '🪿', bird: '🐦', 'little bird': '🐦', owl: '🦉', eagle: '🦅', crow: '🐦‍⬛', parrot: '🦜',
    swan: '🦢', pigeon: '🕊️', penguin: '🐧', rabbit: '🐰', mouse: '🐭', rat: '🐀', fox: '🦊', wolf: '🐺', bear: '🐻',
    deer: '🦌', fawn: '🦌', boar: '🐗', lion: '🦁', tiger: '🐯', leopard: '🐆', elephant: '🐘', monkey: '🐵', giraffe: '🦒',
    zebra: '🦓', camel: '🐫', kangaroo: '🦘', hedgehog: '🦔', squirrel: '🐿️', beaver: '🦫', badger: '🦡', otter: '🦦', bat: '🦇',
    frog: '🐸', toad: '🐸', snake: '🐍', lizard: '🦎', turtle: '🐢', crocodile: '🐊', dragon: '🐉', dinosaur: '🦕', mammoth: '🦣',
    whale: '🐳', dolphin: '🐬', shark: '🦈', octopus: '🐙', crab: '🦀', shrimp: '🦐', seal: '🦭', jellyfish: '🪼', snail: '🐌',
    bee: '🐝', ant: '🐜', butterfly: '🦋', spider: '🕷️', ladybug: '🐞', beetle: '🪲', mosquito: '🦟', fly: '🪰', worm: '🪱',
    caterpillar: '🐛', cricket: '🦗', grasshopper: '🦗', bull: '🐂', ox: '🐂', walrus: '🦭', trout: '🐟', eel: '🐟', moth: '🦋',
    // nature
    sun: '☀️', moon: '🌙', star: '⭐', sky: '🌌', cloud: '☁️', rain: '🌧️', snow: '❄️', snowflake: '❄️', wind: '💨',
    storm: '⛈️', lightning: '⚡', thunder: '⛈️', rainbow: '🌈', fire: '🔥', flame: '🔥', ice: '🧊', 'ice cube': '🧊',
    tree: '🌳', 'olive tree': '🌳', 'lemon tree': '🌳', 'apple tree': '🌳', pine: '🌲', leaf: '🍃', flower: '🌸', rose: '🌹', tulip: '🌷',
    grass: '🌱', seed: '🌱', sprout: '🌱', mountain: '⛰️', volcano: '🌋', hill: '⛰️', sea: '🌊', wave: '🌊', ocean: '🌊',
    river: '🏞️', lake: '🏞️', island: '🏝️', beach: '🏖️', desert: '🏜️', forest: '🌲', stone: '🪨', rock: '🪨', shell: '🐚',
    feather: '🪶', nest: '🪹', wood: '🪵', 'wood (material)': '🪵', firewood: '🪵', comet: '☄️', planet: '🪐', earthquake: '🌋', fog: '🌫️',
    sunrise: '🌅', sunset: '🌇', night: '🌙', 'early morning': '🌄', evening: '🌆', day: '🌞', smoke: '💨', 'sunshine': '🌞',
    // body
    hand: '✋', foot: '🦶', leg: '🦵', arm: '💪', eye: '👁️', ear: '👂', nose: '👃', mouth: '👄', lip: '👄', tooth: '🦷',
    tongue: '👅', hair: '💇', head: '🙂', face: '😀', heart: '❤️', brain: '🧠', bone: '🦴', finger: '☝️', thumb: '👍', muscle: '💪',
    // people & family
    baby: '👶', child: '🧒', boy: '👦', girl: '👧', man: '👨', woman: '👩', dad: '👨', mom: '👩', daddy: '👨', grandmother: '👵',
    grandfather: '👴', family: '👪', 'family (the group)': '👪', friend: '🤝', king: '🤴', queen: '👸', prince: '🤴', princess: '👸',
    teacher: '🧑‍🏫', doctor: '🧑‍⚕️', nurse: '🧑‍⚕️', farmer: '🧑‍🌾', cook: '🧑‍🍳', baker: '🧑‍🍳', pilot: '🧑‍✈️', firefighter: '🧑‍🚒',
    police: '👮', soldier: '💂', fairy: '🧚', witch: '🧙', ghost: '👻', monster: '👾', robot: '🤖', pirate: '🏴‍☠️', toddler: '🧒',
    // home & things
    house: '🏠', cottage: '🏡', door: '🚪', window: '🪟', bed: '🛏️', chair: '🪑', table: '🍽️', lamp: '💡', 'light bulb': '💡',
    key: '🔑', lock: '🔒', clock: '🕰️', book: '📖', ball: '⚽', toy: '🧸', doll: '🪆', gift: '🎁', balloon: '🎈', candle: '🕯️',
    bell: '🔔', phone: '📱', 'cell phone': '📱', computer: '💻', tv: '📺', camera: '📷', radio: '📻', music: '🎵', song: '🎶',
    guitar: '🎸', piano: '🎹', violin: '🎻', drum: '🥁', trumpet: '🎺', flute: '🪈', cup: '☕', mug: '☕', plate: '🍽️', bowl: '🥣',
    spoon: '🥄', fork: '🍴', knife: '🔪', bottle: '🍾', 'glass (drinking)': '🥛', basket: '🧺', bag: '👜', box: '📦', backpack: '🎒',
    scissors: '✂️', pencil: '✏️', pen: '🖊️', paper: '📄', letter: '✉️', envelope: '✉️', map: '🗺️', umbrella: '☂️', broom: '🧹',
    soap: '🧼', toothbrush: '🪥', sponge: '🧽', bucket: '🪣', hammer: '🔨', axe: '🪓', saw: '🪚', shovel: '🪏', ladder: '🪜',
    chain: '⛓️', rope: '🪢', thread: '🧵', needle: '🪡', sock: '🧦', shoe: '👟', boot: '🥾', hat: '👒', cap: '🧢', shirt: '👕',
    't-shirt': '👕', dress: '👗', coat: '🧥', jacket: '🧥', pants: '👖', glove: '🧤', scarf: '🧣', clothes: '👚', swimsuit: '🩱',
    glasses: '👓', 'glasses (eyes)': '👓', ring: '💍', 'ring (jewelry)': '💍', crown: '👑', necklace: '📿', money: '💰', coin: '🪙',
    medal: '🏅', flag: '🏳️', puzzle: '🧩', 'card (playing, trading)': '🃏', game: '🎲', kite: '🪁', 'bath': '🛁', bathtub: '🛁', toilet: '🚽',
    shower: '🚿', mirror: '🪞', pillow: '🛏️', blanket: '🛌', crib: '🛏️', lantern: '🏮', 'trash can': '🗑️', magnet: '🧲', fridge: '🧊',
    // places & travel
    school: '🏫', hospital: '🏥', church: '⛪', castle: '🏰', shop: '🏪', bakery: '🥖', bank: '🏦', hotel: '🏨', park: '🏞️',
    farm: '🚜', barn: '🛖', garden: '🌻', bridge: '🌉', road: '🛣️', city: '🏙️', village: '🏘️', car: '🚗', bus: '🚌', train: '🚆',
    airplane: '✈️', boat: '⛵', 'little boat': '⛵', ship: '🚢', bicycle: '🚲', motorcycle: '🏍️', truck: '🚚', taxi: '🚕',
    helicopter: '🚁', ambulance: '🚑', tractor: '🚜', rocket: '🚀', 'slide (playground)': '🛝', 'swing (playground)': '🛝',
    // feelings & describers (good for little ones)
    happy: '😀', sad: '😢', angry: '😠', scared: '😨', tired: '😴', sleepy: '😪', hungry: '🤤', surprised: '😮', sick: '🤒',
    hot: '🥵', cold: '🥶', funny: '😂', shy: '😳', big: '🐘', small: '🐭', red: '🟥', blue: '🟦', green: '🟩', yellow: '🟨',
    white: '⬜', black: '⬛', purple: '🟪', brown: '🟫', pink: '🩷', gray: '🩶', 'orange (color)': '🟧', wet: '💦', fast: '🐆', slow: '🐢',
    // actions
    eat: '🍽️', drink: '🥤', sleep: '😴', run: '🏃', walk: '🚶', swim: '🏊', jump: '🦘', dance: '💃', sing: '🎤', cry: '😭',
    laugh: '😆', smile: '😊', play: '🧸', read: '📖', write: '✍️', draw: '🖍️', paint: '🎨', cook: '🧑‍🍳', wash: '🧼', hug: '🤗',
    kiss: '😘', love: '❤️', see: '👀', hear: '👂', clap: '👏', fly: '🪽', climb: '🧗', ride: '🚴', sit: '🪑', wave: '👋',
    sneeze: '🤧', yawn: '🥱', think: '🤔', build: '🧱', plant: '🌱', bake: '🧁', brush: '🪥', point: '👉', kick: '🦵',
    // numbers
    one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  };
  const gloss = m => (m || '').toLowerCase().replace(/^to /, '').trim();
  const firstGloss = m => gloss(m).split(/[;,]/)[0].replace(/\s*\(.*?\)\s*/g, '').trim();
  function emojiFor(w) {
    if (!w?.meaning) return '';
    const m = gloss(w.meaning);
    return EMOJI[m] || EMOJI[m.split(/[;,]/)[0].trim()] || EMOJI[firstGloss(w.meaning)] || '';
  }

  // ---------- own photos (IndexedDB) ----------
  let dbp;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open('wl-pictures', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('pics');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => { const t = d.transaction('pics', mode); const s = t.objectStore('pics'); const out = fn(s);
      t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error); });
  }
  let cache = null; // id -> dataURL
  async function loadAll() {
    if (cache) return cache;
    cache = {};
    try {
      const d = await db();
      await new Promise((res) => {
        const r = d.transaction('pics').objectStore('pics').openCursor();
        r.onsuccess = () => { const c = r.result; if (c) { cache[c.key] = c.value; c.continue(); } else res(); };
        r.onerror = () => res();
      });
    } catch {}
    return cache;
  }
  async function setPic(id, dataURL) { await tx('readwrite', s => s.put(dataURL, id)); (await loadAll())[id] = dataURL; }
  async function delPic(id) { await tx('readwrite', s => s.delete(id)); delete (await loadAll())[id]; }

  // Shrink a photo so hundreds fit on a phone
  function shrink(file, size = 320) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, size / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Not an image')); };
      img.src = url;
    });
  }

  // Shared pack: pictures.json next to the pages ({ "w0179": "data:image/jpeg;base64,..." })
  async function loadPack() {
    if (location.protocol === 'file:') return 0;
    try {
      const r = await fetch('pictures.json', { cache: 'no-store' });
      if (!r.ok) return 0;
      const pack = await r.json(); const all = await loadAll(); let n = 0;
      for (const [id, url] of Object.entries(pack)) if (!all[id] && /^data:image\//.test(url)) { await setPic(id, url); n++; }
      return n;
    } catch { return 0; }
  }

  // picture for a word: { kind: 'img'|'emoji', src } or null
  async function picFor(w) {
    const all = await loadAll();
    if (all[w.id]) return { kind: 'img', src: all[w.id] };
    const e = emojiFor(w);
    return e ? { kind: 'emoji', src: e } : null;
  }
  function picHTML(p, cls = '') {
    if (!p) return `<span class="pic ${cls}">❓</span>`;
    return p.kind === 'img' ? `<img class="pic ${cls}" src="${p.src}" alt="">` : `<span class="pic ${cls}">${p.src}</span>`;
  }

  window.PICS = { EMOJI, emojiFor, loadAll, setPic, delPic, shrink, loadPack, picFor, picHTML, firstGloss };
})();
