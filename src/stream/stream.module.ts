import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamService } from './stream.service';

@Module({
  imports: [ConfigModule],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
