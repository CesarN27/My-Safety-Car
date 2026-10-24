import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  Matches,
  IsBoolean,
  IsIn,
  IsInt,
  Max,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import { INSPECTION_POINTS } from '../../common/inspection.js';
import { STROKE_PATTERN } from '../../common/signature.js';

/** Inspección: solo los 15 puntos conocidos, con 0 (bien), 1 (dañado) o 2 (no aplica). */
export function IsInspection(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isInspection',
      target: target.constructor,
      propertyName,
      options: {
        message: `inspection solo acepta los puntos ${INSPECTION_POINTS.join(', ')} con valor 0, 1 o 2`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          !!value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          Object.entries(value).every(
            ([k, v]) =>
              (INSPECTION_POINTS as readonly string[]).includes(k) &&
              (v === 0 || v === 1 || v === 2),
          ),
      },
    });
}

export class DamageDto {
  @IsInt() @Min(0) id: number;
  @IsNumber() x: number;
  @IsNumber() y: number;
  @IsString() @MaxLength(300) note: string;
  @IsOptional()
  @IsIn(['arriba', 'frente', 'atras', 'izquierda', 'derecha'])
  view?: 'arriba' | 'frente' | 'atras' | 'izquierda' | 'derecha';
  @IsOptional() @IsIn(['golpe', 'rayon']) type?: 'golpe' | 'rayon';
}

export class SignatureDto {
  @IsInt() @Min(1) @Max(4000) w: number;
  @IsInt() @Min(1) @Max(4000) h: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  @IsString({ each: true })
  @MaxLength(50_000, { each: true })
  @Matches(STROKE_PATTERN, {
    each: true,
    message: 'strokes solo acepta trazos "M x,y L x,y …"',
  })
  strokes: string[];
}

export class LogDto {
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @IsOptional() @IsBoolean() visibleToClient?: boolean;
}

export class StateDto extends LogDto {
  @IsIn([0, 1, 2, 3, 4, 5]) state: 0 | 1 | 2 | 3 | 4 | 5;
}

/** Campos de trabajo del expediente que el taller puede editar. */
export class CarFieldsDto {
  @IsOptional() @IsString() @MaxLength(20) km?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) fuel?: number;
  @IsOptional() @IsObject() @IsInspection() inspection?: Record<
    string,
    0 | 1 | 2
  >;
  @IsOptional()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DamageDto)
  damages?: DamageDto[];
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsString() @MaxLength(4000) clientDescription?: string;
  @IsOptional() @IsBoolean() ivaOn?: boolean;
}
