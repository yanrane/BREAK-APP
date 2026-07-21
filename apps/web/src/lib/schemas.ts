import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter'),
});

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter'),
});

export const feedbackSchema = z.object({
  category: z.enum(['BUG_REPORT', 'SUGGESTION', 'COMPLAINT', 'OTHER'], {
    errorMap: () => ({ message: 'Pilih kategori dulu' }),
  }),
  title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(100, 'Judul maksimal 100 karakter'),
  message: z.string().trim().min(10, 'Pesan minimal 10 karakter').max(2000, 'Pesan maksimal 2000 karakter'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
