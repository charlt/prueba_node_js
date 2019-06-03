# prueba_node_js
Examen de prueba

La apliación esta construida en Node js usando express y express-generator.

Las librerias que se usan son las siguientes:

	
Esta libreria nos ayuda a manejar las rutas, request y response de las peticiones REST.
var express = require('express');

Esta libreria es usada para la creación y autenticación del token que se genera en el login.
var jwt = require('jsonwebtoken')
Esta libreria es usada para parsear a un formato legible los datos del request
var bodyParser = require("body-parser");
Esta libreria es usada para el manejo de archivos
var fileUpload = require('express-fileupload')
Esta libreria es el controlador par conectarse a la base de datos mysql
var mysql = require('mysql')
Esta libreria nos ayuda para el manejo de archivos
var fs = require('fs-extra');


La aplicación recibe diferentes parametros API REST por medio de rutas y diferentes verbos. 
A continuación se explica como hacer las peticiones por medio de postman.



INICIO DE SESIÓN
* Body -> raw
Se enviar un json por medio del body con la siguiente estructura:

{
	"user":"charles",
	"password":"1234567890"
}

URL: POST -> http://localhost:3000/login

La aplicación retornara un mensaje, ya sea de exito o de fallo. Si es de exito, mostrará un json con la siguiente estructura

{
    "message": "ok",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNoYXJsZXMiLCJyb2wiOiJhZG1pbiIsImlhdCI6MTU1OTU3ODg0OCwiZXhwIjoxNTU5NTg2MDQ4fQ.Rzy-sW56-dAH9hv_yOS43WJMriGzuo_1-Rk-5n76ZjQ"
}


Se tiene que copiar el token y pasarlo en los headers de las peticiones como Authorization. Si no se hace esto
Ninguna url dejara hacer peticiones y regresara un mensaje referente al token.


CONSULTA DE USUARIOS

*PARAMS
filtro ->Nombre de campo por el cual se quiere ordenar
orden -> ASC o DESC
min -> Rango de edad minima a buscar
max -> Rango de edad maxima a buscar
Nota: Si solo se registra un min o max, se ignorara y se verificara los demas parametros.

URL: GET -> http://localhost:3000/users/


REGISTRO DE USUARIOS

*Body -> form-data

username -> Requerido
avatar -> No requerido -> (Tipo file)
edad -> Requerido
nombre -> Requerido
email -> Requerido
passw-> Requerido
rol -> No requerido (admin/normal)

Se registran los datos y al final se hace las verificaciones necesarias.

URL: POST-> http://localhost:3000/users/add


CONSULTA DE UN USUARIO

*Parametro por medio de la url

params: username

URL: GET -> http://localhost:3000/users/{username}
example: http://localhost:3000/users/User

Si se encuentr, se retornara un json con los datos del usuario, excepto el pass.



EDICION DE USUARIO

*Body -> form-data

username -> Requerido
avatar -> No requerido -> (Tipo file)
edad -> Requerido
nombre -> Requerido
email -> Requerido
passw-> Requerido
rol -> No requerido (admin/normal)


URL: PUT -> http://localhost:3000/users/

Principalmente se valida que el username exista.



ELIMINAR UN USUARIO:

*Parametro por medio de la url

params: username

URL: DELETE -> http://localhost:3000/users/{username}
example: http://localhost:3000/users/user


Se veriufica que sea tippo admin o dueño del usuario para hacer esta transaccion








