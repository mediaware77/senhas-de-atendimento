const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || process.env.USER || 'melque',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'senhas_procon',
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no client do banco:', err);
  process.exit(-1);
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function gerarProximaSenha(tipo) {
  const dataAtual = new Date().toISOString().split('T')[0];
  
  const result = await query(
    'SELECT COUNT(*) as count FROM pessoas_atendimento WHERE tipo = $1 AND data_senha = $2',
    [tipo, dataAtual]
  );
  
  const proximoNumero = parseInt(result.rows[0].count) + 1;
  return `${tipo}${proximoNumero.toString().padStart(3, '0')}`;
}

function mascararCPF(cpf) {
  if (!cpf || cpf.length !== 11) return cpf;
  return `${cpf.substring(0, 3)}.xxx.xxx-${cpf.substring(9, 11)}`;
}

module.exports = {
  query,
  gerarProximaSenha,
  mascararCPF
};