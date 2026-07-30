import { Repository } from 'typeorm';
import { FilterDto } from './filter-dto';
import { queryBuild, paginateQuery } from './paginate-query-builder';
import { IPaginate } from './paginate';

export async function findAllWithQueryBuilder<T>(
  repository: Repository<T>,
  queryParams: FilterDto,
  alias: string,
  options?: { excludeStatuses?: string[]; userId?: number },
): Promise<IPaginate<T> | T[]> {
  const {
    current_page = 1,
    per_page = 10,
    paginate,
    limit,
  } = { ...queryParams };
  const queryBuilder = repository.createQueryBuilder(alias);

  // `scopedUserId` evita colisão com um filtro `userId` vindo do queryParams.
  if (options?.userId) {
    queryBuilder.andWhere(`${alias}.userId = :scopedUserId`, {
      scopedUserId: options.userId,
    });
  }

  queryBuild(queryBuilder, queryParams, alias);

  if (options?.excludeStatuses?.length) {
    queryBuilder.andWhere(`${alias}.status NOT IN (:...excludeStatuses)`, {
      excludeStatuses: options.excludeStatuses,
    });
  }

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
