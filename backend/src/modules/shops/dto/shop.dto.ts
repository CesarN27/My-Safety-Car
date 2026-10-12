import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SHOP_STATUSES, type ShopStatus } from '../../../common/enums.js';
import { PHONE_PATTERN } from '../../../common/phone.js';

export class CreateShopDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  /** Nombre del dueño; se crea su cuenta de acceso con el teléfono del taller. */
  @IsString() @MinLength(2) @MaxLength(100) owner: string;
  @Matches(PHONE_PATTERN, { message: 'phone no es un teléfono válido' })
  phone: string;
  @IsString() @MaxLength(100) zone: string;
  @IsString() @MaxLength(200) address: string;
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  specialties: string[];
  @IsString() @MaxLength(100) hours: string;
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
}

export class UpdateShopStatusDto {
  @IsIn(SHOP_STATUSES) status: ShopStatus;
}
