const almoxarifadoController = require('./almoxarifado.controller');

module.exports = function (fastify, opts, done) {
    fastify.get('/almoxarifado', almoxarifadoController.renderizarTelaPrincipal);
    
    fastify.get('/almoxarifado/lista', almoxarifadoController.listarItens);
    
    fastify.post('/almoxarifado/entrada', almoxarifadoController.adicionarEntrada);
    
    fastify.get('/almoxarifado/item/:id', almoxarifadoController.modalItem);
    
    fastify.get('/almoxarifado/distribuir/:itemId', almoxarifadoController.modalDistribuicao);
    
    fastify.post('/almoxarifado/entregar/:itemId/:beneficiarioId', almoxarifadoController.registrarEntrega);

    done();
};