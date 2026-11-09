/* Ana sayfa: kapak kartları ve çekim denemesi */

function art(character) {
  const box = el("div", "art");
  const img = el("img");
  img.src = IMAGE_BASE + character.image;
  img.alt = character.name;
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", () => img.replaceWith(el("span", "fallback", character.name[0])));
  box.append(img);
  return box;
}

function renderHero() {
  const cards = [
    { c: byName("Makima"), cls: "a", sticker: ["wish", "Sen bunu istedin"] },
    { c: byName("Shrek"), cls: "b", sticker: ["got", "Sana bu geldi"] },
  ];
  for (const { c, cls, sticker } of cards) {
    const card = el("div", `hero-card ${cls} t-${tierOf(c.rank)}`);
    card.append(el("span", `sticker ${sticker[0]}`, sticker[1]), art(c));
    const meta = el("div", "card-meta");
    meta.append(el("span", `tier t-${tierOf(c.rank)}`, tierOf(c.rank)), el("span", "card-ka", `#${c.rank} · ${format(kakeraOf(c.rank))} ka`));
    card.append(meta, el("p", "card-name", c.name), el("p", "card-series", c.series));
    $("hero-cards").append(card);
  }
}

/* ---------- çekim ---------- */

const PITY_AFTER = 9;
const isHit = (c) => c.rank <= 1000;

const ROLL_LINES = [
  "Üçü de sana bakıyor. Seçim senin.",
  "Birini seç, 20 saniyen var. Burada süre tutmuyoruz, orada tutuyoruz.",
  "Hepsi umutla bekliyor. Birini mutlu et.",
  "Favorin bir sonraki çekimde olabilir. Hadi bir daha.",
];
const WED_LINES = [
  "Tek şahit bu kanal.",
  "Ailene söylemek sana kalmış.",
  "Nedeni sorulursa bilmiyorsun.",
  "$boşan komutu da var, bilgin olsun.",
];
const SPECIAL = {
  Shrek: "Bataklığı da senin artık.",
  "Walter White": "Evde kimyasal görürsen sorma.",
  "Homer Simpson": "Nükleer santral adına tebrikler.",
  "Darth Vader": "Babanla tanışma kısmı biraz karışık.",
  "SpongeBob SquarePants": "Yıkanabilir, bu bir artı.",
  Makima: "Sen onu seçtiğini sanıyorsun.",
};

let rolls, rings, pity, picked, harem;

function drawTier() {
  let roll = Math.random() * 20000;
  for (const [, tier, size] of TIERS) {
    roll -= size;
    if (roll < 0) return tier;
  }
  return "C";
}

function drawOne(exclude, onlyHit) {
  const tier = onlyHit ? (() => {
    const r = Math.random() * 1000;
    return r < 50 ? "SSS" : r < 300 ? "SS" : "S";
  })() : drawTier();
  const pool = poolFor(tier).filter((c) => !exclude.has(c.name));
  const character = pool.length ? pickOne(pool) : pickOne(everyone.filter((c) => !exclude.has(c.name)));
  exclude.add(character.name);
  return character;
}

function drawCards() {
  const exclude = new Set();
  const cards = [drawOne(exclude), drawOne(exclude), drawOne(exclude)];
  let forced = false;
  if (pity >= PITY_AFTER && !cards.some(isHit)) {
    cards[Math.floor(Math.random() * 3)] = drawOne(exclude, true);
    forced = true;
  }
  pity = cards.some(isHit) ? 0 : pity + 1;
  return { cards, forced };
}

function buildCard(character) {
  const tier = tierOf(character.rank);
  const card = el("button", `card t-${tier}`);
  card.type = "button";
  card.append(art(character), el("span", "card-name", character.name), el("span", "card-series", character.series));
  const row = el("span", "row");
  const left = el("span");
  left.append(el("span", `tier t-${tier}`, tier), document.createTextNode(` #${format(character.rank)}`));
  row.append(left, el("span", "ka", `${format(kakeraOf(character.rank))} ka`));
  card.append(row);
  card.addEventListener("click", () => marry(card, character));
  return card;
}

function updateStatus() {
  $("rolls").textContent = rolls;
  $("rings").textContent = rings;
  $("roll").disabled = rolls === 0;
  $("reset").hidden = rolls > 0;
  $("pity").textContent = `S+ garantisine en fazla ${Math.max(1, PITY_AFTER + 1 - pity)} çekim`;
  $("harem").hidden = harem.length === 0;
  $("harem").textContent = `Haremin: ${harem.join(", ")}`;
}

function roll() {
  if (rolls === 0) return;
  rolls -= 1;
  picked = false;
  const { cards, forced } = drawCards();
  $("cards").replaceChildren(...cards.map(buildCard));

  const tiers = cards.map((c) => tierOf(c.rank));
  if (rolls === 0) $("msg").textContent = "Son çekimindi. Yenisi 20 dakikada dolar, depo 12'de durur.";
  else if (forced) $("msg").textContent = "Garanti devreye girdi. Bugün bot senden yana.";
  else if (tiers.includes("SSS")) $("msg").textContent = "SSS geldi. Bu, 400 karttan birine denk geliyor. Sakin ol.";
  else if (tiers.every((t) => t === "C")) $("msg").textContent = "Üç C kart. Mütevazı bir aile.";
  else $("msg").textContent = pickOne(ROLL_LINES);
  updateStatus();
}

function marry(card, character) {
  if (picked) return;
  if (rings === 0) {
    $("msg").textContent = "Yüzüğün bitti. Yenisi 3 saatte gelir. Bu kadar sevgi sana fazla.";
    return;
  }
  picked = true;
  rings -= 1;
  harem.push(character.name);
  card.append(el("span", "ringed", "💍 Evli"));

  for (const other of $("cards").children) {
    other.disabled = true;
    if (other === card) {
      other.classList.add("won");
    } else {
      other.classList.add("lost");
      const name = other.querySelector(".card-name").textContent;
      const value = kakeraOf(byName(name).rank);
      other.append(el("span", "sub", `Açık artırma: ${format(Math.max(10, Math.round(value * 0.2)))} ka'dan başlar, tavan ${format(value * 3)} ka`));
    }
  }
  $("msg").textContent = `${character.name} ile evlendin. ${SPECIAL[character.name] || pickOne(WED_LINES)}`;
  updateStatus();
}

function reset() {
  rolls = 12;
  rings = 5;
  pity = 0;
  picked = false;
  harem = [];
  $("cards").replaceChildren(el("p", "empty", "Üç kart çıkacak, birini seçeceksin. Kalan ikisi kakera açık artırmasına gider. Hayat gibi."));
  updateStatus();
}

$("roll").addEventListener("click", roll);
$("reset").addEventListener("click", () => {
  reset();
  $("msg").textContent = "Hakların geri geldi. Gerçek botta bu düğme yok, görevler var.";
});

renderHero();
reset();
