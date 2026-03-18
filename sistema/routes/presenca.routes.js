const presencaController = require('../controllers/presenca.controller');

module.exports = async function (fastify, opts) {
    // Rota para acessar a tela (Adicione no menu lateral do seu sistema apontando para '/portaria')
    fastify.get('/portaria', presencaController.abrirPortaria);
    
    // Rotas do HTMX (Ações assíncronas na tela)
    fastify.post('/portaria/buscar-pessoas', presencaController.buscarPessoas);
    fastify.post('/portaria/entrar', presencaController.registrarEntrada);
    fastify.post('/portaria/sair/:id', presencaController.registrarSaida);
};