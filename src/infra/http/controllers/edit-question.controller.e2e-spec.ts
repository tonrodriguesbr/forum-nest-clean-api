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
import { QuestionAttachmentFactory } from "test/factories/make-question-attachment";

describe("Edit question (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let studentFactory: StudentFactory;
  let questionFactory: QuestionFactory;
  let questionAttachmentFactory: QuestionAttachmentFactory;
  let attachmentFactory: AttachmentFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        QuestionAttachmentFactory,
        AttachmentFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    studentFactory = moduleRef.get(StudentFactory);
    questionFactory = moduleRef.get(QuestionFactory);
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory);
    attachmentFactory = moduleRef.get(AttachmentFactory);

    await app.init();
  });

  test("[PUT] /questions/:id", async () => {
    const user = await studentFactory.makePrismaStudent();

    const accessToken = jwt.sign({ sub: user.id.toString() });

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    });
    const attachment = await attachmentFactory.makePrismaAttachment();

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: question.id,
      attachmentId: attachment.id,
    });

    const attachment2 = await attachmentFactory.makePrismaAttachment();
    const attachment3 = await attachmentFactory.makePrismaAttachment();

    const questionId = question.id.toString();

    const response = await request(app.getHttpServer())
      .put(`/questions/${questionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New question created",
        content: "New content",
        attachments: [attachment2.id.toString(), attachment3.id.toString()],
      });

    expect(response.statusCode).toBe(204);

    const questionOnDatabase = await prisma.question.findFirst({
      where: {
        title: "New question created",
        content: "New content",
      },
    });

    expect(questionOnDatabase).toBeTruthy();

    const attachamentsOnDatabase = await prisma.attachment.findMany({
      where: {
        questionId: questionOnDatabase?.id,
      },
    });

    expect(attachamentsOnDatabase).toHaveLength(2);
    expect(attachamentsOnDatabase).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: attachment2.id.toString() }),
        expect.objectContaining({ id: attachment3.id.toString() }),
      ])
    );
  });
});
