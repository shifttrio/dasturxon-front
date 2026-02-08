# Telefon Raqam Boshqaruvi va Savat Tizimi

## 📱 Tizim Tavsifi

Bu tizim yangi foydalanuvchilardan web saytga kirganda telefon raqami so'rashi va mavjud foydalanuvchilar o'z raqamlarini o'zgartira olishiga ruxsat beradi.

---

## 🎯 Asosiy Xususiyatlar

### 1. **Yangi Foydalanuvchilar**
- Saytga kelganda telefon raqamini so'rashi
- +998 ko'rsatuvchisi bilan Uzbek raqamlari
- 9 raqamli format (90, 91, 93, 94, 98 bilan boshlanadi)

### 2. **Mavjud Foydalanuvchilar**
- O'z raqamlarini ko'rishallari
- Raqamni o'zgartirish imkoniyati
- Eski raqam lokal storage da saqlash

### 3. **Database Integratsiyasi**
- Yangi raqam saqlashda `createdAt` vaqti yoziladi
- Har login da `lastLogin` vaqti yangilanadi
- Raqam o'zgarishida eski raqam `phoneHistory` da saqlanadi

---

## 📁 Fayl Strukturasi

```
deli-fronted/
├── index.html           # Ana sahifa (telefon modal bilan)
├── script.js            # Frontend logic
├── style.css            # CSS stillar (modal dizayn bilan)
├── server.js            # Front-end server (3000 port)
├── server-api.js        # Backend API (8080 port)
└── package.json         # Dependencies
```

---

## 🔧 Qanday Ishlaydi?

### Frontend Flow

```
┌─────────────────────────────────────┐
│ Saytga kirish                       │
└──────────────┬──────────────────────┘
               │
               ▼
      ┌────────────────────┐
      │ localStorage ga    │
      │ telefon bor mi?    │
      └────────┬───────────┘
               │
          Ha / Yo'q
         /          \
        ▼            ▼
    ┌────────┐   ┌──────────┐
    │ Mavjud │   │ Yangi    │
    │ Raqam  │   │ Raqam    │
    │ Modal  │   │ Modal    │
    └───┬────┘   └────┬─────┘
        │             │
        ├─ Ha ────┐   │
        │ Raqam   │   │
        │ shu     │   │
        │ raqamman│   ├──► Raqam kiriting
        │         │   │    ↓
        ├─ Raqam  │   │ Backend ga yuborish
        │ o'zgar  │   │    ↓
        │ ketish  │   │ localStorage ga saqlash
        │    ↓    │   │    ↓
        └────┴────┘   └─────┘
             │             │
             └────┬────────┘
                  ▼
         Restoranlarga o'tish
```

### Backend API

```
POST /api/contacts
├── Yangi kontakt yaratish yoki yangilash
├── JSON: { phoneNumber, firstName, lastName }
└── Response: { success, isNew, contact }

GET /api/contacts/check?phone=...
├── Telefon raqamini tekshirish
└── Response: { isNewContact, phoneNumber }

POST /api/contacts/login
├── Last login ni yangilash
├── JSON: { phoneNumber }
└── Response: { success, contact }

GET /api/contacts/:phone
├── Kontakt haqida ma'lumot olish
└── Response: contact object

DELETE /api/contacts/:phone
├── Kontaktni o'chirish
└── Response: { success, message }
```

---

## 💾 Local Storage Format

### userPhone
```javascript
"+998901234567"
```

### phoneHistory
```javascript
[
  {
    oldPhone: "+998901234567",
    changedAt: "2024-02-03T10:30:00Z"
  },
  {
    oldPhone: "+998911234567",
    changedAt: "2024-02-03T14:45:00Z"
  }
]
```

---

## 🚀 Ishga Tushurish

### 1. Dependencies o'rnatish

```bash
npm install express cors
```

### 2. Backend API ni ishga tushurish

```bash
node server-api.js
```

Output:
```
╔═══════════════════════════════════════════════════════╗
║  API Server ishga tushdi!                             ║
║  URL: http://localhost:8080                          ║
║  CORS: Enabled                                        ║
║  Database: In-Memory (JSON)                           ║
╚═══════════════════════════════════════════════════════╝
```

### 3. Frontend server ni ishga tushurish (boshqa terminal)

```bash
node server.js
```

### 4. Brauzerda ochadinq

```
http://localhost:3000
```

---

## 🧪 Test Qilish

### Yangi Foydalanuvchi Test
1. localStorage ni o'chirish: `Dev Tools > Application > Clear Storage`
2. Sahifani qayta yuklash
3. Telefon raqami so'rashi
4. 9 raqam kiriting (masalan: 901234567)
5. "Davom etish" bosilganida backend ga yuboriladi

### Mavjud Foydalanuvchi Test
1. Sahifani qayta yuklash
2. Saqlangan raqam ko'rsatiladi
3. "Ha, shu raqamman" bosilsa `lastLogin` yangilanadi
4. "Raqamni o'zgartirish" bosilsa yangi raqam formi ko'rsatiladi

### API Test (cURL)

```bash
# Kontakt tekshirish
curl http://localhost:8080/api/contacts/check?phone=+998901234567

# Kontakt yaratish
curl -X POST http://localhost:8080/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+998901234567",
    "firstName": null,
    "lastName": null
  }'

# Last login ni yangilash
curl -X POST http://localhost:8080/api/contacts/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+998901234567"}'

# Barcha kontaktlarni olish
curl http://localhost:8080/api/contacts

# Restoranlarga ma'lumot olish
curl http://localhost:8080/api/user/shops
```

---

## 📝 Kod Izohlar

### Frontend - checkSavedPhone()
```javascript
// localStorage dan telefon raqamini oladi
// Backend dan tekshiradi (yangi yoki mavjud)
// Agar mavjud bo'lsa mavjud raqam modali ko'rsatiladi
// Yangi bo'lsa yangi raqam formi ko'rsatiladi
```

### Frontend - savePhoneNumber()
```javascript
// Yangi raqamni backend ga yuboradi
// localStorage ga saqlaydi
// sessionStorage ga ham saqlaydi
// phoneHistory ga o'zgarish tarihini yozadi
```

### Frontend - updateLastLogin()
```javascript
// Backend ga POST so'rovi yuboradi
// /api/contacts/login endpoint ini chaqiradi
// Database da lastLogin vaqtini yangilaydi
```

---

## 🔒 Security Notes

- Frontend: localStorage dan faqat telefon raqami saqlanadi
- Backend: In-memory database (test uchun), haqiqiy loyihada encrypted DB zarur
- CORS: localhost uchun faoliyat
- Validation: Frontend va backend da telefon formati tekshiriladi

---

## 🔄 Ma'lumot Oqimi

```
Yangi Foydalanuvchi:
1. Telefon so'rashi (Modal)
2. Raqam kiriting: 901234567
3. Backend ga yuborish
4. localStorage ga saqlash
5. lastLogin = now
6. Saytni ko'rsatish

Mavjud Foydalanuvchi (Yangi Kirish):
1. localStorage dan raqamni olish
2. Backend dan tekshirish
3. Mavjud raqam modalini ko'rsatish
4. Raqamni tasdiqlash
5. lastLogin = now (yangilash)
6. Saytni ko'rsatish

Raqam O'zgartirish:
1. "Raqamni o'zgartirish" bosilgan
2. Yangi raqam kiriting
3. Eski raqamni phoneHistory ga yozish
4. Yangi raqamni saqlash
5. lastLogin = now
```

---

## ⚠️ Xatolikni Tuzatish

### Backend connecta olmayotgan bo'lsa
```javascript
// Frontend hato beradi:
"Backend ishlamayotgan bo'lishi mumkin"

// Tekshiring:
1. server-api.js ishga tushganmi? (port 8080)
2. CORS faol bo'lganmi?
3. API URL to'g'rimi? (API_BASE_URL = 'http://localhost:8080')
```

### localStorage dan o'chirib tashlash
```javascript
// Browser konsol da:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## 📋 Checklist

- ✅ HTML modal sozlangan (3 form bilan)
- ✅ JavaScript logic (phone management)
- ✅ CSS stillar (modern dizayn)
- ✅ Backend API (Node.js + Express)
- ✅ localStorage integratsiyasi
- ✅ lastLogin yangilash
- ✅ phoneHistory logging
- ✅ CORS konfiguratsiyasi
- ✅ Error handling
- ✅ Documentation

---

## 🎓 Qo'shimcha Amaliyotlar

### 1. Real Database ga O'tish
```javascript
// MongoDB o'rniga:
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  phoneNumber: String,
  firstName: String,
  lastName: String,
  createdAt: Date,
  lastLogin: Date
});
```

### 2. Authentication Qo'shish
```javascript
// JWT tokens
const jwt = require('jsonwebtoken');
// Token generate qilish va validate qilish
```

### 3. Phone Verification
```javascript
// SMS orqali tekshirish
const Twilio = require('twilio');
// OTP send qilish va verify qilish
```

### 4. Analytics
```javascript
// Kirish statistikasi
// Eng ko'p ishlatiladigan vaqt
// Foydalanuvchi davomiyligi
```

---

## � SAVAT (CART) SISTEMA

### API Endpoints

```
GET /api/cart
├── Savatni olish (phone va shopId orqali)
├── Query: phone=+998901234567&shopId=1
└── Response: [{ id, cartId, productId, quantity, price }]

POST /api/cart/add
├── Savatga mahsulot qo'shish
├── JSON: { phone, shopId, productId, price, quantity }
└── Response: { success, item, cart }

POST /api/cart/update
├── Miqdori yangilash
├── JSON: { phone, itemId, quantity }
└── Response: { success, item, cart }

DELETE /api/cart/delete/:itemId
├── Mahsulotni o'chirish
├── Query: phone=+998901234567
└── Response: { success, message }

DELETE /api/cart/clear
├── Butun savatni o'chirish
├── Query: phone=+998901234567&shopId=1
└── Response: { success, message }

GET /api/cart/all
├── Barcha cartlarni olish (Admin)
└── Response: { total, carts }
```

### Frontend Integration

```javascript
// Telefon olish
getUserPhone() -> "+998901234567"

// Shop ID olish
getShopId() -> 1

// Savatni yuklash
loadCart() -> API GET /api/cart

// Mahsulot qo'shish
addToCart(shopId, productId, price, quantity)

// Miqdor yangilash
updateCartItem(itemId, newQty) -> API POST /api/cart/update

// O'chirish
deleteCartItem(itemId) -> API DELETE /api/cart/delete/:itemId
```

### Test

```bash
# Savat olish
curl 'http://localhost:8080/api/cart?phone=%2B998901234567&shopId=1'

# Mahsulot qo'shish
curl -X POST http://localhost:8080/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "shopId": 1,
    "productId": 101,
    "price": 35000,
    "quantity": 2
  }'

# Miqdor yangilash
curl -X POST http://localhost:8080/api/cart/update \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "itemId": 1,
    "quantity": 5
  }'

# O'chirish
curl -X DELETE 'http://localhost:8080/api/cart/delete/1?phone=%2B998901234567'

# Savat o'chirish
curl -X DELETE 'http://localhost:8080/api/cart/clear?phone=%2B998901234567&shopId=1'
```

---

Savollar yoki muammolar uchun console.log chiqiqlarini tekshiring:
```
[CHECK] Phone tekshirish
[SAVE] Kontakt saqlash
[LOGIN] Last login yangilash
[GET] Kontakt olish
[DELETE] Kontakt o'chirish
```

---

**Yangilandi:** 2024-02-03  
**Versiya:** 1.0.0  
**Holati:** Production Ready ✅
