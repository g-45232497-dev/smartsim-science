# SMARTSIM SCIENCE v2 – Panduan AI Generatif

## Apa yang ditambah
- Frontend menghantar soalan Tutor dan rekod Analyst ke `/.netlify/functions/ai`.
- Netlify Function bertindak sebagai backend/proxy dan memanggil OpenAI Responses API atau Google Gemini API.
- API key hanya disimpan sebagai environment variable di hosting; ia tidak dimasukkan ke HTML.
- Jika backend/API belum dikonfigurasi, aplikasi memaparkan mod sandaran setempat. Status pada aplikasi membezakan kedua-dua mod.

## Fail
- `index.html` – aplikasi web.
- `netlify/functions/ai.mjs` – backend serverless.
- `netlify.toml` – konfigurasi Netlify.
- `.env.example` – nama tetapan (jangan masukkan kunci sebenar ke fail ini).

## Pemasangan paling mudah: Netlify
1. Ekstrak ZIP ini ke satu folder pada komputer.
2. Cipta akaun/log masuk Netlify.
3. Pilih **Add new site / Deploy manually** dan seret folder projek (folder yang mengandungi `index.html`, `netlify.toml` dan folder `netlify`) ke kawasan deploy. Untuk penggunaan fungsi serverless, jika kaedah manual tidak mengesan fungsi, sambungkan folder ini melalui repositori Git dan deploy sebagai projek Netlify.
4. Dalam Netlify: **Site configuration → Environment variables**.
5. Tambah `AI_PROVIDER` dengan nilai `gemini` atau `openai`.
6. Untuk Gemini, tambah `GEMINI_API_KEY`; pilihan model melalui `GEMINI_MODEL` (default kod: `gemini-2.5-flash`). Dapatkan kunci melalui Google AI Studio.
7. Atau untuk OpenAI, tambah `OPENAI_API_KEY`; pilihan model melalui `OPENAI_MODEL` (default kod: `gpt-6-mini`; tukar kepada model yang benar-benar tersedia dalam projek API anda).
8. Redeploy laman selepas mengubah environment variables.
9. Buka URL Netlify, jalankan satu eksperimen, kemudian uji AI Tutor dan AI Data Analyst.

## Keselamatan penting
- JANGAN tampal API key dalam `index.html`, JavaScript pelayar, QR code, atau repositori awam.
- Simpan kunci hanya dalam Environment Variables di Netlify.
- Hadkan penggunaan/kuota pada penyedia API. Untuk penggunaan sekolah sebenar, tambah autentikasi atau kod akses kelas, rate limiting pada gateway/backend dan had permintaan harian. Fungsi contoh ini tidak mempunyai sistem akaun pelajar atau rate limiting berpusat.
- Jangan minta pelajar memasukkan nama penuh, nombor kad pengenalan, data kesihatan atau maklumat peribadi. Elakkan menghantar data murid kepada model AI.
- Semak jawapan AI sebelum digunakan sebagai fakta pengajaran. AI boleh tersilap.

## Ujian setempat
Netlify Functions memerlukan Netlify CLI untuk dijalankan setempat. Selepas Node.js dipasang:
```bash
npm install -g netlify-cli
netlify dev
```
Tetapkan environment variable pada terminal atau fail `.env` setempat (jangan muat naik `.env`). Contoh:
```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=... 
```

## Nota pedagogi dan integriti
- Nilai pH dan warna indikator datang daripada enjin simulasi berasaskan peraturan, bukan diramal oleh AI generatif.
- AI generatif membantu menjawab soalan dan menghuraikan data simulasi.
- Dalam pembentangan, sebut dengan tepat bahawa AI menjana penerangan/analisis, manakala enjin simulasi mengawal hasil eksperimen maya.
