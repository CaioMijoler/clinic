import { Transform } from 'class-transformer';

export function StringToNumberTransform() {
  return Transform(({ value }) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? 0 : parsedValue;
    }

    return 0;
  });
}

export function FormatPhone() {
  return Transform(({ value }) => {
    const sanitaze = value.replace(/\D/g, '');
    if (sanitaze.length >= 12) {
      return sanitaze.replace(/^55/, '');
    }

    return sanitaze;
  });
}
