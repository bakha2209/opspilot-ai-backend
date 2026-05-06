import { ApiResponseDto } from '../dto/api-response.dto';

export const apiSuccess = <T>(
  message: string,
  data?: T,
): ApiResponseDto<T> => {
  return new ApiResponseDto<T>(true, message, data, null);
};

export const apiFail = (
  message: string,
  error?: unknown,
): ApiResponseDto<null> => {
  return new ApiResponseDto<null>(false, message, null, error);
};