# Handoff: OLIMFOOD — Bosh sahifa (Main page)

> Til eslatma: bu hujjat o'zbekcha + ba'zi texnik atamalar inglizcha. Claude Code'ga shu papkani to'liq bering.

## Overview
OLIMFOOD — ovqat yetkazib berish mobil ilovasi. Bu paket **bosh sahifa (home/main page)** dizaynini qamraydi: header, qidiruv, promo-banner, kategoriyalar va mahsulot ro'yxati, hamda suzib turuvchi pastki navigatsiya. Vizual uslub — **premium + "liquid glass" (frosted glass)**, qizil brend rangi, Light va Dark tema.

Paketda mahsulot **detal sahifasi** ham bor (bonus sifatida bitta HTML faylda), lekin asosiy topshiriq — bosh sahifa.

## About the Design Files
Bu papkadagi `.dc.html` fayl — **HTML'da yasalgan dizayn referensi** (ko'rinish va xatti-harakatni ko'rsatuvchi prototip), to'g'ridan-to'g'ri ko'chiriladigan production kod EMAS. Vazifa: ushbu dizaynni loyihaning mavjud muhitida (React/Vue/SwiftUI/React Native va h.k.) o'sha kodbazaning patternlari va kutubxonalari bilan **qaytadan qurish**. Agar muhit hali yo'q bo'lsa — loyihaga eng mos framework'ni tanlab (tavsiya: **React + Vite + Tailwind CSS**), shu dizaynni amalga oshiring.

> `OLIMFOOD.dc.html` "Design Component" formatida (ichida streaming runtime bor). Uni **nusxalamang** — faqat ko'rinish, o'lcham va ranglarni o'qish uchun referens sifatida ishlating. Logikani README bo'yicha qayta yozing.

## Fidelity
**High-fidelity (hifi).** Ranglar, shrift, oraliq va o'lchamlar yakuniy. UI'ni piksel-aniqlikda qayta yarating.

---

## Design Tokens

### Ranglar — Light tema
| Token | Hex / value |
|---|---|
| Qizil (brand) | `#E5232B` |
| Fon (page bg) | `#F5F2EF` |
| Karta/surface | `#FFFFFF` |
| Matn (fg) | `#1A1513` |
| Kulrang matn (muted) | `#8B827B` |
| Chiziq (line) | `rgba(20,16,14,0.07)` |
| Placeholder chiziqlari | `#ECE8E3` / `#F5F2EE` |
| Reyting yulduzi | `#F5A623` |

### Ranglar — Dark tema
| Token | Hex / value |
|---|---|
| Qizil (brand) | `#FF4148` |
| Fon (page bg) | `#141110` |
| Karta/surface | `#1E1A18` |
| Matn (fg) | `#F4EFEC` |
| Kulrang matn (muted) | `#9C928B` |
| Chiziq (line) | `rgba(255,255,255,0.09)` |
| Placeholder chiziqlari | `#221E1C` / `#2A2624` |

### Liquid glass tokenlari
| Token | Light | Dark |
|---|---|---|
| `--glass` (header) | `rgba(255,255,255,0.52)` | `rgba(32,28,26,0.46)` |
| `--glass-strong` (kartalar) | `rgba(255,255,255,0.72)` | `rgba(42,38,36,0.62)` |
| `--glass-bd` (border) | `rgba(255,255,255,0.66)` | `rgba(255,255,255,0.13)` |

- **Frosted blur**: `backdrop-filter: blur(22px) saturate(180%)` (header/nav uchun 22–26px, kichik elementlar uchun 12–18px). `-webkit-backdrop-filter` ham qo'shing.
- **Ambient nurlar** (orqa fonda, shisha shuni sindiradi): 3 ta katta blurlangan radial doira:
  - A — yuqori-o'ng, qizil: light `rgba(255,70,60,0.20)`, dark `rgba(255,70,60,0.26)` — ~300px.
  - B — chap-o'rta, amber: light `rgba(255,165,60,0.16)`, dark `rgba(255,150,50,0.17)` — ~260px.
  - C — past-o'ng, issiq qizil: light `rgba(255,90,70,0.13)`, dark `rgba(255,80,60,0.18)` — ~240px.
  - Har biri `radial-gradient(circle, <rang>, transparent 68-70%)`, ekran konteyneri ichida `position:absolute`, `z-index:0`, `pointer-events:none`. Kontent ulardan ustda (`z-index:1`).

### Shriftlar (Google Fonts)
- **Sora** — sarlavhalar, narx, logo. Weights: 600, 700, 800.
- **Manrope** — matn, tugma, yorliq. Weights: 400, 500, 600, 700, 800.
- **Space Mono** — promokod va "RASM" placeholder yozuvlari.

### Radius / Soya
- Ekran konteyneri radius: `40px`. Kartalar: `22px`. Qidiruv: `18px`. Kichik tugma/badge: `12–16px`. Pill/dumaloq: `999px`.
- Asosiy soya (shadow): light `0 10px 30px rgba(30,20,15,0.10)`, dark `0 10px 34px rgba(0,0,0,0.55)`.
- Floating nav soyasi: `0 14px 38px -10px rgba(0,0,0,0.30)`.

### Spacing
Asosiy gorizontal padding: **20px**. Elementlar orasidagi vertikal oraliqlar 8–14px. Kategoriya/karta gap: 14px.

---

## Screen: Bosh sahifa (Home)

**Maqsad:** foydalanuvchi taom qidiradi, kategoriya tanlaydi, mahsulotni ko'radi va savatga qo'shadi.

**Konteyner:** kenglik `390px`, balandlik to'liq ekran (prototipi 824px), `border-radius:40px`, `overflow:hidden`, fon = tema bg, yumshoq soya. **Telefon ramkasi / status bar YO'Q.** Yuqorida ~14px bo'sh joy.

Tepada 3 ta ambient nur (yuqoriga qarang), ustida scroll qilinadigan kontent.

### Komponentlar (yuqoridan pastga)

1. **Sticky glass header** (`position:sticky; top:0`)
   - Fon: `--glass` + `backdrop-filter:blur(22px) saturate(180%)`, pastida `1px solid --glass-bd` chiziq.
   - Padding: `16px 20px 13px`.
   - Chapda: logo — "OLIM" (qizil) + "FOOD" (fg), Sora 800, 26px, `letter-spacing:-0.01em`.
   - O'ngda: savatcha tugmasi — 46×46, radius 16, glass (`--glass-strong` + blur 14px, border `--glass-bd`), ichida savat SVG (stroke). O'ng-yuqorida qizil badge: son (masalan "2"), 19px dumaloq, oq matn, `2px solid` surface border.

2. **Qidiruv (search)** — header ostida, scroll bilan harakatlanadi.
   - Glass: `--glass-strong` + blur 18px + border `--glass-bd`, radius 18, padding `14px 16px`.
   - Chapda lupa SVG (muted stroke). Input: placeholder "Mahsulot qidirish...", Manrope 500 15px.
   - **Xatti-harakat:** yozilganda mahsulot nomi bo'yicha filtrlaydi (case-insensitive `includes`).

3. **Promo-banner**
   - Radius 24, padding `26px 24px`, fon: `radial-gradient(120% 140% at 100% 30%, #ff2d20 0%, #8e1018 38%, #2c0507 100%)`.
   - Ichida o'ng-pastda yumshoq nur doira (`rgba(255,120,60,.55) → transparent`).
   - "MAXSUS TAKLIF" pill — `rgba(255,255,255,.16)` + blur, oq, Manrope 800 10px, `letter-spacing:.08em`.
   - Sarlavha "30% CHEGIRMA" — Sora 800, 34px, oq.
   - Sub: "Birinchi buyurtmada · OLIMFOOD30" (kod Space Mono'da), `rgba(255,255,255,.78)`.
   - Tugma "Hozir buyurtma bering →" — oq fon, `#171010` matn, radius 14, Manrope 700 13px.
   - Banner ostida 4 ta dot; faol bo'lgani cho'zilgan qizil (22px), qolganlari 7px. **Auto-aylanadi: har 3.2s da keyingisi.**

4. **Kategoriyalar**
   - "KATEGORIYALAR" yorlig'i — Manrope 800 12px, `letter-spacing:.12em`, muted.
   - Gorizontal scroll qatori (gap 14px, padding `0 20px`). Har bir element: 64px ustun.
   - Katak: 56×56, radius 18, **glass** (`--glass-strong` + blur 12px). Faol bo'lganda `0 0 0 2.5px` qizil halqa; nofaol — `inset 0 0 0 1px --glass-bd`.
   - Katak ichida **rasm** (kategoriya ikonkasi) — **admin paneldan keladigan image URL**. Hozir prototipda drag-drop placeholder ishlatilgan. Production'da `<img>` (object-fit:cover) qiling, manbasi backend'dan.
   - Nom: faol — qizil Manrope 700 12px; nofaol — muted 500 12px.
   - Ro'yxat (id / nom): `all`/Barchasi, `kolbasa`/Kolbasa, `fastfood`/Fastfood, `burger`/Burger, `pizza`/Pizza, `sushi`/Sushi, `salat`/Salat.
   - **Xatti-harakat:** kategoriya bosilganda mahsulotlar shu kategoriya bo'yicha filtrlanadi (`all` = hammasi).

5. **Mahsulotlar bo'limi**
   - Sarlavha qatori: "Mashhur taomlar" (Sora 700 19px) | o'ngda "Barchasi" (qizil Manrope 600 13px).
   - Grid: 2 ustun, gap 14px.
   - **Bo'sh holat:** filtr natija bermasa "Hech narsa topilmadi" (muted, markazda).

   #### Mahsulot kartasi (batafsil)
   Karta = bosiladigan konteyner (butun karta `onClick` → detal ochiladi). Tepada kvadrat rasm, ustida 3 ta absolyut badge/tugma, pastda matn bloki.

   | Element | Spetsifikatsiya |
   |---|---|
   | Konteyner | fon `--surface`, `1px solid --line`, radius **22**, soya `--shadow`, `overflow:hidden`, `cursor:pointer` |
   | Rasm joyi | `aspect-ratio:1/1`, **admin paneldan image URL** (`<img>` object-fit:cover). Prototipda chiziqli placeholder + "RASM" yozuvi (Space Mono) |
   | Chegirma badge | chap-yuqori (`top/left:10px`), qizil fon, oq matn, Manrope 800 11px, pill (`radius:999px`), padding `5px 9px`. **Faqat `discount` bo'lsa.** Masalan `-15%` |
   | "★ Mashhur" badge | o'ng-yuqori (`top/right:10px`), fon `rgba(20,16,14,.72)` + `backdrop-filter:blur(4px)`, oq, Manrope 700 10px, pill. **Faqat `popular` bo'lsa.** |
   | Like tugma | chap-past (`bottom/left:10px`), 32px dumaloq, fon `rgba(255,255,255,.85)` + blur(6px). Ichida yurak SVG. **Toggle:** bosilganda `fill`+`stroke` = qizil; aks holda `fill:none`, `stroke:--muted`. `e.stopPropagation()` (karta ochilmasligi uchun). |
   | Matn bloki | padding `13px 13px 15px` |
   | — Nom | Manrope 700 14px, `line-height:1.25`, `min-height:35px` (2 qatorga joy, kartalar tengligi uchun) |
   | — Reyting | ★ `#F5A623` 12px + raqam (Manrope 600 12px, `--muted`), `margin:6px 0 11px` |
   | — Narx + tugma | bir qatorda `space-between`. Narx: Sora 800 15px `--fg` + " so'm" (Manrope 600 11px `--muted`). "+" tugma: 34px, radius 12, qizil fon, oq "+". |
   | "+" xatti-harakat | shu mahsulotni savatga 1 dona qo'shadi (`e.stopPropagation()`), "✓ Savatga qo'shildi" toast chiqaradi, header badge soni oshadi |

6. **Floating glass navigatsiya** (`position:absolute; left/right:14px; bottom:16px`)
   - Radius 28, **glass** (`--glass-strong` + blur 26px + border `--glass-bd`), floating soya.
   - 4 ta element (chiziqli SVG ikon + yozuv, Manrope 11px): **Asosiy** (faol — qizil), **Qidirish**, **Buyurtmalar**, **Profil** (nofaol — muted).
   - Ikonlar: uy (home), lupa (search), quti (box), odam (person) — barchasi sodda stroke SVG, emoji emas.

### Namuna mahsulot ma'lumotlari (test uchun)
```
Tovuqli Lavash — 32 000 — ★4.8 — fastfood — chegirma -15%
Double Cheeseburger — 39 000 — ★4.9 — burger — mashhur
Pepperoni Pitsa — 65 000 — ★4.7 — pizza
Filadelfiya Set — 78 000 — ★4.9 — sushi — mashhur
Free Fri Katta — 18 000 — ★4.5 — fastfood — chegirma -10%
Hot-Dog Klassik — 24 000 — ★4.6 — kolbasa
```
Narx formati: 3 xonadan bo'sh joy bilan ("32 000").

---

## Screen: Mahsulot detali
Kartani bosganda ochiladi. Tepada katta rasm (admin'dan) + glass back/like tugmalar + chegirma badge; pastdan ko'tarilgan varaq: kategoriya nomi (qizil), nom (Sora 800 25px), reyting glass-pill; tavsif; "Hajmini tanlang" (Kichik/O'rta/Katta segment); "Miqdori" (− / son / + glass stepper); pastda yopishqoq glass panel: "Jami narx" + qizil "Savatga qo'shish" tugma (savat SVG bilan). Total = narx × miqdor. "Savatga qo'shish" bosilganda shu mahsulot (tanlangan miqdorda) savatga qo'shiladi + toast.

---

## Screen: Savatcha (Cart)
Header'dagi savatcha tugmasi bosilganda ochiladi (`screen='cart'`).

### Header (glass)
Chapda glass back tugma (42px, radius 14, chap-strelka SVG) → bosh sahifaga qaytaradi. "Savatcha" (Sora 800 20px). O'ngda jami dona soni ("{N} ta", Manrope 600 13px `--muted`).

### Mahsulot qatori (har bir savat elementi uchun)
Gorizontal karta: fon `--surface`, `1px solid --line`, radius **20**, soya, padding 11px, gap 13px.
- **Chapda rasm:** 74×74, radius 15, admin'dan image URL (prototipda placeholder).
- **O'ngda matn (flex column):**
  - Tepa qatori: chapda kategoriya nomi (qizil Manrope 600 11px) + mahsulot nomi (Manrope 700 14px); o'ngda **o'chirish** tugma (28px, savat/trash SVG, `--muted`) → qatorni savatdan olib tashlaydi.
  - Past qatori (`space-between`): chapda qator summasi (narx×miqdor, Sora 800 15px + " so'm" muted); o'ngda **glass stepper** (− / son / +, radius 13). − minimum 1 gacha; + cheksiz.

### Promokod
Dashed-border glass qatori: chapda promo SVG (qizil), input "Promokod kiriting", o'ngda "Qo'llash" (qizil Manrope 700 13px). (Prototipda vizual; mantiq backend'da.)

### Checkout paneli (pastda yopishqoq, glass)
- "Mahsulotlar" — subtotal (barcha qatorlar summasi).
- "Yetkazib berish" — fiks **12 000** so'm (savat bo'sh bo'lsa 0).
- Ajratuvchi chiziq ostida "Jami" — subtotal + yetkazib berish (Sora 800 21px).
- Qizil **"Rasmiylashtirish"** tugma (o'ng-strelka SVG) → "✓ Buyurtma qabul qilindi" toast (production'da checkout oqimiga ulang).

### Bo'sh holat
Savat bo'shaganda: markazda glass savat ikonkasi (88px katak), "Savatcha bo'sh" (Sora 700 17px), izoh matni, qizil "Menyuga o'tish" tugma → bosh sahifa.

### Cart hisob mantiqi
```
subtotal  = Σ (mahsulot.price × qator.qty)
delivery  = subtotal > 0 ? 12000 : 0
grand     = subtotal + delivery
cartCount = Σ qator.qty   // header badge
```
Header badge va savatcha sarlavhasidagi son = barcha qatorlar qty yig'indisi (mahsulot turlari soni emas).

---

## Interactions & Behavior
- **Tema almashish:** Light ↔ Dark, barcha ranglar va glass tokenlari moslashadi. (Prototipda yuqorida segment; production'da kerakli joyga qo'ying.)
- **Navigatsiya:** mahsulot kartasi → detal; detalda back → bosh sahifa.
- **Like:** yurak toggle (mahsulot bo'yicha), qizilga to'ladi.
- **Savatga qo'shish:** "+" yoki detaldagi tugma → savatcha soni oshadi + pastda "✓ Savatga qo'shildi" **toast** (qora glass pill, ~1.7s).
- **Banner dots:** har 3.2s avtomatik aylanadi.
- **Qidiruv + kategoriya:** birga filtrlaydi.
- Transition'lar: rang/box-shadow uchun ~0.15–0.3s ease.

## State Management
- `theme`: 'light' | 'dark'
- `screen`: 'home' | 'detail' | **'cart'**
- `selectedId`: tanlangan mahsulot (detal uchun)
- `query`: qidiruv matni
- `activeCategory`: tanlangan kategoriya id
- `liked`: yoqtirilgan mahsulotlar ro'yxati (id massivi)
- **`cartItems`**: `[{ id, qty }]` — savatdagi mahsulotlar. `cartCount` shundan hisoblanadi (Σ qty).
- `bannerIndex`: 0–3 (auto, har 3.2s)
- `qty`, `size`: detal sahifasi uchun
- `toast`: ko'rinayotgan toast matni

### Cart amallari
- `addToCart(id, n)` — bor bo'lsa qty oshadi, yo'q bo'lsa yangi qator. (Karta "+", detaldagi "Savatga qo'shish" shuni chaqiradi.)
- `cartInc(id)` / `cartDec(id)` (min 1) / `cartRemove(id)`
- `checkout()` — buyurtmani yakunlaydi (toast; production'da to'lov/checkout oqimi).

## Assets
- **Kategoriya ikonkalari** va **mahsulot rasmlari** — **admin paneldan boshqariladigan image URL'lar**. Backend'da har kategoriya/mahsulot uchun rasm maydoni bo'lsin; frontend `<img>` orqali ko'rsatadi. Prototipda rasm yo'q joyda placeholder turadi.
- Boshqa barcha ikonlar (savat, lupa, yurak, navigatsiya, back) — inline stroke SVG, paketdagi HTML'dan oling. **Emoji ishlatmang.**
- Shriftlar — Google Fonts (Sora, Manrope, Space Mono).

## Files
- `OLIMFOOD.dc.html` — to'liq dizayn referensi (bosh sahifa + mahsulot detali + savatcha, Light/Dark, liquid glass). Ko'rinish/o'lcham/rang manbai.
- `image-slot.js` — prototipdagi drag-drop rasm placeholder komponenti (faqat referens; production'da kerak emas — oddiy `<img>` ishlating).
