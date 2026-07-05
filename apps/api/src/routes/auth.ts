import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from '../lib/schemas';
import { register, login, refresh, forgotPassword, resetPassword } from '../services/authService';
import { AppError } from '../lib/appError';

const router: Router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'TOO_MANY_REQUESTS', 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.'));
  },
});

router.post('/register', async (req, res, next) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const { tokens, user } = await register(result.data);
    res.status(201).json({ success: true, data: { ...tokens, user } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const { tokens, user } = await login(result.data);
    res.json({ success: true, data: { ...tokens, user } });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const { accessToken } = await refresh(result.data);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'TOO_MANY_REQUESTS', 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.'));
  },
});

// POST /api/v1/auth/forgot-password — selalu respon generik (jangan bocorkan email terdaftar)
router.post('/forgot-password', resetLimiter, async (req, res, next) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    await forgotPassword(result.data.email);
    res.json({
      success: true,
      data: { message: 'Jika email terdaftar, link reset password sudah dikirim.' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetLimiter, async (req, res, next) => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    await resetPassword(result.data.token, result.data.password);
    res.json({ success: true, data: { message: 'Password berhasil diubah. Silakan login.' } });
  } catch (err) {
    next(err);
  }
});

export default router;
