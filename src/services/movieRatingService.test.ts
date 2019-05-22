import {describe} from 'mocha';
import * as sinon from 'sinon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as chaiWithSinon from 'sinon-chai';
import {MongoService} from './mongoService';
import {MovieAnswerSubmit} from '../models/answer';
import {MovieRatingService} from './movieRatingService';

before(() => {
    chai.should();
    chai.use(chaiAsPromised);
    chai.use(chaiWithSinon);
});

describe('isAnswerFinal test', function() {
    let mongoService: any;
    let ratingService;

    beforeEach(function () {
        mongoService = sinon.createStubInstance(MongoService);
        ratingService = new MovieRatingService(mongoService);

        mongoService.getAllQuestions.returns([
            {
                '_id': '5a44721a8f8d20aa9c3cac59'
            },
            {
                '_id': '5a4472348f8d20aa9c3cac60'
            },
            {
                '_id': '5a4472478f8d20aa9c3cac66'
            },
            {
                '_id': '5a4472578f8d20aa9c3cac6c'
            },
            {
                '_id': '5a4472698f8d20aa9c3cac71'
            }
        ]);
    });

    it('should returns false if there is not any answers', function() {

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 0,
            movieId: 123,
            questionId: 'fakeQuestion1'
        };

        const stubUserId = 'fakeUserId';

        mongoService.getAnswersForMovieForSpecificUser.returns([]);

        const result = ratingService.isAnswerFinal(stubMovieAnswerSubmit, stubUserId);

        return result.should.eventually.be.equal(false);
    });

    it('should return false if two items less then max possible value', function() {

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 0,
            movieId: 123,
            questionId: 'fakeQuestion4'
        };

        const stubUserId = 'fakeUserId';

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 0,
                'questionId': 'fakeQuestion1'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion2'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion3'
            }
        ]);

        const result = ratingService.isAnswerFinal(stubMovieAnswerSubmit, stubUserId);

        return result.should.eventually.be.equal(false);
    });

    it('should return false if one item less then max possible and the question already answered', function() {
        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 0,
            movieId: 123,
            questionId: 'fakeQuestion1'
        };

        const stubUserId = 'fakeUserId';

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 0,
                'questionId': 'fakeQuestion1'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion2'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion3'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion4'
            },
        ]);

        const result = ratingService.isAnswerFinal(stubMovieAnswerSubmit, stubUserId);

        return result.should.eventually.be.equal(false);
    });

    it('should return true if one item less then max possible', function() {
        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 0,
            movieId: 123,
            questionId: 'fakeQuestion5'
        };

        const stubUserId = 'fakeUserId';

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 0,
                'questionId': 'fakeQuestion1'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion2'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion3'
            },
            {
                'answer': 0,
                'questionId': 'fakeQuestion4'
            }
        ]);

        const result = ratingService.isAnswerFinal(stubMovieAnswerSubmit, stubUserId);

        return result.should.eventually.be.equal(true);
    });
});

describe('processAnswer test', function () {
    let mongoService;
    let ratingService;

    beforeEach(function () {
        mongoService = sinon.createStubInstance(MongoService);
        ratingService = new MovieRatingService(mongoService);

        mongoService.getAllQuestions.returns([
            {
                '_id' : '5a44721a8f8d20aa9c3cac59',
                'header' : 'HEADER 1',
                'helptext' : 'help text 1',
                'options' : [
                    { 'answer' : 'Yes', 'points' : 0 },
                    { 'answer' : 'No', 'points' : 10 },
                    { 'answer' : 'No main characters of color', 'points' : 3 }
                ],
                'question' : 'question 2',
                'weight' : 100
            },
            {
                '_id' : '5a4472348f8d20aa9c3cac60',
                'header' : 'HEADER 2',
                'helptext' : 'help text 2',
                'options' : [
                    { 'answer' : 'Yes', 'points' : 0 },
                    { 'answer' : 'No', 'points' : 10 },
                    { 'answer' : 'No main characters of color', 'points' : 3 }
                ],
                'question' : 'question 2',
                'weight' : 100
            },
            {
                '_id' : '5a4472478f8d20aa9c3cac66',
                'header' : 'HEADER 3',
                'helptext' : 'help text 3',
                'options' : [
                    { 'answer' : 'Yes', 'points' : 0 },
                    { 'answer' : 'No', 'points' : 10 },
                    { 'answer' : 'No main characters of color', 'points' : 3 }
                ],
                'question' : 'question 3',
                'weight' : 100
            },
            {
                '_id' : '5a4472578f8d20aa9c3cac6c',
                'header' : 'HEADER 4',
                'helptext' : 'help text 4',
                'options' : [
                    { 'answer' : 'Yes', 'points' : 0 },
                    { 'answer' : 'No', 'points' : 10 },
                    { 'answer' : 'No main characters of color', 'points' : 3 }
                ],
                'question' : 'question 4',
                'weight' : 100
            },
            {
                '_id' : '5a4472698f8d20aa9c3cac71',
                'header' : 'HEADER 5',
                'helptext' : 'help text 5',
                'options' : [
                    { 'answer' : 'Yes', 'points' : 0 },
                    { 'answer' : 'No', 'points' : 10 },
                    { 'answer' : 'No main characters of color', 'points' : 3 }
                ],
                'question' : 'question 5',
                'weight' : 100
            }
        ]);
    });

    it('should return TEST_STARTED when user answers first question', function() {
        const expectedResult = {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'TEST_STARTED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 0,
            movieId: 123,
            questionId: '5a4472578f8d20aa9c3cac6c'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAnswersForMovieForSpecificUser.returns([]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should return ANSWER_ACCEPTED when user answers nether first nor last question', function () {
        const expectedResult = {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'ANSWER_ACCEPTED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 123,
            questionId: '5a4472578f8d20aa9c3cac6c'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 2,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 3,
                'questionId': '5a4472478f8d20aa9c3cac66'
            }
        ]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should return ANSWER_ACCEPTED when user updates existing answer but the test has not been finished yet', function() {
        const expectedResult = {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'ANSWER_ACCEPTED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 2,
            movieId: 123,
            questionId: '5a4472348f8d20aa9c3cac60'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 0,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 2,
                'questionId': '5a4472478f8d20aa9c3cac66'
            }
        ]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should return TEST_COMPLETED and correct score when user answers last question', function() {
        const expectedResult = {
            newMeanRating: 'A',
            newUsersRating: 'A',
            result: 'TEST_COMPLETED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 123,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAllRatingsForMovie.returns([]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should return ATTEMPT_TO_RETAKE_TEST if all questions have been answered already', function() {
        const expectedResult = {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'ATTEMPT_TO_RETAKE_TEST'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 3,
            movieId: 123,
            questionId: '5a4472578f8d20aa9c3cac6c'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 2,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 3,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            },
            {
                'answer': 3,
                'questionId': '5a4472698f8d20aa9c3cac71'
            }
        ]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should return INVALID_ANSWER if answer our of range', function() {
        const expectedResult = {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'INVALID_ANSWER'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 3,
            movieId: 123,
            questionId: '5a4472578f8d20aa9c3cac6c'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAnswersForMovieForSpecificUser.returns([]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should return INVALID_ANSWER if question id is not found', function() {
        const expectedResult = {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'INVALID_ANSWER'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 0,
            movieId: 123,
            questionId: 'unrealId'
        };

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        mongoService.getAnswersForMovieForSpecificUser.returns([]);

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should calculate new rating based on rawArgs if available, ignoring answers and previous ratings', function() {
        const expectedResult = {
            newMeanRating: 'A',
            newUsersRating: 'A',
            result: 'TEST_COMPLETED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([
            {
                '_id' : '5a7bc129ecba0567f4985d3d',
                'answers' : [
                    {
                        'answer' : 0,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 1000,
                        '5a4472348f8d20aa9c3cac60': 1000,
                        '5a4472478f8d20aa9c3cac66': 1000,
                        '5a4472578f8d20aa9c3cac6c': 1000,
                        '5a4472698f8d20aa9c3cac71': 1000
                    },
                    'total': 100
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b9',
                'userName' : 'User1',
                'usersRating' : 'C'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d3e',
                'answers' : [
                    {
                        'answer' : 0,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 990,
                        '5a4472348f8d20aa9c3cac60': 990,
                        '5a4472478f8d20aa9c3cac66': 990,
                        '5a4472578f8d20aa9c3cac6c': 990,
                        '5a4472698f8d20aa9c3cac71': 990
                    },
                    'total': 99
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b1',
                'userName' : 'User2',
                'usersRating' : 'C'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d3f',
                'answers' : [
                    {
                        'answer' : 0,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 980,
                        '5a4472348f8d20aa9c3cac60': 980,
                        '5a4472478f8d20aa9c3cac66': 980,
                        '5a4472578f8d20aa9c3cac6c': 980,
                        '5a4472698f8d20aa9c3cac71': 980
                    },
                    'total': 98
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b0',
                'userName' : 'User3',
                'usersRating' : 'C'
            }
        ]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should calculate new rating based on sum of previous ratings if there are multiple options' , function() {
        const expectedResult = {
            newMeanRating: 'B',
            newUsersRating: 'A',
            result: 'TEST_COMPLETED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([
            {
                '_id' : '5a7bc129ecba0567f4985d3f',
                'answers' : [
                    {
                        'answer' : 0,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 0,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 10,
                        '5a4472348f8d20aa9c3cac60': 10,
                        '5a4472478f8d20aa9c3cac66': 10,
                        '5a4472578f8d20aa9c3cac6c': 10,
                        '5a4472698f8d20aa9c3cac71': 10
                    },
                    'total': 2
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b0',
                'userName' : 'User3',
                'usersRating' : 'C'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d3e',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 20,
                        '5a4472348f8d20aa9c3cac60': 20,
                        '5a4472478f8d20aa9c3cac66': 20,
                        '5a4472578f8d20aa9c3cac6c': 20,
                        '5a4472698f8d20aa9c3cac71': 20
                    },
                    'total': 2
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b1',
                'userName' : 'User2',
                'usersRating' : 'C'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d3d',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 10,
                        '5a4472348f8d20aa9c3cac60': 10,
                        '5a4472478f8d20aa9c3cac66': 10,
                        '5a4472578f8d20aa9c3cac6c': 10,
                        '5a4472698f8d20aa9c3cac71': 10
                    },
                    'total': 1
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b9',
                'userName' : 'User1',
                'usersRating' : 'C'
            }
        ]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should calculate using all previous ratings when rawArgs field is not there', function() {
        const expectedResult = {
            newMeanRating: 'A',
            newUsersRating: 'A',
            result: 'TEST_COMPLETED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([
            {
                '_id' : '5a7bc129ecba0567f4985d3d',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b9',
                'userName' : 'User1',
                'usersRating' : 'C'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d3e',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b1',
                'userName' : 'User2',
                'usersRating' : 'C'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d3f',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b0',
                'userName' : 'User3',
                'usersRating' : 'C'
            }
        ]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should calculate without any changes in result if new question was added', function() {
        const expectedResult = {
            newMeanRating: 'A',
            newUsersRating: 'A',
            result: 'TEST_COMPLETED'
        };

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([
            {
                '_id' : '5a7bc129ecba0567f4985d3d',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 30,
                        '5a4472348f8d20aa9c3cac60': 30,
                        '5a4472478f8d20aa9c3cac66': 30,
                        '5a4472578f8d20aa9c3cac6c': 30
                    },
                    'total': 3
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : '5a4472eab864ed0010fd99b9',
                'userName' : 'User1',
                'usersRating' : 'A'
            }
        ]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId';
        const stubShortName = 'User T.';

        const result = ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        return result.should.eventually.be.deep.equal(expectedResult);
    });

    it('should save correct rawArgs when test successfully finished and calculated', async function() {
        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([{
            '_id' : '5a7bc129ecba0567f4985d3d',
            'answers' : [
                {
                    'answer' : 1,
                    'questionId' : '5a44721a8f8d20aa9c3cac59'
                },
                {
                    'answer' : 1,
                    'questionId' : '5a4472348f8d20aa9c3cac60'
                },
                {
                    'answer' : 1,
                    'questionId' : '5a4472478f8d20aa9c3cac66'
                },
                {
                    'answer' : 1,
                    'questionId' : '5a4472578f8d20aa9c3cac6c'
                },
                {
                    'answer' : 1,
                    'questionId' : '5a4472698f8d20aa9c3cac71'
                }
            ],
            'rawArgs': {
                'sumScoreByQuestion': {
                    '5a44721a8f8d20aa9c3cac59': 30,
                    '5a4472348f8d20aa9c3cac60': 30,
                    '5a4472478f8d20aa9c3cac66': 30,
                    '5a4472578f8d20aa9c3cac6c': 30,
                    '5a4472698f8d20aa9c3cac71': 30
                },
                'total': 3
            },
            'review' : 'Just a test',
            'subjectId' : 'm336843',
            'userId' : '5a4472eab864ed0010fd99b9',
            'userName' : 'User1',
            'usersRating' : 'A'
        }]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId1';
        const stubShortName = 'User T.1';

        await ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        const expectedRating = {
            answers: [
                {
                    'answer': 1,
                    'questionId': '5a44721a8f8d20aa9c3cac59'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472348f8d20aa9c3cac60'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472478f8d20aa9c3cac66'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472578f8d20aa9c3cac6c'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472698f8d20aa9c3cac71'
                }
            ],
            rawArgs: {
                sumScoreByQuestion: {
                    '5a44721a8f8d20aa9c3cac59': 40,
                    '5a4472348f8d20aa9c3cac60': 40,
                    '5a4472478f8d20aa9c3cac66': 40,
                    '5a4472578f8d20aa9c3cac6c': 40,
                    '5a4472698f8d20aa9c3cac71': 40,
                },
                'total': 4
            },
            review: '',
            subjectId: 'm336843',
            userId: stubUserId,
            userName: stubShortName,
            usersRating: 'A'
        };

        return mongoService.createOrUpdateRating.should.have.been.calledWith(expectedRating);
    });

    it('should handle list of ratings', async function () {

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([
            {
                '_id' : '5a7bc129ecba0567f4985d33',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 50,
                        '5a4472348f8d20aa9c3cac60': 50,
                        '5a4472478f8d20aa9c3cac66': 50,
                        '5a4472578f8d20aa9c3cac6c': 50,
                        '5a4472698f8d20aa9c3cac71': 50
                    },
                    'total': 5
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : 'fakeUserId',
                'userName' : 'User T.',
                'usersRating' : 'A'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d32',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 40,
                        '5a4472348f8d20aa9c3cac60': 40,
                        '5a4472478f8d20aa9c3cac66': 40,
                        '5a4472578f8d20aa9c3cac6c': 40,
                        '5a4472698f8d20aa9c3cac71': 40
                    },
                    'total': 4
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : 'fakeUserId',
                'userName' : 'User T.',
                'usersRating' : 'A'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d31',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 30,
                        '5a4472348f8d20aa9c3cac60': 30,
                        '5a4472478f8d20aa9c3cac66': 30,
                        '5a4472578f8d20aa9c3cac6c': 30,
                        '5a4472698f8d20aa9c3cac71': 30
                    },
                    'total': 3
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : 'fakeUserId',
                'userName' : 'User T.',
                'usersRating' : 'A'
            }
        ]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId2';
        const stubShortName = 'User T.2';

        await ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        const expectedRating = {
            answers: [
                {
                    'answer': 1,
                    'questionId': '5a44721a8f8d20aa9c3cac59'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472348f8d20aa9c3cac60'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472478f8d20aa9c3cac66'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472578f8d20aa9c3cac6c'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472698f8d20aa9c3cac71'
                }
            ],
            rawArgs: {
                sumScoreByQuestion: {
                    '5a44721a8f8d20aa9c3cac59': 60,
                    '5a4472348f8d20aa9c3cac60': 60,
                    '5a4472478f8d20aa9c3cac66': 60,
                    '5a4472578f8d20aa9c3cac6c': 60,
                    '5a4472698f8d20aa9c3cac71': 60,
                },
                'total': 6
            },
            review: '',
            subjectId: 'm336843',
            userId: stubUserId,
            userName: stubShortName,
            usersRating: 'A'
        };

        return mongoService.createOrUpdateRating.should.have.been.calledWith(expectedRating);
    });

    it('should sum list of ratings if total is the same everywhere', async function () {

        const stubMovieAnswerSubmit: MovieAnswerSubmit = {
            answer: 1,
            movieId: 336843,
            questionId: '5a4472698f8d20aa9c3cac71'
        };

        mongoService.getAllRatingsForMovie.returns([
            {
                '_id' : '5a7bc129ecba0567f4985d33',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 50,
                        '5a4472348f8d20aa9c3cac60': 50,
                        '5a4472478f8d20aa9c3cac66': 50,
                        '5a4472578f8d20aa9c3cac6c': 50,
                        '5a4472698f8d20aa9c3cac71': 50
                    },
                    'total': 3
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : 'fakeUserId',
                'userName' : 'User T.',
                'usersRating' : 'A'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d32',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 40,
                        '5a4472348f8d20aa9c3cac60': 40,
                        '5a4472478f8d20aa9c3cac66': 40,
                        '5a4472578f8d20aa9c3cac6c': 40,
                        '5a4472698f8d20aa9c3cac71': 40
                    },
                    'total': 3
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : 'fakeUserId',
                'userName' : 'User T.',
                'usersRating' : 'A'
            },
            {
                '_id' : '5a7bc129ecba0567f4985d31',
                'answers' : [
                    {
                        'answer' : 1,
                        'questionId' : '5a44721a8f8d20aa9c3cac59'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472348f8d20aa9c3cac60'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472478f8d20aa9c3cac66'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472578f8d20aa9c3cac6c'
                    },
                    {
                        'answer' : 1,
                        'questionId' : '5a4472698f8d20aa9c3cac71'
                    }
                ],
                'rawArgs': {
                    'sumScoreByQuestion': {
                        '5a44721a8f8d20aa9c3cac59': 30,
                        '5a4472348f8d20aa9c3cac60': 30,
                        '5a4472478f8d20aa9c3cac66': 30,
                        '5a4472578f8d20aa9c3cac6c': 30,
                        '5a4472698f8d20aa9c3cac71': 30
                    },
                    'total': 3
                },
                'review' : 'Just a test',
                'subjectId' : 'm336843',
                'userId' : 'fakeUserId',
                'userName' : 'User T.',
                'usersRating' : 'A'
            }
        ]);

        mongoService.getAnswersForMovieForSpecificUser.returns([
            {
                'answer': 1,
                'questionId': '5a44721a8f8d20aa9c3cac59'
            },
            {
                'answer': 1,
                'questionId': '5a4472348f8d20aa9c3cac60'
            },
            {
                'answer': 1,
                'questionId': '5a4472478f8d20aa9c3cac66'
            },
            {
                'answer': 1,
                'questionId': '5a4472578f8d20aa9c3cac6c'
            }
        ]);

        const stubUserId = 'fakeUserId2';
        const stubShortName = 'User T.2';

        await ratingService.processAnswer(stubMovieAnswerSubmit, stubUserId, stubShortName);

        const expectedRating = {
            answers: [
                {
                    'answer': 1,
                    'questionId': '5a44721a8f8d20aa9c3cac59'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472348f8d20aa9c3cac60'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472478f8d20aa9c3cac66'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472578f8d20aa9c3cac6c'
                },
                {
                    'answer': 1,
                    'questionId': '5a4472698f8d20aa9c3cac71'
                }
            ],
            rawArgs: {
                sumScoreByQuestion: {
                    '5a44721a8f8d20aa9c3cac59': 60,
                    '5a4472348f8d20aa9c3cac60': 60,
                    '5a4472478f8d20aa9c3cac66': 60,
                    '5a4472578f8d20aa9c3cac6c': 60,
                    '5a4472698f8d20aa9c3cac71': 60,
                },
                'total': 6
            },
            review: '',
            subjectId: 'm336843',
            userId: stubUserId,
            userName: stubShortName,
            usersRating: 'A'
        };

        return mongoService.createOrUpdateRating.should.have.been.calledWith(expectedRating);
    });
});
