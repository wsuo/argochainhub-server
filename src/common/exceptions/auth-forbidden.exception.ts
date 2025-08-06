import { ForbiddenException } from '@nestjs/common';
import { AuthErrorCode, AuthErrorMessages } from '../constants/error-codes';

export class AuthForbiddenException extends ForbiddenException {
  constructor(code: AuthErrorCode) {
    super({
      message: AuthErrorMessages[code],
      code,
      error: 'Forbidden',
      statusCode: 403,
    });
  }
}