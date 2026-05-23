const db = require('./db.js');
const familiaService = require('./services/familia.service');

console.log("🚀 Iniciando bateria de testes do módulo Famílias e Integrantes...\n");

try {
    // ==========================================
    // 1. CRIANDO ACOLHIDOS (BENEFICIÁRIOS) FALSOS
    // ==========================================
    console.log("⏳ 1. Criando Acolhidos no banco...");
    const insertAcolhido = db.prepare("INSERT INTO beneficiarios (nome, documento, telefone, status) VALUES (?, ?, ?, ?)");
    
    const idPedro = insertAcolhido.run("Pedro Álvares Teste", "111.111.111-11", "(11) 91111-1111", "Acolhido").lastInsertRowid;
    const idAna = insertAcolhido.run("Ana Beatriz Teste", "222.222.222-22", "(22) 92222-2222", "Acolhido").lastInsertRowid;
    
    console.log(`✅ Acolhidos criados com sucesso! (Pedro ID: ${idPedro}, Ana ID: ${idAna})\n`);

    // ==========================================
    // 2. CRIANDO UMA FAMÍLIA FALSA
    // ==========================================
    console.log("⏳ 2. Criando uma Família Nova...");
    const dadosFamilia = {
        nome_responsavel: "Roberto Carlos Teste (Família Silva)",
        cpf: "999.888.777-66",
        nis: "12345678900",
        telefone: "(42) 99999-0000",
        endereco: "Rua das Araucárias, 123, Centro",
        quantidade_membros: 4,
        renda_familiar: 1412.00,
        condicao_moradia: "Alugada",
        observacoes: "Família criada por script de teste automático."
    };

    const idFamilia = familiaService.criarFamilia(dadosFamilia);
    console.log(`✅ Família '${dadosFamilia.nome_responsavel}' salva com o ID: ${idFamilia}\n`);

    // ==========================================
    // 3. VINCULANDO INTEGRANTES
    // ==========================================
    console.log("⏳ 3. Vinculando o Pedro e a Ana à Família...");
    familiaService.adicionarMembro(idFamilia, idPedro, "Filho");
    familiaService.adicionarMembro(idFamilia, idAna, "Esposa");
    console.log(`✅ Vínculos criados com sucesso!\n`);

    // ==========================================
    // 4. TESTANDO A LEITURA (LENDO DO BANCO)
    // ==========================================
    console.log("⏳ 4. Buscando os dados no banco para confirmar...");
    const membrosGravados = familiaService.listarBeneficiariosDaFamilia(idFamilia);
    
    if (membrosGravados.length === 2) {
        console.log("✅ Leitura confirmada! Veja os integrantes cadastrados na família:");
        console.table(membrosGravados);
        
        console.log("\n🎉 SUCESSO TOTAL! O banco de dados, tabelas e chaves estrangeiras estão perfeitos.");
        console.log("Pode abrir o sistema no navegador, clicar no card 'Famílias' e conferir a família do Roberto lá!");
    } else {
        console.log("⚠️ Algo deu errado. Os membros não foram encontrados na leitura.");
    }

} catch (erro) {
    console.error("\n❌ ERRO NO TESTE! Algo falhou no banco de dados:");
    console.error(erro);
}