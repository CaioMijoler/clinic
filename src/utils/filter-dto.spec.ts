import { plainToInstance } from 'class-transformer';
import { FilterDto } from './filter-dto';

describe('FilterDto', () => {
  it('parses nested filter query params into the filter object', () => {
    const dto = plainToInstance(FilterDto, {
      paginate: 'true',
      filter: {
        status: 'concluded',
        symptoms: 'dor',
      },
    });

    expect(dto.filter).toEqual({
      status: 'concluded',
      symptoms: 'dor',
    });
  });
});
