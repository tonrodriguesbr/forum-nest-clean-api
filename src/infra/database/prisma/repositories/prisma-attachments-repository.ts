import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";
import { AttachmentsRepository } from "@/domain/forum/application/repositories/attachments-repository";
import { Attachment } from "@/domain/forum/enterprise/entities/attachment";
import { PrismaAttachmentMapper } from "../mappers/prisma-attachments-mapper";

@Injectable()
export class PrismaAttachmentsRepository implements AttachmentsRepository {
  constructor(private prismaService: PrismaService) {}

  async create(attachment: Attachment) {
    const data = PrismaAttachmentMapper.toPrisma(attachment);
    await this.prismaService.attachment.create({
      data,
    });
  }
}
