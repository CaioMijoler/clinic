import { ApiProperty } from "@nestjs/swagger";

export class TDashboardStatsResponse {
  @ApiProperty()
  total: number;

  @ApiProperty()
  confirmed: number;

  @ApiProperty()
  canceled: number;
};