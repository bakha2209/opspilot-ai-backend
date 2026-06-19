import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class ChatDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;
}
