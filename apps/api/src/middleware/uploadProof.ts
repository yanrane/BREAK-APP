import multer from 'multer';
import path from 'path';
import { promises as fsp } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../lib/appError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = (parseInt(process.env.MAX_UPLOAD_MB ?? '5', 10)) * 1024 * 1024;

// Use memory storage so we can validate magic bytes before persisting
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Hanya JPG, PNG, dan WEBP yang diizinkan'));
    } else {
      cb(null, true);
    }
  },
});

export const uploadProofMiddleware: RequestHandler[] = [
  upload.single('proof'),
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next(new AppError(400, 'PROOF_REQUIRED', 'File bukti wajib diunggah'));
    }

    try {
      const detected = await fileTypeFromBuffer(req.file.buffer);
      if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
        return next(new AppError(400, 'INVALID_FILE_TYPE', 'Format file tidak valid'));
      }

      const filename = `${uuidv4()}.${detected.ext}`;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        // Vercel Blob Storage (production)
        const { put } = await import('@vercel/blob');
        const blob = await put(`proofs/${filename}`, req.file.buffer, {
          access: 'public',
          contentType: detected.mime,
        });
        req.proofPath = blob.url;
      } else {
        // Local disk storage (development)
        const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
        await fsp.mkdir(uploadDir, { recursive: true });
        const filepath = path.join(uploadDir, filename);
        await fsp.writeFile(filepath, req.file.buffer);
        req.proofPath = `/uploads/${filename}`;
      }

      next();
    } catch (err) {
      console.error('[uploadProof] Failed to upload file:', err);
      next(new AppError(500, 'UPLOAD_FAILED', 'Gagal menyimpan file'));
    }
  },
];
