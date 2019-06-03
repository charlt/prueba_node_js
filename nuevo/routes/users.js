const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function check_user(campo, dato) {
    let check = new Promise(function(resolve, reject) {
        pool.query('SELECT * FROM usuario WHERE ' + campo + ' =  "' + dato + '"', function(err, rows, fields) {
            //Call reject on error states,
            //call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
    return check
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

function findOneUser(username) {
    return new Promise(function(resolve, reject) {

        query_str = `SELECT * FROM USUARIO where username='${username}'`;
        console.log(query_str)
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



router.post('/add', function(req, res, next) {

    verifica_token(req, res).then(user => {
        if (user) {
            //Se verifica si existen las variables enviadas por el body
            if (req.body.username != null)
                var username = req.body.username
            if (req.body.edad != null)
                var edad = req.body.edad
            if (req.body.passw != null)
                var passw = req.body.passw
            if (req.body.nombre != null)
                var nombre = req.body.nombre
            if (req.body.email != null)
                var email = req.body.email
            if (req.files != null)
                var avatar = req.files.avatar

            if (req.body.rol != null)
                var rol = req.body.rol
            var nombre_avatar = "";
            if ((username != "" && username != undefined) && (edad != "" && edad != undefined) && (passw != "" && passw != undefined) &&
                (nombre != "" && nombre != undefined) && (email != "" && email != undefined)) {

                //se valida el username por medio de una función que busca en la bd
                check_user('username', username).then(user => {
                    if (user.length > 0) {
                        res.status(200).send({ "error": "El username registrado ya esta en uso" })

                    }
                })
                emailRegex = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;

                if (!emailRegex.test(email)) {
                    res.status(200).send({ "error": "Verifique el formato del email" })

                }
                // se valida el email por medio de funcion que checa en la bd
                check_user('email', email).then(user => {
                    if (user.length > 0) {
                        res.status(200).send({ "error": "El email registrado ya esta en uso" })

                    }
                })
                let regexp_password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{10,60}/;
                let vall_pass = regexp_password.test(passw);

                if (!vall_pass) {
                    res.status(200).send({ "error": "El password debe contener como mínimo 10 caracteres, 1 mayuscula, número y caracter especial, verifique de nuevo." })

                }
                //se verifica si se ha subido una imagen
                if (avatar != undefined) {
                    if (avatar != "") {
                        let ext_avatar = avatar.name;
                        ext_avatar = ext_avatar.split(".");
                        ext_avatar = ext_avatar.pop();
                        //se verifica la extención del avatar
                        if (ext_avatar == "jpg" || ext_avatar == "png") {
                            if (avatar.size > 2000000) {
                                console.log(avatar)
                                res.status(200).send({ "error": "El avatar  no puede excederse de 2 mb, verifique" })
                            } else {
                                nombre_avatar = username + makeid(10) + ext_avatar;
                                //Se sube la foto en una carpeta
                                avatar.mv(`./avatar/${nombre_avatar}`, err => {
                                    if (err) return res.status(500).send({ message: err })
                                })
                            }

                        } else {
                            res.status(200).send({ "error": "El avatar debe ser de tipo jpg o png, verifique" })

                        }
                    }
                } else {
                    //se copia una imagen de la carpeta avatar
                    nombre_avatar = username + makeid(10);
                    fs.copy('./avatar/default.jpg', './avatar/' + nombre_avatar + ".jpg")
                        .then(() => console.log('success!'))
                        .catch(err => console.error(err))
                }



                if (rol == "admin") {

                    insert = new Promise(function(resolve, reject) {
                        pool.query(`INSERT INTO usuario  VALUES (NULL, '${nombre}', '${edad}', '${username}', '${nombre_avatar}', '${email}', '${passw}', 'admin')`, function(err, rows, fields) {
                            // reject para errores
                            // resolve se hizo bien la transaccion con resultados
                            if (err) {
                                return reject(err);
                            }
                            resolve(rows);
                        });
                    });
                } else {
                    insert = new Promise(function(resolve, reject) {
                        pool.query(`INSERT INTO usuario VALUES (NULL, '${nombre}', '${edad}', '${username}', '${nombre_avatar}', '${email}', '${passw}', 'admin')`, function(err, rows, fields) {
                            // reject para errores
                            // resolve se hizo bien la transaccion con resultados
                            if (err) {
                                return reject(err);
                            }
                            resolve(rows);
                        });
                    });
                }
                insert.then(user => {
                    res.status(200).send({ "ok": "El usuario se registro correctamente" })

                })
            } else {
                res.status(200).send({ "error": "Registre la información necesaria" })
            }
        }
    })


});

/* GET users listing. */
router.get('/:username', function(req, res, next) {

    verifica_token(req, res).then(user => {
        if (user) {
            findOneUser(user.username).then(user => {
                console.log(user)
                if (user.length > 0) {
                    user[0].passw = '*****';
                    res.status(200).send({ "user": user[0] });

                } else {
                    res.status(200).send({ "error": "No se ha encontrado el usuario" })
                }
            })
        }
    })
});

/* GET users listing. */
router.get('/', function(req, res, next) {

    verifica_token(req, res).then(user => {
        if (user) {
            //query or params GET
            getAllUsers(req.query.filtro, req.query.orden).then(function(rows) {
                let rows_new = []
                rows.forEach(element => {
                    element.passw = "*****";
                    rows_new.push(element);
                });
                res.status(200).jsonp(rows_new);
            }).catch((err) => setImmediate(() => {
                res.status(404).jsonp({
                    error: 'Existe un error en la consulta : (' + err + ")"
                })
            }));
        }
    })
});
/* GET users listing. */
router.delete('/:username', function(req, res, next) {

    verifica_token(req, res).then(user => {

        function delete_user(username) {

            let insert = new Promise(function(resolve, reject) {

                findOneUser(username).then(user => {
                    if (user.length > 0) {
                        pool.query(`DELETE FROM 
                        usuario WHERE username = '${username}'`,
                            function(err, rows, fields) {
                                // reject para errores
                                // resolve se hizo bien la transaccion con resultados
                                if (err) {
                                    res.status(500).send({ "error": "No se puedo eliminar el usuario. error:(" + err + ")" })
                                    return reject(err);

                                }
                                resolve(rows);
                            });
                    } else {
                        res.status(200).send({ "error": "El usuario ya no existe en la base de datos" })

                    }
                });

            });
            return insert
        }

        if (user.username === req.params.username) {
            //query or params GET
            delete_user(req.params.username).then(ok => {

                res.status(200).send({ "ok": "El usuario se ha eliminado satisfactoriamente" });
            })
        } else {
            findOneUser(user.username).then(user => {
                console.log(user)
                if (user[0]['rol'] == "admin") {
                    delete_user(req.params.username).then(ok => {
                        res.status(200).send({ "ok": "El usuario se ha eliminado satisfactoriamente" + ok });
                    })
                } else {
                    res.status(200).send({ "error": "No es propietario del usuario, ni tampoco es administrador. Contacte a el personal de sistemas." })
                }
            })
        }
    })
});



module.exports = router;