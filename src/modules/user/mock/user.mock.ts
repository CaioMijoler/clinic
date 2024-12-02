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
    token: 'dfsdfr34re324refas',
    calendarId: '1',
    credentials: { teste: 'teste' },
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
    token: 'dfsdfr34re324refas',
    calendarId: '1',
    credentials: { teste: 'teste' },
    whatsAppId: '1',
    whatsAppToken: 'dsadas',
  };
};
