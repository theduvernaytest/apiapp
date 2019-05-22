import {Route, Get, Post, Delete, Patch, Body, Security} from 'tsoa';
import {Question, QuestionCreateUpdate} from '../models/question';
import {provideSingleton} from '../inversify/ioc';
import {inject} from 'inversify';
import {MongoService} from '../services/mongoService';

@Route('Questions')
@provideSingleton(QuestionsController)
export class QuestionsController {
    constructor(@inject(MongoService) private mongoService: MongoService) { }

    /** Get all questions */
    @Security('jwt', ['User'])
    @Get('')
    public async Get(): Promise<Question[]> {
        return this.mongoService.getAllQuestions();
    }

    /**
     * Create a question
     */
    @Security('jwt', ['Admin'])
    @Post()
    public async Create(@Body() request: QuestionCreateUpdate): Promise<Question> {
        return this.mongoService.createQuestion(request);
    }

    /** Delete question */
    @Security('jwt', ['Admin'])
    @Delete('{questionId}')
    public async Delete(questionId: string): Promise<void> {
        return this.mongoService.deleteQuestion(questionId);
    }

    /** Update a question */
    @Security('jwt', ['Admin'])
    @Patch('{questionId}')
    public async Update(@Body() request: QuestionCreateUpdate, questionId: string): Promise<Question> {
        return this.mongoService.updateQuestion(questionId, request);
    }
}
