const almoxarifadoController = require('../controllers/almoxarifado.controller.js');

module.exports = async function (fastify, opts) {
    fastify.get('/almoxarifado', almoxarifadoController.renderizarTelaPrincipal);
    fastify.get('/almoxarifado/lista', almoxarifadoController.listarItens);
    fastify.post('/almoxarifado/entrada', almoxarifadoController.adicionarEntrada);
    fastify.get('/almoxarifado/item/:id', almoxarifadoController.modalItem);
    
    fastify.get('/almoxarifado/distribuir/:itemId', almoxarifadoController.modalDistribuicao);
    fastify.post('/almoxarifado/entregar/:itemId', almoxarifadoController.registrarEntrega);
};