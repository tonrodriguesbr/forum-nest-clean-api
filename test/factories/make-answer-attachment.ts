import { UniqueEntityId } from "@/core/entities/unique-entity-id";
import {
  AnswerAttachment,
  AnswerAttachmentProps,
} from "@/domain/forum/enterprise/entities/answer-attachment";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

export function makeAnswerAttachment(
  override: Partial<AnswerAttachmentProps> = {},
  id?: UniqueEntityId
) {
  const attachment = AnswerAttachment.create(
    {
      answerId: new UniqueEntityId(),
      attachmentId: new UniqueEntityId(),
      ...override,
    },
    id
  );

  return attachment;
}

@Injectable()
export class AnswerAttachmentFactory {
  constructor(private prisma: PrismaService) {}
  async makePrismaAnswerAttachment(
    data: Partial<AnswerAttachmentProps> = {}
  ): Promise<AnswerAttachment> {
    const answerAttachment = makeAnswerAttachment(data);

    console.log(answerAttachment);

    const attachament = await this.prisma.attachment.findFirst({
      where: {
        id: answerAttachment.attachmentId.toString(),
      },
    });

    console.log(attachament);

    await this.prisma.attachment.update({
      where: {
        id: answerAttachment.attachmentId.toString(),
      },
      data: {
        answerId: answerAttachment.answerId.toString(),
      },
    });

    return answerAttachment;
  }
}
