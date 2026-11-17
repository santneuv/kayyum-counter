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
