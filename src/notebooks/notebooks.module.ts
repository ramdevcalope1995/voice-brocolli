import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotebooksController } from './notebooks.controller';
import { NotebooksService } from './notebooks.service';
import { Notebook, NotebookSchema } from './schemas/notebook.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notebook.name, schema: NotebookSchema },
    ]),
  ],
  controllers: [NotebooksController],
  providers: [NotebooksService],
})
export class NotebooksModule {}
