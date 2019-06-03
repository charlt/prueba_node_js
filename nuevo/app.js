var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var bodyParser = require("body-parser");
const pool = require('./database/db');
var app = express();
var router = express.Router();
var passport = require("passport");
var passportJWT = require("passport-jwt");
var fileUpload = require('express-fileupload')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use('/', indexRouter);
app.use('/users', usersRouter);






//Autenticación de login
app.post('/login', (req, res) => { 
    var username = req.body.user 
    var password = req.body.password
    let check = new Promise(function(resolve, reject) {
        pool.query('SELECT * FROM usuario WHERE username = ? and passw= ?', [username, password], function(err, rows, fields) {
            // reject para errores
            // resolve se hizo bien la transaccion con resultados
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
    check.then(row => {

        if (row.length > 0) {  
            var tokenData = {   
                username: row[0]['username'] // Los datos de el usuario        
            }
            var token = jwt.sign(tokenData, 'SECRET', {    
                expiresIn: 60 * 60 * .1 // expira en 8 hrs
            }) 
            res.status(200).send({ message: "ok", token: token })
        } else {
            res.status(401).send({     
                error: 'usuario o contraseña inválidos'   
            }) 
            return 
        }   
    })
});


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;