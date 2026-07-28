/**
 * Recognition foto bukti misi memakai Claude vision.
 *
 * Sifatnya penanda, bukan gerbang: hasilnya disimpan untuk ditinjau, tapi tidak
 * pernah menolak misi user. Model bisa salah, dan menghukum user jujur karena
 * false positive jauh lebih merugikan daripada meloloskan satu foto meragukan.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface PhotoCheckResult {
  match: boolean;
  /** Keyakinan 0–100 bahwa foto sesuai misi. */
  score: number;
  reason: string;
}

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    match: { type: 'boolean' },
    score: { type: 'integer' },
    reason: { type: 'string' },
  },
  required: ['match', 'score', 'reason'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = [
  'Kamu memverifikasi foto bukti misi digital wellness.',
  'Nilai apakah isi foto masuk akal sebagai bukti misi yang diberikan.',
  'Bersikap longgar: foto yang buram, gelap, miring, atau seadanya tetap sah',
  'selama isinya nyambung dengan misi. Tandai tidak sesuai hanya kalau isi foto',
  'jelas tidak berhubungan (mis. screenshot, layar HP, atau objek acak).',
  'score = keyakinan 0-100 bahwa foto sesuai. reason: satu kalimat Bahasa Indonesia.',
].join(' ');

/** MIME yang diterima uploadProof; dipetakan langsung ke media_type Claude. */
type SupportedMime = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Normalisasi jawaban model jadi bentuk yang aman disimpan. Return null kalau
 * jawabannya tidak bisa dipakai — pemanggil memperlakukan itu sebagai "tidak diperiksa".
 */
export function parsePhotoCheck(text: string): PhotoCheckResult | null {
  try {
    const raw = JSON.parse(text) as Partial<PhotoCheckResult>;
    if (typeof raw.match !== 'boolean' || typeof raw.score !== 'number') return null;
    if (!Number.isFinite(raw.score)) return null;
    return {
      match: raw.match,
      score: Math.max(0, Math.min(100, Math.round(raw.score))),
      reason: String(raw.reason ?? '').slice(0, 500),
    };
  } catch {
    return null;
  }
}

/**
 * Cek satu foto terhadap deskripsi misi. Return null kalau recognition tidak
 * aktif (ANTHROPIC_API_KEY kosong) atau panggilan gagal — pemanggil harus
 * memperlakukan null sebagai "tidak diperiksa", bukan "tidak sesuai".
 */
export async function checkProofPhoto(args: {
  buffer: Buffer;
  mime: SupportedMime;
  missionTitle: string;
  missionDescription: string;
}): Promise<PhotoCheckResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      // effort low: ini klasifikasi sederhana, bukan penalaran berat
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: args.mime,
                data: args.buffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text: `Misi: ${args.missionTitle}\nDeskripsi: ${args.missionDescription}\n\nApakah foto ini bukti yang masuk akal untuk misi tersebut?`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') return null;

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;

    return parsePhotoCheck(text.text);
  } catch (err) {
    // ponytail: sekali coba, tanpa retry — hasilnya cuma penanda, misi user
    // sudah terverifikasi. Tambah retry kalau kelak dipakai untuk moderasi.
    console.error('[photoCheck] gagal memeriksa foto:', err);
    return null;
  }
}
