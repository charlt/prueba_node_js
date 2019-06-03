const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
var bcrypt = require('bcrypt');

/**
 * @description Función que crea un numero n de letras aleatorias
 * @method
 * @param {int} length  Numero de caracteres 
 * @return {Array} cadena de caracteres random
 * 
 */
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


/**
 * @description Función que se encarga de buscar un usuario dependiendo de cierto campo y cierto valor.
 * @param {String} campo Campo de bd 
 * @param {String} dato Valor de campo en bd a buscar
 * @return {Array} Usuario encontrado
 * 
 * 
 */
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

/**
 * @description La función se encarga de hacer toda la validación y por ultimo el query para el update.
 * @param {Array} req Objeto que contiene informacion para edicion 
 * @param {Array} res Respuesta a cliente 
 * 
 * 
 */
function editar(req, res) {
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

    if (req.body.rol != null) {
        var rol = req.body.rol
    } else {
        var rol = "normal"
    }
    var nombre_avatar = "";
    if ((username != "" && username != undefined) && (edad != "" && edad != undefined) && (passw != "" && passw != undefined) &&
        (nombre != "" && nombre != undefined) && (email != "" && email != undefined)) {

        //se valida el username por medio de una función que busca en la bd
        check_user('username', username).then(user => {
            if (!user.length > 0) {
                res.status(200).send({ "error": "El username no se encuentra en los registros." })

            }
        })
        emailRegex = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;

        if (!emailRegex.test(email)) {
            res.status(200).send({ "error": "Verifique el formato del email" })

        }

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
                        nombre_avatar = username + makeid(10) + '.' + ext_avatar;
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




        let BCRYPT_SALT_ROUNDS = 12;
        bcrypt.hash(passw, BCRYPT_SALT_ROUNDS)
            .then(function(hashedPassword) {
                console.log(hashedPassword)
                passw = hashedPassword;

                let update_query = "";
                if (rol == "admin") {
                    update_query = `UPDATE usuario
                    SET nombre = '${nombre}', edad = '${edad}', email='${email}', avatar='${nombre_avatar}', passw='${passw}', rol='admin'
                    WHERE username= '${username}'`
                } else {
                    update_query = `UPDATE usuario
                    SET nombre = '${nombre}', edad = '${edad}', email='${email}', avatar='${nombre_avatar}', passw='${passw}', rol='normal'
                    WHERE username= '${username}'`
                }

                update = new Promise(function(resolve, reject) {
                    pool.query(update_query, function(err, rows, fields) {
                        // reject para errores
                        // resolve se hizo bien la transaccion con resultados
                        if (err) {
                            return reject(err);
                        }
                        resolve(rows);
                    });
                });



                update.then(ok => {
                    res.status(200).send({ "ok": "El usuario se actualizo correctamente" })

                })
            })

    } else {
        res.status(200).send({ "error": "Registre la información necesaria" })
    }
}
/**
 * 
 * @param {Información necesaria enviada al servidor} req 
 * @param {Respuesta al cliente} res 
 */
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
/**
 * @description Promesa que busca a registro por medio del username
 * @param {String} username Es el dato clave para buscar el registro 
 * @returns {Array } Usuario buscado
 * 
 * 
 */
function findOneUser(username) {
    return new Promise(function(resolve, reject) {

        query_str = `SELECT * FROM USUARIO where username='${username}'`;
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
/**
 * @description Función que extrae todos los datos de la bd, y retorna dependiendo de los filtros
 * @param {String} filtro Campo por el cual se quiere ordenar
 * @param {String} ordenamiento tipo de ordenamiento ASC/DESC
 * @param {int} min Filtro de minimo para crer el between
 * @param {int} max Filtro de maximo para crer el between 
 * @return {Array} Usuarios
 * 
 */
function getAllUsers(filtro, ordenamiento, min, max) {
    return new Promise(function(resolve, reject) {
        //The Promise constructor should catch any errors thrown on
        //this tick. Alternately, try/catch and reject(err) on catch.
        //alfa, edad, DESC, ASC, 
        let query_str = "";
        let orden = "asc"
        let between = ""
        if ((min != undefined && min != "") && (max != undefined && max != "")) {
            between = " WHERE edad BETWEEN " + min + " and " + max
        }
        if (ordenamiento != undefined && ordenamiento != "") {
            orden = ordenamiento
        }
        if (filtro != undefined && filtro != "") {
            query_str = "SELECT * FROM usuario " + between + " order by " + filtro + " " + orden;
        } else {
            query_str = "SELECT * FROM usuario " + between;
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


/**
 *  @description Función de agregar, valida campos, y reglas especificas, si todo sale bien, inserta a bd
 */
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

                var noValido = /\s/
                if (noValido.test(username)) {
                    res.status(200).send({ "error": "El username no debe contener espacios" })

                }
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
                let regexp_password = /^(?=(?:.*(\d|[$@])){1})(?=(?:.*[A-Z]){1})(?=(?:.*[a-z]){1})\S{10,60}$/;

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
                                nombre_avatar = username + makeid(10) + '.' + ext_avatar;
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


                let insert_query = ""


                let BCRYPT_SALT_ROUNDS = 12;
                bcrypt.hash(passw, BCRYPT_SALT_ROUNDS)
                    .then(function(hashedPassword) {
                        console.log(hashedPassword)
                        passw = hashedPassword;
                        if (rol == "admin") {
                            insert_query = `INSERT INTO usuario  VALUES (NULL, '${nombre}', '${edad}', '${username}', '${nombre_avatar}', '${email}', '${passw}', 'admin')`;
                        } else {
                            insert_query = `INSERT INTO usuario VALUES (NULL, '${nombre}', '${edad}', '${username}', '${nombre_avatar}', '${email}', '${passw}', 'normal')`;

                        }
                        insert = new Promise(function(resolve, reject) {
                            pool.query(insert_query, function(err, rows, fields) {
                                // reject para errores
                                // resolve se hizo bien la transaccion con resultados
                                if (err) {
                                    return reject(err);
                                }
                                resolve(rows);
                            });
                        });
                        insert.then(user => {
                            res.status(200).send({ "ok": "El usuario se registro correctamente" })

                        })
                    })

            } else {
                res.status(200).send({ "error": "Registre la información necesaria" })
            }
        }
    })


});

/**
 * @description Extrae a un usuario, por medio del username
 */
router.get('/:username', function(req, res, next) {
    verifica_token(req, res).then(user => {
        if (user) {
            findOneUser(req.params.username).then(user => {
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

/**
 * @description Extrae a todos los usuarios con distintos filtros 
 */
router.get('/', function(req, res, next) {

    verifica_token(req, res).then(user => {
        if (user) {
            //query or params GET
            getAllUsers(req.query.filtro, req.query.orden, req.query.min, req.query.max).then(function(rows) {
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

/**
 * @description Elimina a usuario por medio del parametro de username verificando si es administrador o es el mismo usuario quien quiere eliminarlo.
 */

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


/***
 * @description Función que se encarga de editar, recibe los datos y hacen las validaciones necesarias
 */
router.put('/', function(req, res, next) {
    verifica_token(req, res).then(user => {
        if (req.body.username != null) {
            if (user.username === req.body.username) {
                editar(req, res);
            } else {
                findOneUser(user.username).then(user => {
                    if (user[0]['rol'] == "admin") {
                        editar(req, res);
                    } else {
                        res.status(200).send({ "error": "No es propietario del usuario, ni tampoco es administrador. Contacte a el personal de sistemas." })
                    }
                })
            }
        } else {
            res.status(200).send({ "error": "Debe registrar el username" });

        }

    })
});


module.exports = router;