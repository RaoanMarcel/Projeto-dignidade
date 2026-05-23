const db = require('../db.js');

// ==========================================
// FAMÍLIAS
// ==========================================

exports.listarFamilias = (busca = '') => {
    if (busca) {
        return db.prepare(`
            SELECT * FROM familias 
            WHERE nome_responsavel LIKE ? OR endereco LIKE ? OR cpf LIKE ?
            ORDER BY nome_responsavel ASC
        `).all(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }
    return db.prepare("SELECT * FROM familias ORDER BY data_cadastro DESC").all();
};

exports.obterFamiliaPorId = (id) => {
    return db.prepare("SELECT * FROM familias WHERE id = ?").get(id);
};

exports.criarFamilia = (dados) => {
    const stmt = db.prepare(`
        INSERT INTO familias (
            nome_responsavel, cpf, nis, telefone, endereco, 
            quantidade_membros, renda_familiar, condicao_moradia, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
        dados.nome_responsavel,
        dados.cpf || null,
        dados.nis || null,
        dados.telefone || null,
        dados.endereco || null,
        dados.quantidade_membros || null,
        dados.renda_familiar || null,
        dados.condicao_moradia || null,
        dados.observacoes || null
    );
    return info.lastInsertRowid;
};

// ==========================================
// LIGAÇÃO COM BENEFICIÁRIOS (ACOLHIDOS)
// ==========================================

exports.listarBeneficiariosDaFamilia = (familiaId) => {
    return db.prepare(`
        SELECT b.id, b.nome, b.foto, fb.grau_parentesco 
        FROM familia_beneficiarios fb
        JOIN beneficiarios b ON fb.beneficiario_id = b.id
        WHERE fb.familia_id = ?
    `).all(familiaId);
};

// ==========================================
// VISITAS
// ==========================================

exports.listarVisitasDaFamilia = (familiaId) => {
    return db.prepare(`
        SELECT v.*, vol.nome as voluntario_nome 
        FROM visitas v
        LEFT JOIN voluntarios vol ON v.voluntario_id = vol.id
        WHERE v.familia_id = ?
        ORDER BY v.data_visita DESC
    `).all(familiaId);
};

// Adicione no final do familia.service.js

exports.obterTodosBeneficiarios = () => {
    return db.prepare("SELECT id, nome, documento FROM beneficiarios ORDER BY nome ASC").all();
};

exports.adicionarMembro = (familiaId, beneficiarioId, parentesco) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO familia_beneficiarios (familia_id, beneficiario_id, grau_parentesco) 
            VALUES (?, ?, ?)
        `);
        return stmt.run(familiaId, beneficiarioId, parentesco);
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            throw new Error('Este acolhido já é membro desta família.');
        }
        throw err;
    }
};

exports.removerMembro = (familiaId, beneficiarioId) => {
    return db.prepare("DELETE FROM familia_beneficiarios WHERE familia_id = ? AND beneficiario_id = ?").run(familiaId, beneficiarioId);
};

// Adicione no final do familia.service.js

exports.adicionarVisita = (dados) => {
    const stmt = db.prepare(`
        INSERT INTO visitas (familia_id, data_visita, motivo, status, observacoes) 
        VALUES (@familia_id, @data_visita, @motivo, @status, @observacoes)
    `);
    return stmt.run(dados).lastInsertRowid;
};

exports.listarVisitasDaFamilia = (familiaId) => {
    return db.prepare(`
        SELECT * FROM visitas 
        WHERE familia_id = ? 
        ORDER BY data_visita DESC
    `).all(familiaId);
};