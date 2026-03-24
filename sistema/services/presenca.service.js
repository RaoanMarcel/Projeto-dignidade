const db = require('../db.js');

exports.registrarEntrada = (beneficiariosIds) => {
    const stmt = db.prepare(`INSERT INTO presencas (beneficiario_id, status) VALUES (?, 'ATIVA')`);
    
    const transaction = db.transaction((ids) => {
        for (const id of ids) {
            const jaEstaNaCasa = db.prepare(`SELECT id FROM presencas WHERE beneficiario_id = ? AND status = 'ATIVA'`).get(id);
            if (!jaEstaNaCasa) {
                stmt.run(id);
            }
        }
    });
    
    transaction(beneficiariosIds);
};

exports.registrarSaida = (presencaId) => {
    const stmt = db.prepare(`
        UPDATE presencas 
        SET data_saida = CURRENT_TIMESTAMP, status = 'FINALIZADA' 
        WHERE id = ?
    `);
    stmt.run(presencaId);
};

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

exports.obterHistoricoPorData = (data) => {
    const stmt = db.prepare(`
        SELECT p.id, p.data_entrada, p.data_saida, p.status, b.nome, b.documento
        FROM presencas p
        JOIN beneficiarios b ON p.beneficiario_id = b.id
        WHERE date(p.data_entrada) = ?
        ORDER BY p.data_entrada DESC
    `);
    return stmt.all(data);
};

exports.criarBeneficiarioRapido = (dados) => {
    const stmt = db.prepare(`
        INSERT INTO beneficiarios (nome, apelido, idade, documento) 
        VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
        dados.nome, 
        dados.apelido || null, 
        dados.idade || null, 
        dados.documento || null
    );
    
    return info.lastInsertRowid; 
};