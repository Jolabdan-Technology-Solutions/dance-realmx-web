export class CreateQuizOptionDto {
  text: string;
  is_correct?: boolean;
}

export class CreateQuizQuestionDto {
  text: string;
  options: CreateQuizOptionDto[];
  answer?: number; // Option index (0-based)
  order?: number;
}

export class CreateQuizDto {
  title: string;
  questions: CreateQuizQuestionDto[];
}
