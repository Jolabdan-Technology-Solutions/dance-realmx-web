import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll(@Query() query: QueryMessageDto) {
    return this.messagesService.findAll(query);
  }

  @Get('conversation')
  findConversation(@Query() query: QueryMessageDto) {
    if (!query.user1Id || !query.user2Id) {
      throw new Error('user1Id and user2Id are required');
    }
    return this.messagesService.findByConversation(
      query.user1Id,
      query.user2Id,
      query,
    );
  }

  @Get('unread/count')
  getUnreadCount(@Query('userId') userId: string) {
    return this.messagesService.getUnreadCount(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(+id);
  }

  @Patch('read-all')
  markAllAsRead(@Query('userId') userId: string) {
    return this.messagesService.markAllAsRead(+userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.delete(+id);
  }

  @Delete('conversation')
  removeConversation(
    @Query('user1Id') user1Id: string,
    @Query('user2Id') user2Id: string,
  ) {
    return this.messagesService.deleteConversation(+user1Id, +user2Id);
  }
}
