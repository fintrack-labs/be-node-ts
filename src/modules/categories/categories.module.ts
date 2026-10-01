import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity.js';
import { CategoriesController } from './categories.controller.js';
import { AuthModule } from '@modules/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    AuthModule
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, TypeOrmModule]
})
export class CategoriesModule { }
