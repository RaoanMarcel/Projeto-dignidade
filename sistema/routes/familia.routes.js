// routes/familia.routes.js
const familiaController = require('../controllers/familia.controller');

async function familiaRoutes(fastify, options) {
    fastify.get('/familias', familiaController.abrirPaginaFamilias);
    fastify.post('/familias/buscar', familiaController.buscarFamilias);
    fastify.get('/familias/novo', familiaController.abrirModalCriar);
    fastify.post('/familias', familiaController.salvarFamilia);
    
    // Novas rotas de Perfil e Membros
    fastify.get('/familias/:id', familiaController.abrirPerfilFamilia);
    fastify.post('/familias/:id/membros', familiaController.adicionarMembro);
    fastify.delete('/familias/:id/membros/:membroId', familiaController.removerMembro);
    // Adicione esta linha no seu familia.routes.js
    fastify.post('/familias/:id/visitas', familiaController.salvarVisita);
}

module.exports = familiaRoutes;