export interface QuestionOptions {
    answer: string;
    points?: number;
}

export interface Question {
    _id: string;
    header: string;
    question: string;
    helptext: string;
    weight: number;
    options: QuestionOptions[];
}

export interface QuestionCreateUpdate {
    header: string;
    question: string;
    helptext: string;
    weight: number;
    options: QuestionOptions[];
}
