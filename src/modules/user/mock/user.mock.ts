import { CreateUserDto } from '../dto/create-user.dto';

export const createUserDto = (): CreateUserDto => {
  return {
    name: '12345678',
    password: 'City',
    type: 'State',
    document: 'Neighborhood',
    email: 'Complement',
    telephone: '4324234234',
    status: 'active',
    calendarId: '1',
    clientEmail: 'clientEmail',
    privateKey: 'privateKey',
    whatsAppId: '1',
    whatsAppToken: 'dsadas',
  };
};

export const createInvalidUserDto = (): CreateUserDto => {
  return {
    name: null,
    password: null,
    type: 'State',
    document: 'Neighborhood',
    email: 'Complement',
    telephone: '4324234234',
    status: 'active',
    calendarId: '1',
    clientEmail: 'clientEmail',
    privateKey: 'privateKey',
    whatsAppId: '1',
    whatsAppToken: 'dsadas',
  };
};
