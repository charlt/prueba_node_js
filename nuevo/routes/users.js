var express = require('express');
var router = express.Router();
const pool = require('../database/db');
var jwt = require('jsonwebtoken')

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}




function verifica_token(req, res) {
    var token = req.headers['authorization']
    if (!token) {
        res.status(401).send({
            error: "Es necesario el token de autenticación"
        })
        return
    }
    token = token.replace('Bearer ', '')
    let verifica = new Promise(function(resolve, reject) {
        jwt.verify(token, 'SECRET', function(err, user) {
            if (err) {
                res.status(401).send({
                    error: err
                })
            } else {
                resolve(user);
            }
        })

    });
    return verifica
}

function getAllUsers(filtro, ordenamiento) {
    return new Promise(function(resolve, reject) {
        //The Promise constructor should catch any errors thrown on
        //this tick. Alternately, try/catch and reject(err) on catch.
        //alfa, edad, DESC, ASC, 
        let query_str = "";
        let orden = "asc"
        if (ordenamiento != undefined && ordenamiento != "") {
            orden = ordenamiento
        }
        if (filtro != undefined && filtro != "") {
            console.log('1')
            query_str = "SELECT * FROM USUARIO order by " + filtro + " " + orden;
        } else {
            query_str = "SELECT * FROM USUARIO ";
        }
        pool.query(query_str, function(err, rows, fields) {
            //Call reject on error states,
            //call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}
/* GET users listing. */
router.get('/', function(req, res, next) {

    verifica_token(req, res).then(user => {
        if (user) {
            //query or params GET
            getAllUsers(req.query.filtro, req.query.orden).then(function(rows) {
                res.status(200).jsonp(rows);
            }).catch((err) => setImmediate(() => {
                res.status(404).jsonp({
                    error: 'Existe un error en la consulta : (' + err + ")"
                })
            }));
        }
    })
});


router.post('/add', function(req, res, next) {
    let username = req.body.username
    let imagen = req.files.imagen
    console.log(imagen)
});

module.exports = router;