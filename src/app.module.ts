import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesDemoModule } from './sales-demo/sales-demo.module';
import { MongoInfraModule } from './infra/mongo/mongo.module';
import { RedisInfraModule } from './infra/redis/redis.module';
import { VectorInfraModule } from './infra/vector/vector.module';
import { QstashInfraModule } from './infra/qstash/qstash.module';
import { InfraHealthModule } from './infra/health/infra-health.module';
import { AiMemoryModule } from './ai-memory/ai-memory.module';
import { AuthModule } from './auth/auth.module';
import { NotebooksModule } from './notebooks/notebooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongoInfraModule,
    RedisInfraModule,
    VectorInfraModule,
    AuthModule,
    QstashInfraModule,
    InfraHealthModule,
    AiMemoryModule,
    SalesDemoModule,
    NotebooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
