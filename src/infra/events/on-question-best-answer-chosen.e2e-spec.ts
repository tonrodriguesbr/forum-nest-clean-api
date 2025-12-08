import request from "supertest";

import { AppModule } from "@/infra/app.module";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { StudentFactory } from "test/factories/make-student";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { AnswerFactory } from "test/factories/make-answer";
import { QuestionFactory } from "test/factories/make-question";
import { waitFor } from "test/utils/wait-for";
import { DomainEvents } from "@/core/events/domain-events";

describe("On question best answer chosen (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let studentFactory: StudentFactory;
  let questionFactory: QuestionFactory;
  let answerFactory: AnswerFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory, AnswerFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    studentFactory = moduleRef.get(StudentFactory);
    questionFactory = moduleRef.get(QuestionFactory);
    answerFactory = moduleRef.get(AnswerFactory);

    DomainEvents.shouldRun = true;

    await app.init();
  });

  it("Should send a notification when a question's best answer is chosen", async () => {
    const author = await studentFactory.makePrismaStudent();

    const accessToken = jwt.sign({ sub: author.id.toString() });

    const question = await questionFactory.makePrismaQuestion({
      authorId: author.id,
    });

    const answer = await answerFactory.makePrismaAnswer({
      authorId: author.id,
      questionId: question.id,
    });

    const answerId = answer.id.toString();

    const response = await request(app.getHttpServer())
      .patch(`/answers/${answerId}/choose-as-best`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send();

    await waitFor(async () => {
      const notifications = await prisma.notification.findFirst({
        where: {
          recipientId: author.id.toString(),
        },
      });

      expect(notifications).not.toBeNull();
    });
  });
});
