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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);




//Autenticación de login
app.post('/login', (req, res) => { 
    var username = req.body.user 
    var password = req.body.password

    //Se hace la consulta a la bd
    /*
    HACE FALTA LA OCNSULTA AL SERVIDOR
    */

    if ((!(username === 'oscar' && password === '1234'))) {   
        res.status(401).send({     
            error: 'usuario o contraseña inválidos'   
        }) 
        return  
    } 
    var tokenData = {   
        username: username    // Los datos de el usuario
             
    }
    var token = jwt.sign(tokenData, 'SECRET', {    
        expiresIn: 60 * 60 * .1 // expires in 24 hours
             
    }) 
    res.send({   
        token 
    })
})



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