import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

const logger = new Logger('MongoInfraModule');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          logger.error(
            'MONGODB_URI is not set. MongoDB will not be connected. ' +
            'Set this environment variable in Cloud Run (or .env locally).',
          );
          // Return a dummy URI so Mongoose registers but won't block startup.
          // Any DB operation will fail at the call site, not at boot time.
          return {
            uri: 'mongodb://localhost:27017/__unset__',
            serverSelectionTimeoutMS: 1_000,
          };
        }
        return {
          uri,
          serverSelectionTimeoutMS: 5_000,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MongoInfraModule {}
