const presencaController = require('../controllers/presenca.controller');

module.exports = async function (fastify, opts) {
    fastify.get('/portaria', presencaController.abrirPortaria);
    
    fastify.post('/portaria/buscar-pessoas', presencaController.buscarPessoas);
    fastify.post('/portaria/entrar', presencaController.registrarEntrada);
    fastify.post('/portaria/sair/:id', presencaController.registrarSaida);

    fastify.get('/portaria/historico', presencaController.abrirHistorico);
    fastify.post('/portaria/historico/filtrar', presencaController.filtrarHistorico);
    
    fastify.post('/portaria/exportar-excel', presencaController.exportarExcel);
};