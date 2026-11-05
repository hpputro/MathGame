# 🎈 Balon Matematika

Game belajar matematika berbasis web (HTML + CSS + JavaScript, tanpa library).

## Cara Main
1. Buka `index.html` di browser.
2. Di menu depan pilih:
   - **Operasi**: `+`, `−`, `×`, `÷`
   - **Angka Awal** dan **Angka Akhir** (1 – 20)
   - **Kecepatan**: 5, 4, 3, atau 2 detik (lama balon turun sampai tanah)
3. Tekan **Mulai Belajar**.
4. Balon berisi soal turun dari atas. Ketik jawabannya (tombol angka di layar atau keyboard).
   Jawaban benar → balon pecah dan soal berikutnya muncul.
5. **Kalah** jika balon menyentuh tanah. **Menang** jika berhasil sampai soal terakhir.

## Urutan Soal
Untuk Angka Awal `a` sampai Angka Akhir `b`, soal muncul berurutan, contoh penjumlahan 1–9:
`1+1, 1+2, …, 1+9, 2+1, …, 9+9` (81 soal).

Agar jawaban selalu bilangan bulat positif:
- Pengurangan: `(x+y) − x = y` → `2−1, 3−1, …`
- Pembagian: `(x×y) ÷ x = y` → `1÷1, 2÷1, …, 2÷2, 4÷2, …`

## Kontrol Keyboard
- `0–9`: isi jawaban
- `Backspace`: hapus satu angka
- `Esc` / `Delete`: hapus semua
- `Enter`: cek jawaban
