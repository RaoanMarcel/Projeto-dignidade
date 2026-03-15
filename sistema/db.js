const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dignidade.db');
const db = new Database(dbPath, { verbose: console.log });

// 1. Cria a tabela com as novas colunas (caso o banco seja apagado e recriado do zero)
db.exec(`
  CREATE TABLE IF NOT EXISTS beneficiarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    apelido TEXT,
    foto TEXT,
    primeiro_dia TEXT,
    documento TEXT,
    naturalidade TEXT,
    mae TEXT,
    pai TEXT,
    irmaos TEXT,
    esposa TEXT,
    filhos TEXT,
    escolaridade TEXT,
    tamanho_camisa TEXT,
    tamanho_calca TEXT,
    tamanho_calcado TEXT,
    tipo_sanguineo TEXT,
    alergias TEXT,
    saude TEXT,
    vicios TEXT,
    endereco TEXT,
    telefone TEXT,
    aptidoes TEXT,
    autorizacao_imagem INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Acolhido', 
    observacoes TEXT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS diario_bordo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beneficiario_id INTEGER NOT NULL,
        data_registro TEXT DEFAULT (datetime('now', 'localtime')),
        anotacao TEXT NOT NULL,
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id)
    )
`);

// 2. ATUALIZA O BANCO EXISTENTE (Evita que você perca dados)
// Tenta adicionar a coluna 'status'. Se já existir, o try/catch engole o erro e o sistema não trava.
try {
    db.exec("ALTER TABLE beneficiarios ADD COLUMN status TEXT DEFAULT 'Acolhido'");
    console.log("✅ Coluna 'status' adicionada ao banco de dados!");
} catch (err) {
    // Ignora silenciosamente, a coluna já existe
}

// Tenta adicionar a coluna 'observacoes'.
try {
    db.exec("ALTER TABLE beneficiarios ADD COLUMN observacoes TEXT");
    console.log("✅ Coluna 'observacoes' adicionada ao banco de dados!");
} catch (err) {
    // Ignora silenciosamente, a coluna já existe
}

console.log("✅ Banco de dados SQLite inicializado com sucesso!");

module.exports = db;