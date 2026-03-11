const fastify = require('fastify')({ logger: false }); 
const path = require('path');

fastify.register(require('@fastify/formbody'));

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/', 
});

fastify.register(require('./routes/cadastro.routes'));
fastify.register(require('./routes/busca.routes'));

const PORT = 3000;

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📌 Tela de Cadastro: http://localhost:${PORT}/cadastro`);
        console.log(`🔍 Tela de Consulta: http://localhost:${PORT}/consulta`);
    } catch (err) {
        console.error("Erro ao iniciar o servidor:", err);
        process.exit(1);
    }
};

start();