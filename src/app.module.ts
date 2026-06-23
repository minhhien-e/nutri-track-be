import { Module } from '@nestjs/common';
import { BodySystemsModule } from '@/modules/body-systems/body-systems.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from '@/modules/admin/admin.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DiaryModule } from '@/modules/diary/diary.module';
import { FoodsModule } from '@/modules/foods/foods.module';
import { HealthModule } from '@/modules/health/health.module';
import { MealPlansModule } from '@/modules/meal-plans/meal-plans.module';
import { ProfileModule } from '@/modules/profile/profile.module';
import { UsersModule } from '@/modules/users/users.module';
import { PrismaModule } from '@/database/prisma.module';
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import jwtConfig from '@/config/jwt.config';
import { envValidationSchema } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AdminModule,
    AnalyticsModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    FoodsModule,
    BodySystemsModule,
    DiaryModule,
    MealPlansModule,
    HealthModule,
  ],
})
export class AppModule {}
