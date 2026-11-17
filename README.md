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

Güncelleme iki parçalı ve elle bir şey yapmak gerekmiyor:

1. **GitHub Action** (`.github/workflows/guncelle.yml`, 6 saatte bir): Google News'ten son 2 günün "kayyum" haberlerini çeker. Daha önce görülen haberler `data/gorulen-haberler.json` dosyasında tutulur. Sitede zaten kayıtlı kurumları anmayan yeni başlıklar `data/aday-haberler.json` dosyasına yazılır.
2. **Claude zamanlanmış görevi** (her akşam): aday haberleri okur, web aramasıyla doğrular, kayyum atanan kurumları `data/kayyumlar.json` dosyasına `"otomatik": true` işaretiyle ekler, aday listesini boşaltır ve push eder. Site kendiliğinden yeniden yayınlanır.

İstersen 2. adım yerine repoya `ANTHROPIC_API_KEY` secret'ı ekleyebilirsin: bu durumda GitHub Action haberleri Claude API ile kendisi ayıklayıp doğrudan ekler.

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
