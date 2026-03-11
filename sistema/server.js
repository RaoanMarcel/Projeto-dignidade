// server.js
const fastify = require('fastify')({ logger: false });
const path = require('path');
const fs = require('fs');

fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/',
});

// Rota Raiz: Carrega o nosso Hub (Dashboard Principal)
fastify.get('/', async (request, reply) => {
    const filePath = path.join(__dirname, 'public/views/index.html');
    const html = fs.readFileSync(filePath, 'utf8');
    reply.type('text/html').send(html);
});

// Registra os módulos (Atenção aos caminhos)
fastify.register(require('./routes/cadastro.routes'));
fastify.register(require('./routes/busca.routes'));

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log(`🚀 Sistema rodando em http://localhost:3000`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();