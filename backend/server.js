const express = require('express');
const cors = require('cors');
const path = require('path');
const { query, gerarProximaSenha, mascararCPF } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// GET /api/assuntos - Retorna lista de assuntos
app.get('/api/assuntos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM assuntos ORDER BY descricao');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar assuntos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/senha - Gera nova senha
app.post('/api/senha', async (req, res) => {
  try {
    const { nome, cpf, tipo, assunto_id } = req.body;

    if (!nome || !cpf || !tipo || !assunto_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, cpf, tipo, assunto_id' });
    }

    if (cpf.length !== 11 || !/^\d+$/.test(cpf)) {
      return res.status(400).json({ error: 'CPF deve conter 11 dígitos' });
    }

    if (!['N', 'P'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser N (Normal) ou P (Prioritário)' });
    }

    const senha = await gerarProximaSenha(tipo);

    const result = await query(
      `INSERT INTO pessoas_atendimento (nome, cpf, tipo, assunto_id, senha) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, cpf, tipo, assunto_id, senha]
    );

    res.json({
      ...result.rows[0],
      cpf: mascararCPF(cpf)
    });
  } catch (error) {
    console.error('Erro ao gerar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/fila/:balcao_id - Retorna próxima senha na fila
app.get('/api/fila/:balcao_id', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, a.descricao as assunto 
       FROM pessoas_atendimento p 
       JOIN assuntos a ON p.assunto_id = a.id 
       WHERE p.status = 'aguardando' 
       AND p.data_senha = CURRENT_DATE 
       ORDER BY 
         CASE WHEN p.tipo = 'P' THEN 1 ELSE 2 END,
         p.criado_em ASC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({ proximaSenha: null });
    }

    const proximaSenha = {
      ...result.rows[0],
      cpf: mascararCPF(result.rows[0].cpf)
    };

    res.json({ proximaSenha });
  } catch (error) {
    console.error('Erro ao buscar próxima senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/chamar/:balcao_id - Chama próxima senha
app.post('/api/chamar/:balcao_id', async (req, res) => {
  try {
    const balcao_id = parseInt(req.params.balcao_id);

    const proximaSenha = await query(
      `SELECT * FROM pessoas_atendimento 
       WHERE status = 'aguardando' 
       AND data_senha = CURRENT_DATE 
       ORDER BY 
         CASE WHEN tipo = 'P' THEN 1 ELSE 2 END,
         criado_em ASC 
       LIMIT 1`
    );

    if (proximaSenha.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhuma senha na fila' });
    }

    const pessoa = proximaSenha.rows[0];

    await query('BEGIN');

    await query(
      'UPDATE pessoas_atendimento SET status = $1 WHERE status = $2',
      ['finalizado', 'atendendo']
    );

    await query(
      'UPDATE pessoas_atendimento SET status = $1 WHERE id = $2',
      ['atendendo', pessoa.id]
    );

    await query(
      'INSERT INTO historico_chamadas (pessoa_atendimento_id, balcao_id) VALUES ($1, $2)',
      [pessoa.id, balcao_id]
    );

    await query('COMMIT');

    res.json({
      ...pessoa,
      cpf: mascararCPF(pessoa.cpf)
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Erro ao chamar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/telao - Retorna dados para exibição no telão
app.get('/api/telao', async (req, res) => {
  try {
    const senhaAtual = await query(
      `SELECT p.*, a.descricao as assunto, b.nome as balcao_nome
       FROM pessoas_atendimento p 
       JOIN assuntos a ON p.assunto_id = a.id 
       LEFT JOIN historico_chamadas h ON p.id = h.pessoa_atendimento_id
       LEFT JOIN balcoes b ON h.balcao_id = b.id
       WHERE p.status = 'atendendo' 
       AND p.data_senha = CURRENT_DATE 
       ORDER BY h.chamado_em DESC 
       LIMIT 1`
    );

    const ultimasChamadas = await query(
      `SELECT p.senha, p.nome, b.nome as balcao_nome, h.chamado_em
       FROM historico_chamadas h
       JOIN pessoas_atendimento p ON h.pessoa_atendimento_id = p.id
       JOIN balcoes b ON h.balcao_id = b.id
       WHERE p.data_senha = CURRENT_DATE
       ORDER BY h.chamado_em DESC
       LIMIT 3`
    );

    res.json({
      senhaAtual: senhaAtual.rows.length > 0 ? {
        ...senhaAtual.rows[0],
        cpf: mascararCPF(senhaAtual.rows[0].cpf)
      } : null,
      ultimasChamadas: ultimasChamadas.rows.map(row => ({
        ...row,
        cpf: row.cpf ? mascararCPF(row.cpf) : null
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar dados do telão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/historico/:balcao_id - Retorna histórico do balcão
app.get('/api/historico/:balcao_id', async (req, res) => {
  try {
    const balcao_id = parseInt(req.params.balcao_id);

    const result = await query(
      `SELECT p.senha, p.nome, p.cpf, a.descricao as assunto, h.chamado_em
       FROM historico_chamadas h
       JOIN pessoas_atendimento p ON h.pessoa_atendimento_id = p.id
       JOIN assuntos a ON p.assunto_id = a.id
       WHERE h.balcao_id = $1 
       AND p.data_senha = CURRENT_DATE
       ORDER BY h.chamado_em DESC
       LIMIT 5`,
      [balcao_id]
    );

    const historico = result.rows.map(row => ({
      ...row,
      cpf: mascararCPF(row.cpf)
    }));

    res.json({ historico });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para servir páginas específicas
app.get('/atendente', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/atendente/index.html'));
});

app.get('/balcao/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/balcao/index.html'));
});

app.get('/telao', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/telao/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});