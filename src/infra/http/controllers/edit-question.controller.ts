import {
  Controller,
  Body,
  BadRequestException,
  Put,
  HttpCode,
  Param,
} from "@nestjs/common";
import { ZodValidationPipe } from "@/infra/http/pipes/zod-validation-pipe";
import { CurrentUser } from "@/infra/auth/current-user-decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { EditQuestionUseCase } from "@/domain/forum/application/use-cases/edit-question";
import { z } from "zod";

const editQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
  attachments: z.array(z.string().uuid()),
});

type EditQuestionBodySchema = z.infer<typeof editQuestionBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(editQuestionBodySchema);

@Controller("/questions/:id")
export class EditQuestionController {
  constructor(private editQuestion: EditQuestionUseCase) {}

  @Put()
  @HttpCode(204)
  async execute(
    @Body(bodyValidationPipe) body: EditQuestionBodySchema,
    @Param("id") questionId: string,
    @CurrentUser() user: UserPayload
  ) {
    const { title, content, attachments } = editQuestionBodySchema.parse(body);

    const authorId = user.sub;

    const result = await this.editQuestion.execute({
      title,
      content,
      authorId,
      attachmentsIds: attachments,
      questionId,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
