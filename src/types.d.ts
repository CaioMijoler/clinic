import * as http from 'http';
import { User } from './modules/user/entities/user.entity';

// module augmentation
declare module 'express-serve-static-core' {
  export interface Request extends http.IncomingMessage, Express.Request {
    user?: AuthResponseDto;
  }
}
