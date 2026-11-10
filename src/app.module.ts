import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './authentication/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { InvitationsModule } from './invitations/invitations.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // task scheduling
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL') || 60000,
            limit: config.get('THROTTLE_LIMIT') || 10,
          },
        ],
      }),
    }),

    // // Event Emitter
    // EventEmitterModule.forRoot(),

    // Static Files (for webhooks, etc.)
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    //   serveRoot: '/public',
    // }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    MailModule,
    ProfileModule,
    InvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
