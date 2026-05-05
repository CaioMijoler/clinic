import moment from 'moment';
import { createCipheriv, createDecipheriv } from 'crypto';
import appConfig from '../config/app.config';

const generateScheduling = (): string => {
  const orderPrefix = 'SO';
  const orderDate = `${moment().format('YYYYMMDDHHmmss')}${moment().milliseconds().toString().padStart(3, '0')}`;
  const orderNumber = `${orderPrefix}${orderDate}`;
  return orderNumber;
};

const formatZipCode = (zipcode: string): string => {
  return zipcode
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const encrypt = async (password: string) => {
  const algorithm = appConfig().cripto.alg;
  const key = Buffer.from(appConfig().cripto.secret, 'hex');
  const iv = Buffer.from(appConfig().cripto.iv, 'hex');

  const cipher = createCipheriv(algorithm, new Uint8Array(key), new Uint8Array(iv));
  let encryptedPayload = cipher.update(password, 'utf8', 'hex');
  encryptedPayload += cipher.final('hex');

  return encryptedPayload;
};

const decryptText = async (password) => {
  const algorithm = appConfig().cripto.alg;
  const key = Buffer.from(appConfig().cripto.secret, 'hex');
  const iv = Buffer.from(appConfig().cripto.iv, 'hex');

  const decipher = createDecipheriv(algorithm, new Uint8Array(key), new Uint8Array(iv));
  let decryptedPayload = decipher.update(password, 'hex', 'utf8');
  decryptedPayload += decipher.final('utf8');

  return decryptedPayload;
};

export { generateScheduling, formatZipCode, encrypt, decryptText };
