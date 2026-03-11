// routes/cadastro.routes.js
const path = require('path');
const fs = require('fs');
const cadastroController = require('../controllers/cadastro.controller'); 

async function cadastroRoutes(fastify, options) {
    // Retorna o fragmento do form de cadastro
    fastify.get('/view-cadastro', async (request, reply) => {
        const filePath = path.join(__dirname, '../public/views/cadastro.html');
        const html = fs.readFileSync(filePath, 'utf8');
        reply.type('text/html').send(html);
    });

    // Salva os dados
    fastify.post('/cadastrar', cadastroController.cadastrarBeneficiario);
}
module.exports = cadastroRoutes;