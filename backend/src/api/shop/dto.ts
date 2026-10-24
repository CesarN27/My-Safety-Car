import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  COST_KINDS,
  PAY_TYPES,
  type CostKind,
  type PayType,
} from '../../common/enums.js';
import { PHONE_PATTERN } from '../../common/phone.js';
import { CarFieldsDto } from '../common/dto.js';

const money = { maxDecimalPlaces: 2 } as const;

export class ClientDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @Matches(PHONE_PATTERN, { message: 'phone no es un teléfono válido' })
  phone: string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
}

export class VehicleDto {
  @IsString() @MinLength(1) @MaxLength(40) brand: string;
  @IsString() @MinLength(1) @MaxLength(40) model: string;
  @IsString() @MaxLength(10) year: string;
  @IsString() @MaxLength(30) color: string;
  @IsOptional() @IsString() @MaxLength(15) plates?: string;
  @IsOptional() @IsString() @MaxLength(20) vin?: string;
}

export class CreateCarDto extends CarFieldsDto {
  @ValidateNested() @Type(() => ClientDto) client: ClientDto;
  @IsOptional() @IsUUID() vehicleId?: string;
  @IsOptional() @ValidateNested() @Type(() => VehicleDto) vehicle?: VehicleDto;
  @IsString() @MaxLength(20) declare km: string;
  @IsOptional() @IsUUID() helperId?: string;
}

export class UpdateCarDto extends CarFieldsDto {
  /** null desasigna al ayudante. */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() helperId?:
    string | null;
}

export class CostItemDto {
  @IsIn(COST_KINDS) kind: CostKind;
  @IsString() @MinLength(1) @MaxLength(200) desc: string;
  @IsOptional() @IsNumber(money) @Min(0.01) @Max(100000) qty: number = 1;
  @IsNumber(money) @Min(0) @Max(9_999_999) cost: number;
  @IsNumber(money) @Min(0) @Max(9_999_999) price: number;
  @IsOptional() @IsString() @MaxLength(100) supplier?: string;
}

export class CostsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CostItemDto)
  items: CostItemDto[];
  @IsOptional() @IsBoolean() ivaOn?: boolean;
}

export class CarListQuery {
  /** Solo los de esta etapa; sin filtro trae todos los que no se han entregado. */
  @IsOptional() @Type(() => Number) @IsIn([0, 1, 2, 3, 4, 5]) state?:
    0 | 1 | 2 | 3 | 4 | 5;
}

export class VehicleSearchQuery {
  /** Placas, VIN o teléfono del cliente. */
  @IsString() @MinLength(3) @MaxLength(30) q: string;
}

export class HelperDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @Matches(PHONE_PATTERN, { message: 'phone no es un teléfono válido' })
  phone: string;
  @IsIn(PAY_TYPES) payType: PayType;
  @IsOptional() @IsNumber(money) @Min(0) @Max(9_999_999) payAmount?: number;
  @IsOptional() @IsNumber(money) @Min(0) @Max(100) payPct?: number;
}

export class UpdateHelperDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsIn(PAY_TYPES) payType?: PayType;
  @IsOptional() @IsNumber(money) @Min(0) @Max(9_999_999) payAmount?: number;
  @IsOptional() @IsNumber(money) @Min(0) @Max(100) payPct?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class PaymentsQuery {
  @IsOptional() @IsUUID() helperId?: string;
  @IsOptional() @IsIn(['true', 'false']) pending?: 'true' | 'false';
}

export class ReportQuery {
  /** Fechas ISO (AAAA-MM-DD); el reporte cubre [from, to). */
  @Matches(/^\d{4}-\d{2}-\d{2}$/) from: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) to: string;
}

export class ShopSettingsDto {
  @IsOptional() @IsNumber(money) @Min(0) @Max(100) ivaPct?: number;
  @IsOptional() @IsString() @MaxLength(100) hours?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  specialties?: string[];
}
