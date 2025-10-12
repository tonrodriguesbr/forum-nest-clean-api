import request from "supertest";

import { AppModule } from "@/infra/app.module";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { StudentFactory } from "test/factories/make-student";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { QuestionFactory } from "test/factories/make-question";
import { AttachmentFactory } from "test/factories/make-attachment";
import { AnswerAttachmentFactory } from "test/factories/make-answer-attachment";

describe("Answer question (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let studentFactory: StudentFactory;
  let questionFactory: QuestionFactory;
  let attachmentFactory: AttachmentFactory;
  let answerAttachmentFactory: AnswerAttachmentFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AttachmentFactory,
        AnswerAttachmentFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    studentFactory = moduleRef.get(StudentFactory);
    questionFactory = moduleRef.get(QuestionFactory);
    attachmentFactory = moduleRef.get(AttachmentFactory);
    answerAttachmentFactory = moduleRef.get(AnswerAttachmentFactory);

    await app.init();
  });

  test("[POST] /questions/:questionId/answers", async () => {
    const user = await studentFactory.makePrismaStudent();
    const attachment1 = await attachmentFactory.makePrismaAttachment();
    const attachment2 = await attachmentFactory.makePrismaAttachment();

    const accessToken = jwt.sign({ sub: user.id.toString() });

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    });

    const questionId = question.id.toString();

    const response = await request(app.getHttpServer())
      .post(`/questions/${questionId}/answers`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Question answer content",
        attachments: [attachment1.id.toString(), attachment2.id.toString()],
      });

    expect(response.statusCode).toBe(201);

    const answerQuestionOnDatabase = await prisma.answer.findFirst({
      where: {
        content: "Question answer content",
      },
    });

    expect(answerQuestionOnDatabase).toBeTruthy();

    const answerAttachmentsOnDatabase = await prisma.attachment.findMany({
      where: {
        answerId: answerQuestionOnDatabase?.id,
      },
    });

    expect(answerAttachmentsOnDatabase).toHaveLength(2);
    expect(answerAttachmentsOnDatabase).toEqual([
      expect.objectContaining({
        id: attachment1.id.toString(),
      }),
      expect.objectContaining({
        id: attachment2.id.toString(),
      }),
    ]);
  });
});
