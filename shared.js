/* İki sayfanın ortak yardımcıları */

const IMAGE_BASE = "https://mudae.net/uploads/";
const $ = (id) => document.getElementById(id);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
const toCharacter = ([name, series, rank, image]) => ({ name, series, rank, image });

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const TIERS = [[50, "SSS", 50], [300, "SS", 250], [1000, "S", 700], [3000, "A", 2000], [8000, "B", 5000], [Infinity, "C", 12000]];
const tierOf = (rank) => TIERS.find(([limit]) => rank <= limit)[1];
const kakeraOf = (rank) => Math.floor(25000 * (rank + 70) ** -0.75 + 20 + 0.5);
const format = (n) => n.toLocaleString("tr-TR");

const everyone = CHARACTERS.map(toCharacter);
const byName = (name) => everyone.find((c) => c.name === name);
const poolFor = (tier) => everyone.filter((c) => tierOf(c.rank) === tier);
