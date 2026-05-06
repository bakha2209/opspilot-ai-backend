import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Request completed successfully' })
  message: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false, example: null })
  error?: unknown;

  constructor(success: boolean, message: string, data?: T, error?: unknown) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }
}