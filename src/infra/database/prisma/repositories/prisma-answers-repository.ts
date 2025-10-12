import { Injectable } from "@nestjs/common";

import { PaginationParams } from "@/core/repositories/pagination-params";
import { AnswersRepository } from "@/domain/forum/application/repositories/answers-repository";
import { Answer } from "@/domain/forum/enterprise/entities/answer";
import { PrismaAnswerMapper } from "../mappers/prisma-answer-mapper";
import { PrismaService } from "../prisma.service";
import { AnswerAttachmentsRepository } from "@/domain/forum/application/repositories/answer-attachments-repository";

@Injectable()
export class PrismaAnswersRepository implements AnswersRepository {
  constructor(
    private prismaService: PrismaService,
    private answerAttachmentsRepository: AnswerAttachmentsRepository
  ) {}

  async create(answer: Answer) {
    const raw = PrismaAnswerMapper.toPrisma(answer);
    await this.prismaService.answer.create({
      data: raw,
    });

    await this.answerAttachmentsRepository.createMany(
      answer.attachments.getItems()
    );
  }

  async save(answer: Answer) {
    const raw = PrismaAnswerMapper.toPrisma(answer);

    await Promise.all([
      await this.prismaService.answer.update({
        where: {
          id: raw.id,
        },
        data: raw,
      }),

      await this.answerAttachmentsRepository.createMany(
        answer.attachments.getNewItems()
      ),

      await this.answerAttachmentsRepository.deleteMany(
        answer.attachments.getRemovedItems()
      ),
    ]);
  }

  async findById(answerId: string) {
    const answer = await this.prismaService.answer.findUnique({
      where: {
        id: answerId,
      },
    });

    if (!answer) {
      return null;
    }

    return PrismaAnswerMapper.toDomain(answer);
  }

  async findManyByQuestionId(questionId: string, params: PaginationParams) {
    const answersByQuestion = await this.prismaService.answer.findMany({
      where: {
        questionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      skip: (params.page - 1) * 20,
    });

    return answersByQuestion.map(PrismaAnswerMapper.toDomain);
  }

  async delete(answer: Answer) {
    const raw = PrismaAnswerMapper.toPrisma(answer);
    await this.prismaService.answer.delete({
      where: {
        id: raw.id,
      },
    });
  }
}
