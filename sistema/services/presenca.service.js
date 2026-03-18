const db = require('../db.js');

exports.registrarEntrada = (beneficiariosIds) => {
    const stmt = db.prepare(`INSERT INTO presencas (beneficiario_id, status) VALUES (?, 'ATIVA')`);
    
    const transaction = db.transaction((ids) => {
        for (const id of ids) {
            // Verifica se a pessoa já não está "ATIVA" na casa para não duplicar
            const jaEstaNaCasa = db.prepare(`SELECT id FROM presencas WHERE beneficiario_id = ? AND status = 'ATIVA'`).get(id);
            if (!jaEstaNaCasa) {
                stmt.run(id);
            }
        }
    });
    
    transaction(beneficiariosIds);
};

// 2. Registra a saída (Check-out) de uma pessoa específica
exports.registrarSaida = (presencaId) => {
    const stmt = db.prepare(`
        UPDATE presencas 
        SET data_saida = CURRENT_TIMESTAMP, status = 'FINALIZADA' 
        WHERE id = ?
    `);
    stmt.run(presencaId);
};

// 3. Busca todo mundo que está atualmente com status 'ATIVA'
exports.listarAtivosNaCasa = () => {
    const stmt = db.prepare(`
        SELECT p.id as presenca_id, p.data_entrada, b.nome, b.apelido, b.id as beneficiario_id
        FROM presencas p
        JOIN beneficiarios b ON p.beneficiario_id = b.id
        WHERE p.status = 'ATIVA'
        ORDER BY p.data_entrada DESC
    `);
    return stmt.all();
};