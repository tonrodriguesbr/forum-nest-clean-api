import { Injectable } from "@nestjs/common";

import { AnswerAttachmentsRepository } from "@/domain/forum/application/repositories/answer-attachments-repository";
import { PrismaService } from "../prisma.service";
import { PrismaAnswerAttachmentMapper } from "../mappers/prisma-answer-attachment-mapper";
import { AnswerAttachment } from "@/domain/forum/enterprise/entities/answer-attachment";

@Injectable()
export class PrismaAnswerAttachmentsRepository
  implements AnswerAttachmentsRepository
{
  constructor(private prismaService: PrismaService) {}

  async createMany(answerAttachments: AnswerAttachment[]): Promise<void> {
    if (answerAttachments.length === 0) {
      return;
    }

    const data =
      PrismaAnswerAttachmentMapper.toPrismaUpdateMany(answerAttachments);

    await this.prismaService.attachment.updateMany(data);
  }

  async deleteMany(answerAttachments: AnswerAttachment[]): Promise<void> {
    if (answerAttachments.length === 0) {
      return;
    }

    const attachmentIds = answerAttachments.map((attachment) =>
      attachment.id.toString()
    );

    await this.prismaService.attachment.deleteMany({
      where: {
        id: {
          in: attachmentIds,
        },
      },
    });
  }

  async findManyByAnswerId(answerId: string) {
    const attachments = await this.prismaService.attachment.findMany({
      where: {
        answerId,
      },
    });

    return attachments.map(PrismaAnswerAttachmentMapper.toDomain);
  }

  async deleteManyByAnswerId(answerId: string) {
    await this.prismaService.attachment.deleteMany({
      where: {
        answerId,
      },
    });
  }
}
