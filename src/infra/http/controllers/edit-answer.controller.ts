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
import { EditAnswerUseCase } from "@/domain/forum/application/use-cases/edit-answer";
import { z } from "zod";

const editAnswerBodySchema = z.object({
  content: z.string(),
  attachments: z.array(z.string().uuid()),
});

type EditAnswerBodySchema = z.infer<typeof editAnswerBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(editAnswerBodySchema);

@Controller("/answers/:id")
export class EditAnswerController {
  constructor(private editAnswer: EditAnswerUseCase) {}

  @Put()
  @HttpCode(204)
  async execute(
    @Body(bodyValidationPipe) body: EditAnswerBodySchema,
    @Param("id") answerId: string,
    @CurrentUser() user: UserPayload
  ) {
    const { content, attachments } = editAnswerBodySchema.parse(body);

    const authorId = user.sub;

    const result = await this.editAnswer.execute({
      content,
      authorId,
      attachmentsIds: attachments,
      answerId,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
