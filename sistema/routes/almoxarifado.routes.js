const almoxarifadoController = require('../controllers/almoxarifado.controller.js');

module.exports = async function (fastify, options) {
    // Carrega a tela principal do almoxarifado
    fastify.get('/almoxarifado', almoxarifadoController.renderizarTelaPrincipal);
    
    // Atualiza apenas a lista (para a busca e filtros)
    fastify.get('/almoxarifado/lista', almoxarifadoController.listarItens);
    
    // Rota para salvar um novo item ou adicionar quantidade
    fastify.post('/almoxarifado/entrada', almoxarifadoController.adicionarEntrada);
    
    fastify.get('/almoxarifado/item/:id', almoxarifadoController.modalItem);
    fastify.get('/almoxarifado/distribuir/:itemId', almoxarifadoController.modalDistribuicao);
    fastify.post('/almoxarifado/entregar/:itemId/:beneficiarioId', almoxarifadoController.registrarEntrega);
};