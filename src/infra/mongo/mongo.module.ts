import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error(
            'MONGODB_URI is required (MongoDB connection string). See .env.example.',
          );
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
