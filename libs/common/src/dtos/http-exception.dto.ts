import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExceptionDto<ErrCode> {
    @ApiProperty({ type: Number, enum: HttpStatus })
    status: HttpStatus;

    @ApiProperty({ type: String })
    code: ErrCode;

    @ApiPropertyOptional({ type: Object })
    errors?: Record<string, any>;
}

export class HttpExceptionDto<ErrCode> extends HttpException {
    constructor(data: ExceptionDto<ErrCode>) {
        super(
            {
                status: data.status,
                errors: data.errors,
                code: data.code,
            },
            data.status,
        );
    }
}
