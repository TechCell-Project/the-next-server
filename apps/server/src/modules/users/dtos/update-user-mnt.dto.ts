import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UserBlockActionEnum, RolesWithoutCustomerAndManager, UserRoleEnum } from '../enums';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { BlockActivityLog } from '../schemas/block.schema';
import { Type } from 'class-transformer';

export class BlockActivityLogDto extends PickType(BlockActivityLog, ['reason', 'note']) {
    @ApiProperty({ type: String, example: 'reason to be block or unblock' })
    @IsNotEmpty()
    @IsString()
    reason: string;

    @ApiPropertyOptional({ type: String, example: 'note' })
    @IsOptional()
    @IsString()
    note: string;
}

export class BlockUserDto {
    @ApiProperty({ type: String, enum: UserBlockActionEnum, example: UserBlockActionEnum.Block })
    @IsEnum(UserBlockActionEnum)
    action: string;

    @ApiProperty({ type: BlockActivityLogDto })
    @ValidateNested({ each: true })
    @Type(() => BlockActivityLogDto)
    activityLogs: BlockActivityLogDto;
}

export class UpdateUserMntDto {
    @ApiPropertyOptional({
        enum: RolesWithoutCustomerAndManager,
        description: 'User role to update',
        example: UserRoleEnum.Sales,
        type: String,
    })
    @IsOptional()
    @IsEnum(RolesWithoutCustomerAndManager)
    role?: UserRoleEnum;

    @ApiPropertyOptional({ type: BlockUserDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => BlockUserDto)
    block?: BlockUserDto;
}
