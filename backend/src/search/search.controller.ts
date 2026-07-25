import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Search active jobs' })
  @ApiQuery({ name: 'q', required: true })
  @ApiBearerAuth()
  // Optional auth
  searchJobs(@Request() req: any, @Query('q') query: string) {
    const userId = req.user?.id;
    return this.searchService.searchJobs(userId, query);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'q', required: true })
  getAutocomplete(@Query('q') query: string) {
    return this.searchService.getAutocomplete(query);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent searches' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getRecentSearches(@Request() req: any) {
    return this.searchService.getRecentSearches(req.user.id);
  }
}
