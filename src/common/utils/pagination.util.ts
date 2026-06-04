export function buildPaginationMeta(params: {
  page: number;
  limit: number;
  totalItems: number;
}) {
  const { page, limit, totalItems } = params;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
