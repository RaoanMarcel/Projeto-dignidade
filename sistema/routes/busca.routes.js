const path = require('path');
const fs = require('fs');
const buscaController = require('../controllers/busca.controller'); 

async function buscaRoutes(fastify, options) {
    
    fastify.get('/consulta', async (request, reply) => {
        try {
            const filePath = path.join(__dirname, '../public/views/consulta.html');
            const html = fs.readFileSync(filePath, 'utf8');
            reply.type('text/html').send(html);
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send("Erro ao carregar a tela de consulta. " + error.message);
        }
    });

    fastify.post('/buscar', buscaController.buscarBeneficiario);
    
    fastify.get('/beneficiario/:id', buscaController.abrirModalBeneficiario);
}

module.exports = buscaRoutes;