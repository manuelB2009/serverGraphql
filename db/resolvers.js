const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

// crea y firma un token
const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre} = usuario;
    return jwt.sign({id, email, nombre}, secreta, {expiresIn});
}

const resolvers = {
    Query: {
        obtenerProyectos: async (_, {}, ctx) => {
            const proyectos = await Proyecto.find({ creador: ctx.usuario.id });
            return proyectos;
        },
        obtenerTareas: async (_, {input}, ctx) => {
            const tareas = await Tarea.find({ creador: ctx.usuario.id }).where('proyecto').equals(input.proyecto);
            return tareas;
        }
    },
    Mutation: {
        crearUsuario: async(_, {input}) => {
            const { email, password } = input;
            const existeUsuario = await Usuario.findOne({ email });
            // si el usuario existe
            if (existeUsuario) {
                throw new Error('el usuario ya esta registrado');
            }
            try {
                
                // encriptar el password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);
                // registrar un usuario
                const nuevoUsusario = new Usuario(input);
                console.log(nuevoUsusario);
                nuevoUsusario.save();
                return "usuario creado correctamente";
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async(_, {input}) => {
            const { email, password } = input;
            // si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });
            // si el usuario existe
            if (!existeUsuario) {
                throw new Error('el usuario no existe');
            };
            // si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if (!passwordCorrecto) {
                throw new Error('password incorrecto');
            }
            // dar acceso a la app
            return {
                token: crearToken( existeUsuario, process.env.SECRETA, '2hr' )
            }
        },
        nuevoProyecto: async(_, {input}, ctx) => {
            // console.log('desde resolvers', ctx);
            try {
                const proyecto = new Proyecto(input);
                // asociar el creador
                proyecto.creador = ctx.usuario.id;
                // almacenar en base de datos
                const resultado = await proyecto.save();
                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProyecto: async(_, {id, input}, ctx) => {
            // revisar si existe el pryecto
            let proyecto = await Proyecto.findById(id);
            if (!proyecto) {
                throw new Error('Proyecto no encontrado');
            }
            //verificar usuario
            if (proyecto.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }
            // guardar proyecto
            proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true});
            return proyecto;
        },
        eliminarProyecto: async(_, {id} , ctx) => {
            // revisar si existe el pryecto
            let proyecto = await Proyecto.findById(id);
            if (!proyecto) {
                throw new Error('Proyecto no encontrado');
            }
            //verificar usuario
            if (proyecto.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }
            //  eliminar
            await Proyecto.findOneAndDelete({_id: id});
            return "proyecto eliminado";
        },
        nuevaTarea: async(_, {input} , ctx) => {
            try {
                const tarea = new Tarea(input);
                tarea.creador = ctx.usuario.id;
                const resultado = await tarea.save();
                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarTarea: async(_, {id, input, estado} , ctx) => {
            // verificar si existe tarea
            let tarea = await Tarea.findById(id);
            if (!tarea) {
                throw new Error('Tarea no encontrada');
            }
            // si el editor es el creador
            if (tarea.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }
            // asignar el estado
            input.estado = estado;
            //guardar tarea
            tarea = await Tarea.findOneAndUpdate({_id: id}, input, {new: true});
            return tarea;
        },
        eliminarTarea: async(_, {id} , ctx) => {
            // verificar si existe tarea
            let tarea = await Tarea.findById(id);
            if (!tarea) {
                throw new Error('Tarea no encontrada');
            }
            // si el editor es el creador
            if (tarea.creador.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para editar');
            }
            // eliminar tarea
            await Tarea.findOneAndDelete({_id: id});
            return "tarea eliminada";
        }
    }
}

module.exports = resolvers; 