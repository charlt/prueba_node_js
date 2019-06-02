var express = require('express');
var router = express.Router();
const pool = require('../database/db');

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
    getAllUsers(req.query.filtro, req.query.orden).then(function(rows) {
        res.status(200).jsonp(rows);
    }).catch((err) => setImmediate(() => {
        res.status(404).jsonp({
            error: 'Existe un error en la consulta : (' + err + ")"
        })
    }));
});

module.exports = router;