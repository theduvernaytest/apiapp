
import './controllers/authController';
import './controllers/questionsController';
import './controllers/moviesController';
import './controllers/showsController';
import './controllers/answersController';
import './controllers/newsController';
import './controllers/searchController';
import './controllers/contactusController';
import './controllers/subscribeController';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as methodOverride from 'method-override';
import { RegisterRoutes } from './routes';

const app = express();

app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

const compression = require('compression');
app.use(compression());

const swaggerDocument = require('./swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

RegisterRoutes(app);

/* tslint:disable-next-line */
console.log('Starting server on port 3000...');
app.listen(3000);
