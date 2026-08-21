# Kalora 🥑 — AI Kalori & Beslenme Takibi

Fotoğrafını çek, AI kalori ve makroları saysın. Streak'ler, XP, koç sohbeti ve 15 dil desteğiyle
alışkanlık kuran bir beslenme asistanı.

## Özellikler

- 📸 Fotoğraftan AI yemek tanıma (OpenAI GPT-4o Vision + anahtarsız demo motoru)
- 🧠 Veriye dayalı AI koç sohbeti — kalan makrolara göre yemek önerir, tek tıkla günlüğe ekler
- 🔥 Streak + XP/seviye sistemi, 10 başarım, konfeti kutlamalar
- 💧 Su & ⚖️ kilo takibi, haftalık/aylık grafikler, yıldızlı haftalık rapor
- 👑 Pro abonelik kapısı ($9.99/ay)
- 🌍 15 dil (Arapça/Urduca RTL dahil), koyu/açık tema, kg/lb
- 📱 PWA — ana ekrana eklenebilir

## Kurulum

```bash
npm install
cp .env.example .env          # DATABASE_URL yerel kurulumda hazır
npx drizzle-kit push          # tabloları oluştur
npm run dev
```

### Gerçek AI taramasını açmak

`.env` dosyasına `OPENAI_API_KEY` ekleyin. Key varsa yemek fotoğrafları GPT-4o-mini ile
gerçekten analiz edilir (sonuç ekranında "GPT-4o" rozeti görünür); key yoksa veya istek
başarısız olursa uygulama otomatik olarak yerleşik demo motoruna düşer — hiçbir zaman kırılmaz.

## Production'a çıkarken yapılacaklar (yol haritası)

| Alan | Gereken | Not |
|---|---|---|
| 🔐 Kimlik | NextAuth.js veya Clerk | Tablolara `user_id` kolonu; şu anki tek profilli yapı multi-user'a çevrilmeli |
| 💳 Ödeme | Stripe Subscriptions | $9.99/ay Pro; webhook ile `profile.pro` güncellenir |
| 🗄️ Veritabanı | Neon / Supabase / RDS | Local Postgres yerine managed servis + yedekleme |
| 🖼️ Depolama | Cloudflare R2 / S3 / Cloudinary | Fotoğraflar data-URL yerine object storage'a |
| 🍎 Besin DB | USDA FoodData Central / Open Food Facts | Barkod okuma ve daha geniş arama için |
| 🔔 Bildirim | OneSignal / FCM | Öğün hatırlatmaları |
| 📈 Analitik | PostHog + Sentry | retention & crash takibi |
| 🚀 Deploy | Vercel | `vercel env add` ile key'leri tanımla |
| 📲 Mağazalar | Capacitor (PWA'yı sarar) veya React Native | App Store sağlık uygulaması şartları: tıbbi tavsiye değildir uyarısı |
| ⚖️ Hukuk | KVKK/GDPR aydınlatma, kullanım şartları | Veri silme hakkı zaten "Reset" ile mevcut |

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run build` — production build
- `npx drizzle-kit push` — şema senkronu
