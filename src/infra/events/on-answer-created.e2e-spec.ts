import request from "supertest";

import { AppModule } from "@/infra/app.module";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { StudentFactory } from "test/factories/make-student";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { QuestionFactory } from "test/factories/make-question";
import { waitFor } from "test/utils/wait-for";
import { DomainEvents } from "@/core/events/domain-events";

describe("On answer created (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let studentFactory: StudentFactory;
  let questionFactory: QuestionFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    studentFactory = moduleRef.get(StudentFactory);
    questionFactory = moduleRef.get(QuestionFactory);

    DomainEvents.shouldRun = true;

    await app.init();
  });

  it("should be able to send a notification when an answer is created", async () => {
    const user = await studentFactory.makePrismaStudent();

    const accessToken = jwt.sign({ sub: user.id.toString() });

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    });

    const questionId = question.id.toString();

    await request(app.getHttpServer())
      .post(`/questions/${questionId}/answers`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Question answer content",
        attachments: [],
      });

    await waitFor(async () => {
      const notifications = await prisma.notification.findFirst({
        where: {
          recipientId: user.id.toString(),
        },
      });

      expect(notifications).not.toBeNull();
    });
  });
});
