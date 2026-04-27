import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_inventory_key_123',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  ROOT_ADMIN_USERNAME: process.env.ROOT_ADMIN_USERNAME || 'admin',
  ROOT_ADMIN_PASSWORD: process.env.ROOT_ADMIN_PASSWORD || 'ChangeThisNow123!',
};
