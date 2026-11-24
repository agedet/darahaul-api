import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MailModule } from '../mail/mail.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [MailModule, InvitationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
