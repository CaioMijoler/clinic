import moment from 'moment';

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

export { generateScheduling, formatZipCode };
