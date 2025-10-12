import {
  Controller,
  BadRequestException,
  Post,
  Param,
  Body,
} from "@nestjs/common";
import { AnswerQuestionUseCase } from "@/domain/forum/application/use-cases/answer-question";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { z } from "zod";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";

const answerQuestionBodySchema = z.object({
  content: z.string(),
  attachments: z.array(z.string().uuid()),
});

type AnswerQuestionBodySchema = z.infer<typeof answerQuestionBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(answerQuestionBodySchema);

@Controller("/questions/:questionId/answers")
export class AnswerQuestionController {
  constructor(private answerQuestion: AnswerQuestionUseCase) {}

  @Post()
  async execute(
    @Body(bodyValidationPipe) body: AnswerQuestionBodySchema,
    @Param("questionId") questionId: string,
    @CurrentUser() user: UserPayload
  ) {
    const { content, attachments } = answerQuestionBodySchema.parse(body);

    const authorId = user.sub;

    const result = await this.answerQuestion.execute({
      authorId,
      questionId,
      content,
      attachmentsIds: attachments,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
