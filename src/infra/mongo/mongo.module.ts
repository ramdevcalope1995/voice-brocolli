import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';

const logger = new Logger('MongoInfraModule');

// Attach connection-level error/event listeners once so a failed Atlas
// connection does NOT produce an unhandled rejection that kills the process.
mongoose.connection.on('error', (err: Error) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
mongoose.connection.on('connected', () => {
  logger.log('MongoDB connected ✓');
});

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          logger.error(
            'MONGODB_URI is not set — database features will be unavailable. ' +
            'Set this env var in Cloud Run or .env locally.',
          );
        } else {
          logger.log('MongoDB URI found — connecting...');
        }
        return {
          uri: uri ?? 'mongodb://127.0.0.1:27017/__unset__',
          // Do NOT block NestJS bootstrap on the initial TCP handshake.
          // The app will start and listen on PORT even if Atlas is slow.
          bufferCommands: false,
          serverSelectionTimeoutMS: 8_000,
          connectTimeoutMS: 10_000,
          autoCreate: false,
          autoIndex: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MongoInfraModule {}
