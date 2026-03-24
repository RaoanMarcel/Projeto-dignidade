const voluntarioController = require('../controllers/voluntario.controller.js');

module.exports = async function (fastify, opts) {
    fastify.get('/voluntarios', voluntarioController.renderizarTelaPrincipal);
    fastify.get('/voluntarios/lista', voluntarioController.listarVoluntarios);
    
    fastify.post('/voluntarios/salvar', voluntarioController.salvarVoluntario);
    
    fastify.get('/voluntarios/modal/:id', voluntarioController.modalFormulario);
    fastify.get('/voluntarios/modal-termo/:id', voluntarioController.modalTermo);
    
    fastify.post('/voluntarios/assinar-termo/:id', voluntarioController.assinarTermo);
};