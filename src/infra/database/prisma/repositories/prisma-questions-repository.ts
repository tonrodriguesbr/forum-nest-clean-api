import { Injectable } from "@nestjs/common";

import { PaginationParams } from "@/core/repositories/pagination-params";
import { QuestionsRepository } from "@/domain/forum/application/repositories/questions-repository";
import { Question } from "@/domain/forum/enterprise/entities/question";
import { PrismaService } from "../prisma.service";
import { PrismaQuestionMapper } from "../mappers/prisma-question-mapper";
import { QuestionAttachmentsRepository } from "@/domain/forum/application/repositories/question-attachments-repository";
import { QuestionDetails } from "@/domain/forum/enterprise/entities/value-objects/question-details";
import { PrismaQuestionDetailsMapper } from "../mappers/prisma-question-details-mapper";
import { DomainEvents } from "@/core/events/domain-events";
import { CacheRepository } from "@/infra/cache/cache-repository";

@Injectable()
export class PrismaQuestionsRepository implements QuestionsRepository {
  constructor(
    private prismaService: PrismaService,
    private cacheRepository: CacheRepository,
    private questionAttachmentsRepository: QuestionAttachmentsRepository
  ) {}

  async create(question: Question) {
    const raw = PrismaQuestionMapper.toPrisma(question);
    await this.prismaService.question.create({
      data: raw,
    });

    await this.questionAttachmentsRepository.createMany(
      question.attachments.getItems()
    );

    DomainEvents.dispatchEventsForAggregate(question.id);
  }

  async save(question: Question) {
    const raw = PrismaQuestionMapper.toPrisma(question);

    await Promise.all([
      this.prismaService.question.update({
        where: {
          id: raw.id,
        },
        data: raw,
      }),

      this.questionAttachmentsRepository.createMany(
        question.attachments.getNewItems()
      ),

      this.questionAttachmentsRepository.deleteMany(
        question.attachments.getRemovedItems()
      ),
    ]);

    await this.cacheRepository.delete(
      `question:${question.slug.value}:details`
    );

    DomainEvents.dispatchEventsForAggregate(question.id);
  }

  async findBySlug(slug: string): Promise<Question | null> {
    const question = await this.prismaService.question.findUnique({
      where: {
        slug,
      },
    });

    if (!question) {
      return null;
    }

    return PrismaQuestionMapper.toDomain(question);
  }

  async findDetailsBySlug(slug: string): Promise<QuestionDetails | null> {
    const cachedQuestion = await this.cacheRepository.get(
      `question:${slug}:details`
    );

    if (cachedQuestion) {
      return PrismaQuestionDetailsMapper.toDomain(JSON.parse(cachedQuestion));
    }

    const question = await this.prismaService.question.findUnique({
      where: {
        slug,
      },
      include: {
        author: true,
        attachments: true,
      },
    });

    if (!question) {
      return null;
    }
    await this.cacheRepository.set(
      `question:${slug}:details`,
      JSON.stringify(question)
    );

    const questionDetails = PrismaQuestionDetailsMapper.toDomain(question);

    return questionDetails;
  }

  async findManyRecent(params: PaginationParams): Promise<Question[]> {
    const questions = await this.prismaService.question.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      skip: (params.page - 1) * 20,
    });

    return questions.map(PrismaQuestionMapper.toDomain);
  }

  async findById(questionId: string): Promise<Question | null> {
    const question = await this.prismaService.question.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      return null;
    }

    return PrismaQuestionMapper.toDomain(question);
  }

  async delete(question: Question) {
    const raw = PrismaQuestionMapper.toPrisma(question);
    await this.prismaService.question.delete({
      where: {
        id: raw.id,
      },
    });
  }
}
