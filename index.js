const {ApolloServer} = require('apollo-server');

const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
require('dotenv').config('variables.env');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');

// conectar a la base de datos
conectarDB();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => {
        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                return {
                    usuario
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
});

server.listen({ port: process.env.PORT || 4000 }).then(({url}) => {
    console.log(`servidor listo en la url ${url}`);
})