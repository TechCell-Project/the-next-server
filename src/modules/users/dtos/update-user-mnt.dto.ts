import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { RolesWithoutCustomerAndManager, UserRole } from '../enums';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { BlockActivityLog } from '../schemas/block.schema';
import { Transform } from 'class-transformer';
import { isTrueSet } from '~/common';

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
    @ApiProperty({ type: Boolean, example: false })
    @Transform(({ value }) => isTrueSet(value))
    @IsBoolean()
    isBlocked: boolean;

    @ApiProperty({ type: BlockActivityLogDto })
    @ValidateNested({ each: true })
    activityLogs: BlockActivityLogDto;
}

export class UpdateUserMntDto {
    @ApiPropertyOptional({
        enum: RolesWithoutCustomerAndManager,
        description: 'User role to update',
        example: UserRole.DataEntry,
    })
    @IsOptional()
    @IsEnum(RolesWithoutCustomerAndManager)
    role?: UserRole;

    @ApiPropertyOptional({ type: BlockUserDto })
    block?: BlockUserDto;
}
