import * as express from 'express';
import { json, urlencoded } from 'body-parser';
import * as path from 'path';
import * as compression from 'compression';
import * as cors from 'cors';

import { loginRouter } from './routes/login';
import { protectedRouter } from './routes/protected';
import { publicRouter } from './routes/public';
import { feedRouter } from './routes/feed';
import {studyEntityRouter} from './routes/study_entity';
import { userRouter } from './routes/user';
import * as models from './models';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import * as cookieParser from 'cookie-parser';
import * as expressSession from 'express-session';

const app: express.Application = express();

app.disable('x-powered-by');

app.use(cors());
app.use(compression());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(json());
app.use(expressSession({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user:{id}, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  models.User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function (email, password, done){
        models.User.findOne({'email': email})
        .exec((err, user) => {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, {message: 'Incorrect username.'});
            }
            if (password === user.password) {
                return done(null, user);
            } else {
                return done(null, false, {message: 'Incorrect password.'});
            }
        });
    }
));

app.post('/login/test', passport.authenticate('local',
    { failureRedirect: 'http://localhost:4200/#/auth',
      successRedirect: 'http://localhost:4200/#/profile'}));

// api routes
app.use('/api/secure', protectedRouter);
app.use('/api/login', loginRouter);
app.use('/api/public', publicRouter);
app.use('/api/feed', feedRouter);
app.use('/api/user', userRouter);
app.use('/api/study_entity', studyEntityRouter);

if (app.get('env') === 'production') {

  // in production mode run application from dist folder
  app.use(express.static(path.join(__dirname, '/../client')));
}

// catch 404 and forward to error handler
app.use(function(req: express.Request, res: express.Response, next) {
  let err = new Error('Not Found');
  next(err);
});

// production error handler
// no stacktrace leaked to user
app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {

  res.status(err.status || 500);
  res.json({
    error: {},
    message: err.message
  });
});

export { app }
