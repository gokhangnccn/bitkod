import { z } from "zod";

export const usernameSchema = z.string()
    .min(4, 'Kullanıcı adınız en az 4 karakterden oluşmalı')
    .max(16, 'Kullanıcı adınız en fazla 16 karakter olabilir')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Kullanıcı adınız sadece harf, sayı, alt çizgi veya tire içerebilir');

export const emailSchema = z.string()
    .email('Geçersiz e-mail adresi');

export const basicPasswordSchema = z.string()
    .min(6, 'Şifreniz en az 6 karakter içermeli');

export const strongPasswordSchema = z.string()
    .min(8, 'Şifreniz en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'Şifreniz en az 1 büyük harf içermeli')
    .regex(/[a-z]/, 'Şifreniz en az 1 küçük harf içermeli')
    .regex(/[0-9]/, 'Şifreniz en az 1 sayı içermeli');

export const validationFieldsSchema = strongPasswordSchema;