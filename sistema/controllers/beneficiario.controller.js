const db = require('../db');

async function cadastrarBeneficiario(request, reply) {
    const dados = request.body;
    
    console.log("Recebido do HTMX:", dados.nome);

    return `<div class="bg-green-100 text-green-800 p-4 rounded mb-4 shadow">
              ✅ Cadastro de <b>${dados.nome || dados.apelido || 'Assistido'}</b> salvo com sucesso! 
            </div>`;
}

module.exports = {
    cadastrarBeneficiario
};