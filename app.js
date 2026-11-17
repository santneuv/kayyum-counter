(() => {
  const TZ = "Europe/Istanbul";
  const $ = (id) => document.getElementById(id);

  const SLOGANLAR = [
    "Türkiye'nin en hızlı büyüyen sektörü: kayyumluk.",
    "Şirketinizi siz kurun, yönetimini biz hallederiz.",
    "Yönetim kurulu toplantısı mı? Gerek kalmadı.",
    "CEO olmanın en kısa yolu: kayyum olmak.",
    "Borsada yükselen tek endeks: Kayyum-100.",
    "Girişimcilik ekosistemine yeni bir boyut: el koyma.",
    "Bugün atanmadıysa takvime bakın, muhtemelen pazar.",
    "Yatırım tavsiyesi değildir. Kayyum tavsiyesidir.",
  ];

  const TAHMINLER = [
    "Köşedeki simitçi", "Apartman yönetimi", "Mahallenin halı sahası",
    "Annenin altın günü", "Ailenin WhatsApp grubu", "Okul kantini",
    "Senin Spotify çalma listen", "Mahalle kahvesindeki okey masası",
    "Ofisin çay ocağı", "Kedinin mama kabı", "Üniversite mezunlar derneği",
    "Bu site", "Sevgilinin Netflix hesabı", "Dayının balkon domatesleri",
    "Sitenin otoparkı", "Fenerbahçe–Galatasaray derbisi", "Tost makinen",
    "Kurban bayramı tatili", "Belediye otobüsünün klima kumandası",
    "Bu tahmin motoru",
  ];

  const istanbulBugun = () =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

  const gunFarki = (a, b) =>
    Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

  const trTarih = (iso) =>
    new Date(iso + "T12:00:00Z").toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    });

  const escape = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Rakamları ayrı "flip" kartlarına böler
  function flip(el, n, basamak = 2) {
    const s = String(n).padStart(basamak, "0");
    el.setAttribute("aria-label", String(n));
    if (el.children.length !== s.length) {
      el.innerHTML = [...s].map(() => '<span class="d"></span>').join("");
    }
    [...s].forEach((c, i) => { el.children[i].textContent = c; });
  }

  function sayac(el, hedef, sure = 1400, basamak = 2) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const yaz = (n) => (el.classList.contains("flip") ? flip(el, n, Math.max(basamak, String(hedef).length)) : (el.textContent = n));
    if (reduce || hedef === 0) { yaz(hedef); return; }
    const t0 = performance.now();
    const adim = (t) => {
      const p = Math.min(1, (t - t0) / sure);
      yaz(Math.round(hedef * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(adim);
    };
    requestAnimationFrame(adim);
  }

  function slogan() {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % SLOGANLAR.length;
      const el = $("tagline");
      el.style.opacity = 0;
      setTimeout(() => { el.textContent = SLOGANLAR[i]; el.style.opacity = 1; }, 300);
    }, 4500);
  }

  function render(veri) {
    const bugun = istanbulBugun();
    const olaylar = [...veri.olaylar].sort((a, b) => {
      if (!a.tarih) return 1;
      if (!b.tarih) return -1;
      return b.tarih.localeCompare(a.tarih);
    });

    const toplam = olaylar.reduce((n, o) => n + o.kurumlar.length, 0);
    const bugunSayi = olaylar.filter((o) => o.tarih === bugun).reduce((n, o) => n + o.kurumlar.length, 0);

    sayac($("toplam"), toplam);
    if (bugunSayi > 0) {
      $("bugun").textContent = bugunSayi;
      $("bugun-chip").hidden = false;
    }

    // Kayyumsuz geçen gün
    const tarihler = [...new Set(olaylar.map((o) => o.tarih).filter(Boolean))].sort();
    const son = tarihler[tarihler.length - 1];
    const gun = son ? Math.max(0, gunFarki(son, bugun)) : null;
    if (gun === null) $("gun-sayisi").textContent = "?";
    else flip($("gun-sayisi"), gun);
    $("board-sub").textContent =
      gun === null ? "Veri bekleniyor." :
      gun === 0 ? "Seri bugün de bozuldu. Yarın yeniden deneyeceğiz." :
      gun === 1 ? "Dün bozuldu. Umutluyuz ama gerçekçiyiz." :
      gun < 7 ? `Son kayyum: ${trTarih(son)}. Sabırsızlanıyoruz.` :
      `Son kayyum: ${trTarih(son)}. Bu kadar sessizlik hayra alamet değil.`;

    // Rekor seri (en uzun aralık)
    let rekor = 0;
    for (let i = 1; i < tarihler.length; i++) rekor = Math.max(rekor, gunFarki(tarihler[i - 1], tarihler[i]) - 1);
    if (son) rekor = Math.max(rekor, gun);
    flip($("rekor"), rekor);
    $("rekor-label").textContent = rekor === 0 ? "gün · rekor hâlâ bekleniyor" : "gün · kayıtlarımıza göre";

    // Kategoriler
    const kat = {};
    olaylar.forEach((o) => { kat[o.kategori] = (kat[o.kategori] || 0) + o.kurumlar.length; });
    const katList = Object.entries(kat).sort((a, b) => b[1] - a[1]);
    const max = katList.length ? katList[0][1] : 1;
    $("kategoriler").innerHTML = katList.map(([ad, n]) => `
      <div class="cat-row">
        <span class="cat-name">${escape(ad)}</span>
        <span class="cat-bar"><i data-w="${(n / max) * 100}"></i></span>
        <span class="cat-count">${n}</span>
      </div>`).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll(".cat-bar i").forEach((i) => { i.style.width = i.dataset.w + "%"; });
    }));

    // Ticker
    const isimler = olaylar.flatMap((o) => o.kurumlar);
    const parca = isimler.map((k) => `<span>🔏 ${escape(k)}</span>`).join("") +
      `<span>📈 TOPLAM: ${toplam}</span><span>⏳ SIRADAKİ: SEN OLABİLİRSİN</span>`;
    $("ticker").innerHTML = parca + parca;

    // Liste
    const ciz = (q = "") => {
      const s = q.trim().toLocaleLowerCase("tr-TR");
      const html = olaylar.map((o) => {
        const kurumlar = o.kurumlar.filter((k) => !s || k.toLocaleLowerCase("tr-TR").includes(s));
        if (!kurumlar.length) return "";
        const etiket = o.tarih ? trTarih(o.tarih) : (o.tarihEtiketi || "Tarih belirsiz");
        const bugunMu = o.tarih === bugun;
        const baslik = o.kaynak
          ? `<a href="${escape(o.kaynak)}" target="_blank" rel="noopener">${escape(o.baslik)}</a>`
          : escape(o.baslik);
        return `
          <article class="event">
            <div class="event-meta">
              <span class="pill ${bugunMu ? "pill-today" : ""}">${bugunMu ? "BUGÜN" : escape(etiket)}</span>
              <span>${escape(o.kategori)}</span>
              <span>· ${o.kurumlar.length} kurum</span>
            </div>
            <h3>${baslik}</h3>
            <div class="cards">
              ${kurumlar.map((k) => `
                <div class="card">
                  <span class="card-name">${escape(k)}</span>
                  <span class="stamp">KAYYUM<br>ATANDI</span>
                </div>`).join("")}
            </div>
          </article>`;
      }).join("");
      $("olaylar").innerHTML = html || `<p class="empty">Bulunamadı. Şimdilik. ⏳</p>`;
    };
    ciz();
    $("ara").addEventListener("input", (e) => ciz(e.target.value));

  }

  function tahminMotoru() {
    let son = -1;
    $("tahmin-btn").addEventListener("click", () => {
      const btn = $("tahmin-btn");
      const muhur = $("tahmin-muhur");
      btn.disabled = true;
      muhur.hidden = true;
      muhur.classList.remove("slam");
      let tur = 0;
      const iv = setInterval(() => {
        $("tahmin").textContent = TAHMINLER[Math.floor(Math.random() * TAHMINLER.length)];
        if (++tur > 12) {
          clearInterval(iv);
          let i;
          do { i = Math.floor(Math.random() * TAHMINLER.length); } while (i === son);
          son = i;
          $("tahmin").textContent = TAHMINLER[i];
          muhur.hidden = false;
          void muhur.offsetWidth;
          muhur.classList.add("slam");
          btn.disabled = false;
          btn.textContent = "Bir daha";
        }
      }, 70);
    });
  }

  slogan();
  tahminMotoru();
  fetch("data/kayyumlar.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then(render)
    .catch(() => {
      $("board-sub").textContent = "Veri yüklenemedi. Veri dosyasına da kayyum atanmış olabilir.";
    });
})();
