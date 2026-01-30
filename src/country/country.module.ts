import { Module } from '@nestjs/common';
import { CountryController } from './country.controller';
import { CountryService } from './country.service';
import { CountryRepository } from './repositories';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CountryController],
  providers: [
    CountryService,
    CountryRepository,
  ],
  exports: [
    CountryService,
  ],
})
export class CountryModule {}
