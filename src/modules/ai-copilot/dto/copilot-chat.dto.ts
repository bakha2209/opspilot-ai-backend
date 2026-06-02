import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CopilotChatDto {
  @ApiProperty({
    example: 'Which products should I reorder first?',
  })
  @IsString()
  @MaxLength(5000)
  message!: string;
}