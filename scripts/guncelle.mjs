// Kayyum Sayacı otomatik güncelleyici.
//
// 1. Google News RSS'ten son günlerin "kayyum" haberlerini çeker.
// 2. Daha önce görülmemiş haber yoksa hiçbir şey yapmaz (API çağrısı da yok).
// 3. ANTHROPIC_API_KEY varsa: Claude haberleri web aramasıyla doğrular, kayyum
//    atanan kurumları çıkarır ve data/kayyumlar.json dosyasına ekler.
//    Anahtar yoksa: yeni başlıkları yeni-haberler.md dosyasına yazar
//    (workflow bunu GitHub issue olarak açar, elle eklersin).
//
// Kullanım: node guncelle.mjs [--dry-run] [--rss dosya.xml]
// Test: TEST_YANIT=yanit.json ANTHROPIC_API_KEY=x node guncelle.mjs --dry-run --rss ornek.xml

import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERI = path.join(KOK, "data", "kayyumlar.json");
const GORULEN = path.join(KOK, "data", "gorulen-haberler.json");
const RAPOR = path.join(KOK, "yeni-haberler.md");

const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry-run");
const RSS_DOSYA = ARGS.includes("--rss") ? ARGS[ARGS.indexOf("--rss") + 1] : null;

const SORGULAR = ["kayyum atandı", "kayyum atanmasına", "TMSF kayyum"];
const KATEGORILER = ["Holding & Finans", "Banka & Finans", "Medya", "Belediye", "Eğitim", "Spor", "Diğer"];
const MAKS_KURUM_PER_CALISMA = 40; // emniyet sınırı

const istanbulTarih = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
const bugun = istanbulTarih(new Date());

const normal = (s) =>
  s.toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/(^| )(a ş|aş)$/u, "")
    .trim();

const varlikCoz = (s) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function rssCoz(xml) {
  const ogeler = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const al = (tag) => {
      const r = m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return r ? varlikCoz(r[1]) : "";
    };
    const tarih = new Date(al("pubDate"));
    ogeler.push({
      baslik: al("title"),
      link: al("link"),
      kaynak: al("source"),
      tarih: isNaN(tarih) ? bugun : istanbulTarih(tarih),
    });
  }
  return ogeler;
}

async function haberleriGetir() {
  if (RSS_DOSYA) return rssCoz(await readFile(RSS_DOSYA, "utf8"));
  const hepsi = [];
  for (const q of SORGULAR) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:2d")}&hl=tr&gl=TR&ceid=TR:tr`;
    const r = await fetch(url, { headers: { "User-Agent": "kayyum-sayaci-bot/1.0" } });
    if (!r.ok) { console.warn(`RSS alınamadı (${r.status}): ${q}`); continue; }
    hepsi.push(...rssCoz(await r.text()));
  }
  const tekil = new Map();
  for (const h of hepsi) if (h.link && !tekil.has(h.link)) tekil.set(h.link, h);
  return [...tekil.values()];
}

const jsonOku = async (p, varsayilan) => {
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return varsayilan; }
};

function jsonCikar(metin) {
  const blok = metin.match(/```(?:json)?\s*([\s\S]*?)```/);
  const ham = blok ? blok[1] : metin.slice(metin.indexOf("{"), metin.lastIndexOf("}") + 1);
  return JSON.parse(ham);
}

async function claudeIleAyikla(haberler, mevcutKurumlar) {
  const client = new Anthropic();
  const prompt = `Sen "Kayyum Sayacı" adlı bir sitenin veri editörüsün. Site, Türkiye'de kayyum atanan şirket ve kurumları sayıyor. Aşağıda son günlerde Google News'te çıkan "kayyum" başlıkları var.

Görevin: Bu haberlerden, Türkiye'de bir kuruma YENİ kayyum atandığını bildirenleri bul ve kayyum atanan kurumların adlarını çıkar.

Kurallar:
- Sadece kayyum atamasının gerçekleştiği haberleri al. "Kayyum talebi", "kayyum atanabilir", "kayyum kaldırıldı", "kayyum süresi uzatıldı", yorum ve köşe yazılarını alma.
- Başlıkta kurum adları yazmıyorsa (ör. "5 şirkete kayyum atandı") web aramasıyla haberin ayrıntısını bul ve adları oradan al. Adları bulamazsan o haberi atla; asla tahmin etme.
- Kurum adlarını haberde geçtiği gibi, resmi ünvanıyla yaz (ör. "Adil Katılım Bankası A.Ş.").
- Zaten kayıtlı olan şu kurumları tekrar ekleme: ${JSON.stringify(mevcutKurumlar)}
- Aynı atamayı anlatan birden çok haberi tek olayda birleştir.
- "kaynak" alanı, aşağıdaki listeden ya da web aramasında bulduğun güvenilir bir haber sitesinden gerçek bir URL olmalı.
- "kategori" şunlardan biri olmalı: ${KATEGORILER.join(", ")}.
- "baslik" kısa, tarafsız bir haber başlığı olsun (ör. "Fon soruşturmasında 4 şirkete kayyum atandı").
- "tarih" atamanın yapıldığı gün, YYYY-AA-GG biçiminde. Bugün: ${bugun}.

Haberler:
${haberler.map((h, i) => `${i + 1}. [${h.tarih}] ${h.baslik} (${h.kaynak}) ${h.link}`).join("\n")}

Yanıtını SADECE şu biçimde bir JSON olarak ver, başka açıklama yazma:
{"olaylar":[{"tarih":"YYYY-AA-GG","baslik":"...","kategori":"...","kaynak":"https://...","kurumlar":["..."]}]}
Yeni atama yoksa {"olaylar":[]} döndür.`;

  const params = {
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
    messages: [{ role: "user", content: prompt }],
  };

  let yanit;
  for (let tur = 0; tur < 5; tur++) {
    yanit = await client.beta.messages.create(params);
    if (yanit.stop_reason !== "pause_turn") break;
    params.messages = [params.messages[0], { role: "assistant", content: yanit.content }];
  }
  if (yanit.stop_reason === "refusal") throw new Error("Claude isteği reddetti: " + JSON.stringify(yanit.stop_details));
  if (yanit.stop_reason !== "end_turn") throw new Error("Beklenmeyen stop_reason: " + yanit.stop_reason);

  const metin = yanit.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return jsonCikar(metin).olaylar ?? [];
}

function dogrula(olaylar, mevcut) {
  const gorulenAd = new Set(mevcut.map(normal));
  const temiz = [];
  let toplam = 0;
  for (const o of olaylar) {
    if (!o || typeof o !== "object") continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.tarih ?? "")) continue;
    const gunFarki = (Date.parse(bugun) - Date.parse(o.tarih)) / 86400000;
    if (gunFarki < -1 || gunFarki > 7) continue; // sadece yakın tarihli olaylar
    if (!/^https?:\/\//.test(o.kaynak ?? "")) continue;
    if (typeof o.baslik !== "string" || !o.baslik.trim()) continue;
    const kurumlar = (Array.isArray(o.kurumlar) ? o.kurumlar : [])
      .filter((k) => typeof k === "string" && k.trim().length > 1 && k.length < 120)
      .map((k) => k.trim())
      .filter((k) => !gorulenAd.has(normal(k)) && gorulenAd.add(normal(k)));
    if (!kurumlar.length) continue;
    if (toplam + kurumlar.length > MAKS_KURUM_PER_CALISMA) break;
    toplam += kurumlar.length;
    temiz.push({
      id: `${o.tarih}-${normal(o.baslik).replace(/ /g, "-").slice(0, 50)}`,
      tarih: o.tarih,
      baslik: o.baslik.trim(),
      kategori: KATEGORILER.includes(o.kategori) ? o.kategori : "Diğer",
      kaynak: o.kaynak,
      kurumlar,
      otomatik: true,
    });
  }
  return temiz;
}

async function main() {
  const veri = await jsonOku(VERI, { olaylar: [] });
  const gorulen = await jsonOku(GORULEN, { linkler: [] });
  const gorulenSet = new Set(gorulen.linkler);

  const haberler = (await haberleriGetir())
    .filter((h) => h.link && /kayyum/i.test(h.baslik) && !gorulenSet.has(h.link))
    .sort((a, b) => b.tarih.localeCompare(a.tarih));
  console.log(`Yeni haber: ${haberler.length}`);
  if (!haberler.length) return;

  const mevcutKurumlar = veri.olaylar.flatMap((o) => o.kurumlar);

  if (!process.env.ANTHROPIC_API_KEY) {
    const md = `Otomatik tarama ${haberler.length} yeni "kayyum" haberi buldu. Kayyum ataması olanları \`data/kayyumlar.json\` dosyasına ekle.\n\n` +
      haberler.slice(0, 60).map((h) => `- [ ] **${h.tarih}** · ${h.baslik} — [${h.kaynak || "haber"}](${h.link})`).join("\n") +
      (haberler.length > 60 ? `\n\n…ve ${haberler.length - 60} haber daha.` : "");
    if (!DRY) await writeFile(RAPOR, md + "\n");
    console.log(md);
  } else {
    const ham = process.env.TEST_YANIT // test için: Claude yerine hazır JSON yanıtı
      ? JSON.parse(await readFile(process.env.TEST_YANIT, "utf8")).olaylar
      : await claudeIleAyikla(haberler.slice(0, 120), mevcutKurumlar);
    const yeni = dogrula(ham, mevcutKurumlar);
    console.log(`Eklenecek olay: ${yeni.length}`);
    for (const o of yeni) console.log(`  + ${o.tarih} ${o.baslik}: ${o.kurumlar.join(", ")}`);
    if (yeni.length && !DRY) {
      veri.olaylar.push(...yeni);
      veri.guncelleme = bugun;
      await writeFile(VERI, JSON.stringify(veri, null, 2) + "\n");
    }
  }

  if (!DRY) {
    gorulen.linkler = [...gorulen.linkler, ...haberler.map((h) => h.link)].slice(-1000);
    await writeFile(GORULEN, JSON.stringify(gorulen, null, 2) + "\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
