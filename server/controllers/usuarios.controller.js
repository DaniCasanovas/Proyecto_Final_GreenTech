'use strict';

const bcrypt = require('bcrypt');
const Usuario = require('../models/usuarios.model.js');
const jwt = require('jsonwebtoken');

exports.register = async function (req, res) {
    try {
        const { correo_electronico, contrasena } = req.body;

        // Verificar si el correo electrónico ya existe en la base de datos
        const existingUser = await Usuario.findOne({ where: { correo_electronico } });

        if (existingUser) {
            // Si ya existe un usuario con el mismo correo electrónico, devolver un error
            return res.status(400).json({ error: true, message: 'El correo electrónico ya está en uso' });
        }


        // Hashear la contraseña antes de crear el usuario
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = {
            correo_electronico,
            contrasena: hashedPassword, // Usar la contraseña hasheada
            // Agrega otros campos aquí si los deseas
        };

        const idUsuarioCreado = await Usuario.create(nuevoUsuario);
        res.json({ error: false, message: 'Usuario agregado exitosamente!', data: idUsuarioCreado });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ error: true, message: 'Error al crear el usuario' });
    }
};

exports.login = async function (req, res) {
    try {
        // Verificar si el email existe
        const user = await Usuario.findOne({
            where: {
                correo_electronico: req.body.correo_electronico
            }
        });

        // Si el correo existe
        if (user) {
            // Comparar la contraseña ingresada y la contraseña cifrada encontrada
            const passwordCheck = await bcrypt.compare(req.body.contrasena, user.contrasena);

            // Si hay match en la contraseña
            if (passwordCheck) {
                // Crear JWT token
                const token = jwt.sign(
                    {
                        userId: user.id_usuario,
                        userEmail: user.correo_electronico,
                    },
                    "RANDOM-TOKEN",
                    { expiresIn: "24h" }
                );

                // Devolver respuesta exitosa
                res.status(200).send({
                    message: "Login satisfactorio",
                    email: user.correo_electronico,
                    token,
                });
            } else {
                res.status(400).send({
                    message: "La contraseña no coincide",
                });
            }
        } else {
            res.status(404).send({
                message: "Correo electrónico no encontrado",
            });
        }
    } catch (error) {
        console.error("Error en el proceso de login:", error);
        res.status(500).json({ error: true, message: 'Error en el proceso de login' });
    }
};

exports.findAll = async function (req, res) {
    try {
        const usuarios = await Usuario.findAll();
        console.log('controller', usuarios);
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        res.status(500).json({ error: true, message: 'Error al obtener todos los usuarios' });
    }
};

exports.findById = async function (req, res) {
    try {
        const idUsuario = req.params.id;
        const usuarioEncontrado = await Usuario.findByPk(idUsuario);
        res.json(usuarioEncontrado);
    } catch (error) {
        console.error('Error al buscar el usuario:', error);
        res.status(500).json({ error: true, message: 'Error al buscar el usuario' });
    }
};

exports.updateUserByEmail = async function (req, res) {
    try {
        // Obtener el email del usuario a actualizar desde los parámetros de la URL
        const email = req.params.email;

        // Obtener los datos actualizados del usuario desde el cuerpo de la solicitud
        const datosActualizados = req.body;

        // Opciones para la actualización del usuario
        const opciones = {
            where: { correo_electronico: email } // Especificamos la cláusula where con el email del usuario a actualizar
        };

        // Llamamos a Usuario.update() con los datos actualizados y las opciones
        const numFilasActualizadas = await Usuario.update(datosActualizados, opciones);

        res.json({ error: false, message: 'Usuario actualizado exitosamente!', data: numFilasActualizadas });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ error: true, message: 'Error al actualizar el usuario', errorDetails: error });
    }
};


exports.deleteById = async function (req, res) {
    try {
        const idUsuario = req.params.id;
        const opciones = {
            where: { id_usuario: idUsuario } // Especificamos la cláusula where con el ID del usuario a eliminar
        };

        // Llamamos a Usuario.destroy() con las opciones
        const numFilasEliminadas = await Usuario.destroy(opciones);

        res.json({ error: false, message: 'Usuario eliminado exitosamente!', data: numFilasEliminadas });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ error: true, message: 'Error al eliminar el usuario' });
    }
};


// Otros controladores

// Obtener el género de los usuarios
exports.getGenderDistribution = async function (req, res) {
    try {
        const { genero } = req.query; // Obtener el género seleccionado desde los parámetros de la URL

        // Definir un objeto vacío para almacenar las condiciones de búsqueda
        const whereCondition = {};

        // Si se selecciona un género específico, agregar la condición de búsqueda por género
        if (genero) {
            whereCondition.genero = genero;
            console.log(genero);
        }

        // Obtener todos los usuarios que cumplan con la condición de búsqueda
        const usuarios = await Usuario.findAll({ where: whereCondition });

        // Contar la cantidad de usuarios masculinos y femeninos
        const maleCount = usuarios.filter((user) => user.genero === 'masculino').length;
        const femaleCount = usuarios.filter((user) => user.genero === 'femenino').length;

        res.json({
            maleCount,
            femaleCount,
        });
    } catch (error) {
        console.error('Error al obtener la distribución de género:', error);
        res.status(500).json({ error: true, message: 'Error al obtener la distribución de género' });
    }
};

// Obtener el género de los usuarios y qué espacios de reciclaje tienen en su ámbito doméstico 
exports.getGenderAndRecyclingDistribution = async function (req, res) {
    try {
      const { genero } = req.query; // Obtener el género seleccionado desde los parámetros de la URL
      
      
      // Definir un objeto vacío para almacenar las condiciones de búsqueda
      const whereCondition = {};
  
      // Si se selecciona un género específico, agregar la condición de búsqueda por género
      if (genero && genero !== 'all') {
        whereCondition.genero = genero;
      }
  
      // Obtener solo las columnas relevantes relacionadas con el reciclaje
      const usuarios = await Usuario.findAll({
        attributes: ['basura_papel', 'basura_plastico', 'basura_resto', 'basura_organico', 'basura_cristal', 'no_recicla'],
        where: whereCondition,
      });
  
      // Obtener la cantidad de usuarios que disponen de cada tipo de reciclaje
      const countsByType = ['basura_papel', 'basura_plastico', 'basura_resto', 'basura_organico', 'basura_cristal', 'no_recicla'].map((type) =>
        usuarios.filter((user) => user[type] === 1).length
      );
  
    
  
      res.json({
        users: usuarios, // Enviar los datos de los usuarios bajo la propiedad "users"
        recyclingCounts: countsByType,
      });
    } catch (error) {
      console.error('Error al obtener la distribución de género y reciclaje:', error);
      res.status(500).json({ error: true, message: 'Error al obtener la distribución de género y reciclaje' });
    }
  };