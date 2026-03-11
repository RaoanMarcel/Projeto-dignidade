// routes/busca.routes.js
const path = require('path');
const fs = require('fs');
const buscaController = require('../controllers/busca.controller'); 

async function buscaRoutes(fastify, options) {
    // Retorna o fragmento da tela de busca
    fastify.get('/view-busca', async (request, reply) => {
        const filePath = path.join(__dirname, '../public/views/consulta.html');
        const html = fs.readFileSync(filePath, 'utf8');
        reply.type('text/html').send(html);
    });

    // Realiza a busca no HTMX
    fastify.post('/buscar', buscaController.buscarBeneficiario);
    
    // Modais e Edição (Já programados no seu Controller)
    fastify.get('/beneficiario/:id', buscaController.abrirModalBeneficiario);
    fastify.get('/editar/:id', buscaController.carregarFormularioEdicao);
    fastify.post('/atualizar/:id', buscaController.atualizarBeneficiario);
}
module.exports = buscaRoutes;