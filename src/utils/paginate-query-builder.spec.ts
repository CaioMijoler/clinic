import { normalizeStatusFilterValues } from './paginate-query-builder';

describe('normalizeStatusFilterValues', () => {
  it('maps the concluded filter to concluded and confirmed_schedule', () => {
    expect(normalizeStatusFilterValues('concluded')).toEqual([
      'concluded',
      'confirmed_schedule',
    ]);
  });

  it('maps the canceled filter to canceled and canceled_schedule', () => {
    expect(normalizeStatusFilterValues('canceled')).toEqual([
      'canceled',
      'canceled_schedule',
    ]);
  });

  it('keeps other status values unchanged', () => {
    expect(normalizeStatusFilterValues('created')).toEqual(['created']);
  });
});
