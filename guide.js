/* Rehber: kakera hesabı, savaşçı ve komut listeleri */

/* ---------- kakera hesabı ---------- */

function updateCalc() {
  const rank = Math.round(Number($("rank").value));
  if (!Number.isFinite(rank) || rank < 1 || rank > 20000) {
    $("calc-out").textContent = "1 ile 20.000 arası gir.";
    return;
  }
  $("calc-out").textContent = `${format(kakeraOf(rank))} ka · ${tierOf(rank)} kademesi`;
}
$("rank").addEventListener("input", updateCalc);

/* ---------- savaşçılar ---------- */

function renderRoster(role) {
  const list = FIGHTERS.filter((f) => role === "Hepsi" || f.role === role);
  $("roster").replaceChildren(...list.map((f) => {
    const box = el("details", "fighter");
    const summary = el("summary");
    summary.append(el("span", "f-name", f.name), el("span", "f-role", f.role), el("span", "f-title", f.title));
    const body = el("div", "f-body");
    const stats = el("div", "stats");
    ["Can", "Saldırı", "Savunma", "Hız", "Kritik"].forEach((label, i) => {
      const cell = el("div");
      cell.append(el("small", "", label), document.createTextNode(f.stats[i]));
      stats.append(cell);
    });
    body.append(stats, el("h4", "", f.pn), el("p", "", f.pd), el("p", "f-series", f.series));
    box.append(summary, body);
    return box;
  }));
}

function renderTabs(host, labels, onPick) {
  const buttons = labels.map((label, i) => {
    const button = el("button", "", label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(i === 0));
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      onPick(label);
    });
    return button;
  });
  host.replaceChildren(...buttons);
  onPick(labels[0]);
}

renderTabs($("role-filter"), ["Hepsi", ...new Set(FIGHTERS.map((f) => f.role))], renderRoster);

/* ---------- komutlar ---------- */

const COMMANDS = {
  "Çekim": ["Önce bunlar. Sonrası zaten bağımlılık.", "$w $h $m $zaman $mu $ru $ku $günlük $haklar $gk $rt $us"],
  "Harem": ["Topladıklarını düzene sok, harem dediğin vitrin ister.", "$harem $ilk $sırala $not $resim $renk $renkhr $renkpr"],
  "Kakera": ["Parası parayla değil. Ama vakitle.", "$kakera $rozetödül $bronz $safir $yakut $elmas $kule $inşa $yık $ganimet $lk $hasat $bonus $anahtarbilgi $kristaller"],
  "Dilek": ["Bot not alır, evren almaz.", "$dilek $dileksil $dilekler $dilektemizle $beğen $beğenisil $beğeniler $kapat $aç $kapatılanlar"],
  "Ticaret": ["Karakter, kakera, boşanma. Hayatın özeti.", "$ver $takas $kakeraver $boşan $boşanseri $boşanhepsi"],
  "Beyhudee modu": ["Üç kartın yanına aktif oyun.", "$haremmodu $tahmin $bulmaca $av"],
  "Otomatik savaş": ["Sen uyu, takımın çalışsın.", "$oto $savunma $taktik $görünüm $sefer"],
  "Dövüş": ["Bahane bırakmayan kısım.", "$düello $etiket $öğretici $takım $savaşçılar $savaşçı $dövüşrehberi $etkiler $arena $dövüşprofil $görevler $sezon $dükkan $kozmetik $ustalık $canlı $bahis $dövüşkulesi $baskın $turnuva $sıra"],
  "Eğlence": ["GIF'li şiddet ve sevgi. Bildirim gitmez.", "$tokatla $öp $sarıl $yumrukla $tekmele $okşa $ısır $dürt $gıdıkla $kucakla $beşlik $besle"],
  "Bilgi": ["Merakın bedava.", "$bilgi $seri $top $ts $tsv $tsk $tsy $kalan $profil $premium $oy $yenilikler $görselöner $yardım"],
  "Yönetim": ["Sunucu sahibinin oyuncakları.", "$dil $ayarlar $önek $çekimayarı $evlilikayarı $süreayarı $nadirlik $rozetdeğeri $kuledeğeri $beğenisırası $zorlaboşan $kakeraekle $kakerasil $oyunkanalı $sohbet $baskın"],
  "Koruma": ["Yetkililer için. Sen uslu dur.", "$log $tagban $tagrol $mute $unmute $warn $uyarılar $uyarısil $sesban $sayaç $otorol $doğumgünü $temizle $otomod $capskoruma $partner $yetkili $ysıralama"],
};

renderTabs($("cmd-tabs"), Object.keys(COMMANDS), (group) => {
  const [note, list] = COMMANDS[group];
  $("cmd-note").textContent = note;
  $("cmd-list").replaceChildren(...list.split(" ").map((c) => el("code", "", c)));
});

updateCalc();
