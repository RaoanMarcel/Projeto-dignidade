const path = require('path');
const fs = require('fs');
const beneficiarioController = require('../controllers/beneficiario.controller');

async function routes(fastify, options) {
    
    fastify.get('/', async (request, reply) => {
        try {
            const filePath = path.join(__dirname, '../public/views/cadastro.html');
            const html = fs.readFileSync(filePath, 'utf8');
            reply.type('text/html').send(html);
        } catch (error) {
            reply.status(500).send("Erro ao carregar a tela de cadastro. " + error.message);
        }
    });

    fastify.post('/cadastrar', beneficiarioController.cadastrarBeneficiario);
}

module.exports = routes;