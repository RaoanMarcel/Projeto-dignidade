const path = require('path');
const fs = require('fs');
const cadastroController = require('../controllers/cadastro.controller'); 

async function cadastroRoutes(fastify, options) {
    
    fastify.get('/cadastro', async (request, reply) => {
        try {
            const filePath = path.join(__dirname, '../public/views/cadastro.html');
            const html = fs.readFileSync(filePath, 'utf8');
            reply.type('text/html').send(html);
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send("Erro ao carregar a tela de cadastro. " + error.message);
        }
    });

    fastify.post('/cadastrar', cadastroController.cadastrarBeneficiario);
}

module.exports = cadastroRoutes;