export const ErrorMessages = {
  empty: (param: string) => `O campo ${param} não pode estar vazio.`,
  length: (param: string, min: number, max: number) =>
    `O campo ${param} deve ter entre ${min ?? '-'} e ${max ?? '-'} caracteres.`,
  invalid: (param: string) => `O campo ${param} é inválido!`,
  'string.base': (param: string) => `O campo ${param} deve ser uma string`,
  'string.min': (param: string, limit: number = null) =>
    `O campo ${param} deve ter pelo menos ${limit ?? '-'} caracteres.`,
  'string.max': (param: string, limit: number = null) =>
    `O campo ${param} não pode ter mais de ${limit ?? '-'} caracteres.`,
  'number.base': (param: string) => `O campo ${param} deve ser um número.`,
  'number.min': (param: string, limit: number = null) =>
    `O campo ${param} deve ser maior ou igual a ${limit ?? '-'}.`,
  'number.max': (param: string, limit: number = null) =>
    `O campo ${param} deve ser menor ou igual a ${limit ?? '-'}.`,
  'array.base': (param: string) => `O campo ${param} deve ser um array.`,
  'array.min': (param: string, limit: number = null) =>
    `O campo ${param} deve ser um array e deve ter pelo menos ${limit ?? '-'} de tamanho.`,
  'object.base': (param: string) => `O campo ${param} deve ser um objeto.`,
  'decimal.base': (param: string) => `O campo ${param} deve ser um decimal.`,
  'decimal.min': (
    param: string,
    limit: number = null,
    decimal_digits_limit: number = null,
  ) =>
    `O campo ${param} deve ser maior ou igual a ${limit.toFixed(decimal_digits_limit) ?? '-'}.`,
  'decimal.max': (
    param: string,
    limit: number = null,
    decimal_digits_limit: number = null,
  ) =>
    `O campo ${param} deve ser menor ou igual a ${limit.toFixed(decimal_digits_limit) ?? '-'}.`,
  'boolean.base': (param: string) =>
    `O campo ${param} deve ser do tipo booleano`,
};
