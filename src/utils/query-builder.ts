import { Repository } from 'typeorm';
import { FilterDto } from './filter-dto';
import { queryBuild, paginateQuery } from './paginate-query-builder';
import { IPaginate } from './paginate';

export async function findAllWithQueryBuilder<T>(
  repository: Repository<T>,
  queryParams: FilterDto,
  alias: string,
): Promise<IPaginate<T> | T[]> {
  const {
    current_page = 1,
    per_page = 10,
    paginate,
    limit,
  } = { ...queryParams };
  const queryBuilder = repository.createQueryBuilder(alias);

  queryBuild(queryBuilder, queryParams, alias);

  if (paginate) {
    const [response, total] = await paginateQuery(
      queryBuilder,
      paginate,
      current_page,
      per_page,
      limit,
    ).getManyAndCount();

    return {
      pagination: {
        current_page,
        per_page,
        total,
      },
      data: response,
    };
  }

  return await queryBuilder.getMany();
}
