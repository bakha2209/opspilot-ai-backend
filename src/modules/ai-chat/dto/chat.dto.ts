import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ConfirmedActionDto {
  @ApiProperty({
    example: 'create_reorder_request',
  })
  @IsString()
  tool_name!: string;

  @ApiProperty({
    example: {
      warehouseId: 'warehouse-uuid',
      productId: 'product-uuid',
      recommendedQuantity: 50,
      reason: 'User confirmed reorder creation through AI Copilot',
    },
  })
  @IsObject()
  arguments!: Record<string, any>;

  @ApiProperty({
    example: 'Confirmed by user',
  })
  @IsString()
  confirmation_message!: string;
}

export class ChatDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({
    type: ConfirmedActionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfirmedActionDto)
  confirmedAction?: ConfirmedActionDto;
}