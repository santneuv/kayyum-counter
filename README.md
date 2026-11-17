# 🔏 Kayyum Sayacı

Türkiye'nin en hızlı büyüyen sektörünü canlı takip eden mizah sitesi.

- **Kayyumsuz geçen gün** panosu (iş güvenliği panosu tadında)
- Toplam / bugün atanan sayaçları, en uzun kayyumsuz seri
- Sektörel dağılım, aranabilir sicil kaydı
- %100 bilimsel "Sıradaki kim?" tahmin motoru
- 𝕏 / WhatsApp paylaşımı

Tamamen statik: HTML + CSS + JS, derleme adımı yok.

## Yeni kayyum ekleme

Tek yapman gereken `data/kayyumlar.json` dosyasına yeni bir olay eklemek:

```json
{
  "id": "2026-11-18-ornek",
  "tarih": "2026-11-18",
  "baslik": "Haberin başlığı",
  "kategori": "Holding & Finans",
  "kaynak": "https://haber-sitesi.com/haber-linki",
  "kurumlar": ["Şirket A", "Şirket B"]
}
```

- `tarih` bilinmiyorsa `null` yaz ve `"tarihEtiketi": "Son bir yıl içinde"` gibi bir etiket ekle.
- `kaynak` varsa başlık o habere link olur.
- Sayaçlar, pano ve kategoriler otomatik hesaplanır.

Ziyaretçiler GitHub'da **Issues → Yeni kayyum bildir** formunu kullanarak öneri gönderebilir.

## Otomatik güncelleme

`.github/workflows/guncelle.yml` 3 saatte bir GitHub sunucularında çalışır (Actions sekmesinden **Run workflow** ile elle de çalıştırılabilir):

1. Google News'ten son 2 günün "kayyum" haberlerini çeker. Daha önce görülmüş haberler `data/gorulen-haberler.json` dosyasında tutulur; yeni haber yoksa hiçbir şey yapmaz.
2. **`ANTHROPIC_API_KEY` secret'ı varsa:** Claude haberleri web aramasıyla doğrular, kayyum atanan kurumları çıkarır ve `data/kayyumlar.json` dosyasına ekler (`"otomatik": true` işaretiyle). Commit atılır, site kendiliğinden yeniden yayınlanır.
3. **Anahtar yoksa:** yeni başlıkları bir GitHub issue olarak açar, sen elle eklersin.

Anahtarı eklemek için: Repo → **Settings → Secrets and variables → Actions → New repository secret** → Ad: `ANTHROPIC_API_KEY`, değer: [console.anthropic.com](https://console.anthropic.com) üzerinden aldığın API anahtarı.

Kod tarafındaki emniyet kontrolleri: her kayıtta haber linki zorunlu, sadece son 7 günün olayları, kayıtlı kurumlar tekrar eklenmez, bir çalışmada en fazla 40 kurum. Yanlış bir otomatik kayıt olursa ilgili commit'i geri al (`git revert`) ya da JSON'dan sil.

Yerelde deneme (dosyaya yazmaz):

```bash
cd scripts && npm ci && node guncelle.mjs --dry-run
```

## Yayınlama (Vercel)

1. [vercel.com/new](https://vercel.com/new) → GitHub ile giriş yap → `santneuv/kayyum-counter` reposunu **Import** et.
2. Framework Preset: **Other** · Build Command: boş · Output Directory: boş (kök dizin).
3. **Deploy**. Site `kayyum-counter.vercel.app` gibi bir adreste yayında olur.

Bundan sonra `main` dalına yapılan her push (ör. `data/kayyumlar.json` güncellemesi) otomatik olarak yeniden yayınlanır.

## Yayınlama (GitHub Pages)

Repo → **Settings → Pages → Build and deployment** → Source: *Deploy from a branch* → Branch: `main` / `/ (root)` → Save.
Birkaç dakika sonra site `https://santneuv.github.io/kayyum-counter/` adresinde yayında olur.

## Yerelde çalıştırma

`fetch` kullandığı için dosyayı çift tıklayıp açmak yerine küçük bir sunucu başlat:

```bash
python3 -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç.

---

*Bu bir mizah sitesidir. Veriler kamuya açık haberlerden derlenmiştir.*
