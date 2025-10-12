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
import { AttachmentFactory } from "test/factories/make-attachment";
import { AnswerAttachmentFactory } from "test/factories/make-answer-attachment";

describe("Edit answer (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let studentFactory: StudentFactory;
  let questionFactory: QuestionFactory;
  let answerFactory: AnswerFactory;
  let attachmentFactory: AttachmentFactory;
  let answerAttachmentFactory: AnswerAttachmentFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AnswerFactory,
        AttachmentFactory,
        AnswerAttachmentFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    studentFactory = moduleRef.get(StudentFactory);
    questionFactory = moduleRef.get(QuestionFactory);
    answerFactory = moduleRef.get(AnswerFactory);
    attachmentFactory = moduleRef.get(AttachmentFactory);
    answerAttachmentFactory = moduleRef.get(AnswerAttachmentFactory);

    await app.init();
  });

  test("[PUT] /answers/:id", async () => {
    const questionAuthor = await studentFactory.makePrismaStudent();
    const answerAuthor = await studentFactory.makePrismaStudent();

    const accessToken = jwt.sign({ sub: answerAuthor.id.toString() });

    const question = await questionFactory.makePrismaQuestion({
      authorId: questionAuthor.id,
    });

    const answer = await answerFactory.makePrismaAnswer({
      authorId: answerAuthor.id,
      questionId: question.id,
    });
    const attachment1 = await attachmentFactory.makePrismaAttachment();
    const attachment2 = await attachmentFactory.makePrismaAttachment();

    await answerAttachmentFactory.makePrismaAnswerAttachment({
      attachmentId: attachment1.id,
      answerId: answer.id,
    });
    await answerAttachmentFactory.makePrismaAnswerAttachment({
      attachmentId: attachment2.id,
      answerId: answer.id,
    });

    const attachment3 = await attachmentFactory.makePrismaAttachment();

    const answerId = answer.id.toString();

    const response = await request(app.getHttpServer())
      .put(`/answers/${answerId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Edit answer content",
        attachments: [attachment1.id.toString(), attachment3.id.toString()],
      });

    expect(response.statusCode).toBe(204);

    const answerOnDatabase = await prisma.answer.findFirst({
      where: {
        content: "Edit answer content",
      },
    });

    expect(answerOnDatabase).toBeTruthy();

    const answerAttachmentsOnDatabase = await prisma.attachment.findMany({
      where: {
        answerId: answerOnDatabase?.id,
      },
    });

    expect(answerAttachmentsOnDatabase).toHaveLength(2);
    expect(answerAttachmentsOnDatabase).toEqual([
      expect.objectContaining({
        id: attachment1.id.toString(),
      }),
      expect.objectContaining({
        id: attachment3.id.toString(),
      }),
    ]);
  });
});
