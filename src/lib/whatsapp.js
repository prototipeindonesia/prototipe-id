export async function sendWhatsApp(target, message) {
  try {
    // Normalisasi nomor: 08xxx → 628xxx
    let phone = String(target).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    if (phone.startsWith('8')) phone = '62' + phone;

    const res = await fetch('/api/send-wa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: phone, message }),
    });

    return await res.json();
  } catch (err) {
    console.error('WA error:', err);
    return { error: err.message };
  }
}

export function waAdminCredentials({ name, email, password, loginUrl }) {
  return `Halo *${name}* 👋

Akun admin Anda di *Prototipe.id* telah dibuat:

📧 Email: ${email}
🔑 Password: ${password}

🚀 Login di: ${loginUrl}

⚠️ Segera ganti password setelah login.`;
}

export function waNewOrder({ name, title, category, price }) {
  return `Halo *${name}* 👋

Ada order baru untuk Anda di *Prototipe.id*:

📋 *${title}*
🏷️ Kategori: ${category}
💰 Harga: Rp ${price.toLocaleString('id-ID')}

Cek sekarang di dashboard! 🚀`;
}