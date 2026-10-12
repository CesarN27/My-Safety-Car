import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PHONE_PATTERN } from '../../common/phone.js';

export class RequestCodeDto {
  @Matches(PHONE_PATTERN, { message: 'phone no es un teléfono válido' })
  phone: string;
}

export class VerifyCodeDto {
  @Matches(PHONE_PATTERN, { message: 'phone no es un teléfono válido' })
  phone: string;

  @IsString()
  @Length(4, 8)
  code: string;

  /** Solo se usa cuando el teléfono es nuevo y se crea una cuenta de cliente. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}

export class RefreshDto {
  @IsString()
  @Length(20, 200)
  refreshToken: string;
}
