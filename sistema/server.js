const fastify = require('fastify')({ logger: true });
const path = require('path');

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/',
});

fastify.register(require('./routes/beneficiario.routes'));

fastify.listen({ port: 3000 }, (err) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log('🚀 Sistema Dignidade rodando em http://localhost:3000');
});