import { OmitType } from '@nestjs/swagger';
import { LoginResponseDto } from './response-login.dto';

export class RefreshTokenResponseDto extends OmitType(LoginResponseDto, ['user']) {}
