/**
 * Kirim email reset password via Resend API (fetch, tanpa SDK).
 * Kalau RESEND_API_KEY belum diset, link hanya di-log ke console —
 * cukup untuk dev; di production admin bisa baca dari function logs.
 */
export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[mailer] RESEND_API_KEY tidak diset. Link reset untuk ${to}: ${resetUrl}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? 'BREAK <onboarding@resend.dev>',
      to: [to],
      subject: 'Reset password akun BREAK',
      html: [
        '<p>Kamu meminta reset password akun BREAK.</p>',
        `<p><a href="${resetUrl}">Klik di sini untuk membuat password baru</a> — link berlaku 1 jam dan hanya bisa dipakai sekali.</p>`,
        '<p>Kalau kamu tidak merasa meminta ini, abaikan email ini.</p>',
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    // Jangan gagalkan request user hanya karena email gagal terkirim
    console.error(`[mailer] Gagal kirim email reset (${res.status}): ${await res.text()}`);
  }
}
