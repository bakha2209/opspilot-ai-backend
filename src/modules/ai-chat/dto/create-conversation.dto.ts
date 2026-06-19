import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    example: 'Inventory Copilot',
  })
  @IsString()
  @MaxLength(255)
  title!: string;
}
