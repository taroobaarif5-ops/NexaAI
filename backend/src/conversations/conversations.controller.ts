import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
@UseGuards(JwtAuthGuard) @Controller('conversations')
export class ConversationsController {
 constructor(private readonly conversations: ConversationsService) {}
 @Post() create(@Body() body: { mode?: string }, @Req() req: { user: { id: string } }) { return this.conversations.create(req.user.id, body?.mode || 'general'); }
 @Get() findAll(@Req() req: { user: { id: string } }) { return this.conversations.findAll(req.user.id); }
 @Get(':id') findOne(@Param('id') id: string, @Req() req: { user: { id: string } }) { return this.conversations.findOne(id, req.user.id); }
 @Patch(':id') rename(@Param('id') id: string, @Body() body: { title: string }, @Req() req: { user: { id: string } }) { return this.conversations.rename(id, req.user.id, body.title); }
 @Delete(':id') remove(@Param('id') id: string, @Req() req: { user: { id: string } }) { return this.conversations.remove(id, req.user.id); }
}
