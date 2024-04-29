import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { ExceptionDto } from '~/common';
import { AuthErrorCodeEnum } from '../enums';

export class AuthHttpExceptionDto extends IntersectionType(ExceptionDto) {
    @ApiProperty({ type: String, enum: AuthErrorCodeEnum })
    code: unknown;
}
