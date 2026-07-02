import { Brackets, SelectQueryBuilder } from 'typeorm';
import { FilterDto } from './filter-dto';
import { BadRequestException } from '@nestjs/common';

export function normalizeStatusFilterValues(filterValue: string): string[] {
  const normalized = filterValue.trim().toLowerCase();

  if (normalized === 'concluded') {
    return ['concluded', 'confirmed_schedule'];
  }

  if (normalized === 'canceled') {
    return ['canceled', 'canceled_schedule'];
  }

  return [normalized];
}

export function paginateQuery<T>(
  queryBuilder: SelectQueryBuilder<T>,
  paginate: boolean,
  current_page: number,
  per_page: number,
  limit: number,
): SelectQueryBuilder<T> {
  const skip = (current_page - 1) * per_page;
  return paginate
    ? queryBuilder.skip(skip).take(per_page)
    : queryBuilder.take(limit ?? 30);
}

export function queryBuild<T>(
  queryBuilder: SelectQueryBuilder<T>,
  filterDto: FilterDto,
  alias: string,
): SelectQueryBuilder<T> {
  const { filter, relations, fields, sort, search, search_fields } = filterDto;


  if (filter) {
    const conditions = getConditions(filterDto, queryBuilder, alias);
    queryBuilder.andWhere(conditions);
  }

  if (fields) {
    const selectFields = matchStrToArray(fields);
    queryBuilder.select(selectFields.map((field) => `${alias}.${field}`));
  }

  if (relations) {
    const relationFields = matchStrToArray(relations);
    relationFields.forEach((relation) => {
      queryBuilder.leftJoinAndSelect(`${alias}.${relation}`, relation);
    });
  }

  if (sort) {
    Object.entries(sort).forEach(([field, order]) => {
      queryBuilder.addOrderBy(
        `${alias}.${field}`,
        order.toUpperCase() as 'ASC' | 'DESC',
      );
    });
  }

  if (search && search_fields) {
    applySearch(queryBuilder, alias, search, search_fields);
  }

  return queryBuilder;
}

const filterHandlers: {
  [key: string]: (
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    filterValue: string,
    filterKey?: string,
    relations?: string,
  ) => void;
} = {
  starts_between: (queryBuilder, alias, filterValue) => {
    const [start, end] = filterValue
      .split(',')
      .map((dateStr) => new Date(dateStr));
    queryBuilder.andWhere(`${alias}.createdAt BETWEEN :start AND :end`, {
      start,
      end,
    });
  },
  status: (queryBuilder, alias, filterValue) => {
    const statusValues = filterValue
      .split(',')
      .flatMap((value) => normalizeStatusFilterValues(value));

    queryBuilder.andWhere(`${alias}.status IN (:...statusValues)`, {
      statusValues,
    });
  },
  requesterById: (queryBuilder, alias, filterValue) => {
    const requesterIds = filterValue.split(',');
    queryBuilder.andWhere(`${alias}.requesterById IN (:...requesterIds)`, {
      requesterIds,
    });
  },
  username: (queryBuilder, alias, filterValue, _, relations) => {
    if (!relations?.includes('user')) {
      queryBuilder.leftJoinAndSelect(`${alias}.user`, 'user');
    }
    queryBuilder.andWhere(`user.username = :username`, {
      username: filterValue,
    });
  },
  default: (queryBuilder, alias, filterValue, filterKey) => {
    queryBuilder.andWhere(`${alias}.${filterKey} = :${filterKey}`, {
      [filterKey]: filterValue,
    });
  },
};

function getConditions(filterDto: FilterDto, queryBuilder, alias: string) {
  const { filter, relations } = filterDto;

  return new Brackets((qb) => {
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
      if (
        (filterKey === 'number' || filterKey === 'externalReference') &&
        filterValue
      ) {
        qb.orWhere(`${alias}.${filterKey} LIKE :${filterKey}`, {
          [filterKey]: `%${filterValue}%`,
        });
      } else if (filterValue) {
        const handler = filterHandlers[filterKey] || filterHandlers.default;
        handler(queryBuilder, alias, filterValue, filterKey, relations);
      }
    });
  });
}
function matchStrToArray(fields: string): string[] {
  return fields.split(',').map((field) => field.trim());
}

function getValidColumns<T>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
): string[] {
  return queryBuilder.expressionMap.mainAlias?.metadata.columns.map(
    (col) => col.propertyName,
  );
}

function applySearch<T>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  search: string,
  search_fields: string,
): void {
  const fields = matchStrToArray(search_fields);
  const validColumns = getValidColumns(queryBuilder, alias);

  const term = `%${search}%`;

  queryBuilder.andWhere(
    new Brackets((qb) => {
      fields.forEach((field, index) => {
        const cleanField = field.replace(/"/g, "");

        if (!validColumns.includes(cleanField)) {
          throw new BadRequestException(
            `Campo de busca inválido: ${cleanField}`,
          );
        }

        const safeField = cleanField.replace(/[^a-zA-Z0-9_]/g, "_");
        const paramKey = `search_${safeField}_${index}`;

        qb.orWhere(`${alias}.${cleanField} LIKE :${paramKey}`, {
          [paramKey]: term,
        });
      });
    }),
  );
}
