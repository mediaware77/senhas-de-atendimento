## VISÃO GERAL
Sistema simples para gerenciamento de senhas de atendimento no Procon, rodando em servidor em nuvem.
**Objetivo**: organizar a retirada, chamada e exibição de senhas em 6 balcões, com 1 telão central para o público.

## PERFIS DE USUÁRIO
- **Atendente**: registra Nome, CPF, Tipo (Normal/Prioritário) e Assunto
- **Balcão**: funcionário chama a próxima senha
- **Público**: apenas visualiza no telão quem está sendo atendido
- **SEM AUTENTICAÇÃO INICIAL** (implementar depois)

## ESTRUTURA DE DIRETÓRIOS
```
/Users/melque/Projetos/senhas/
├── database/
│   ├── create_tables.sql
│   └── seed_data.sql
├── backend/
│   ├── server.js
│   ├── db.js
│   └── package.json
├── frontend/
│   ├── index.html (página inicial com links)
│   ├── atendente/
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── balcao/
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── telao/
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── package.json
│   └── vite.config.js
```

## PÁGINAS DO SISTEMA
1. `/` - Página inicial com links para todas as interfaces
2. `/atendente` - Interface do atendente (retirar senha)
3. `/balcao/1`, `/balcao/2`, ... `/balcao/6` - Interfaces dos 6 balcões específicos
4. `/telao` - Tela do telão público

## BANCO DE DADOS (PostgreSQL)

### Conexão
- Host: [A DEFINIR - deixar variável no código]
- User: [A DEFINIR - deixar variável no código]  
- Password: [A DEFINIR - deixar variável no código]
- Database: [A DEFINIR - deixar variável no código]

### Tabelas

#### pessoas_atendimento
```sql
id SERIAL PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
cpf VARCHAR(11) NOT NULL,
tipo CHAR(1) NOT NULL CHECK (tipo IN ('N', 'P')), -- N=Normal, P=Prioritário
assunto_id INTEGER REFERENCES assuntos(id),
senha VARCHAR(10) NOT NULL, -- Ex: N001, P001
status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'atendendo', 'finalizado')),
criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
data_senha DATE DEFAULT CURRENT_DATE -- Para reset diário
```

#### balcoes
```sql
id SERIAL PRIMARY KEY,
nome VARCHAR(50) NOT NULL -- Ex: 'Balcão 1', 'Balcão 2'
```

#### historico_chamadas
```sql
id SERIAL PRIMARY KEY,
pessoa_atendimento_id INTEGER REFERENCES pessoas_atendimento(id),
balcao_id INTEGER REFERENCES balcoes(id),
chamado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### assuntos
```sql
id SERIAL PRIMARY KEY,
descricao VARCHAR(255) NOT NULL
```

### Dados Iniciais (seed_data.sql)
```sql
-- Balcões
INSERT INTO balcoes (nome) VALUES 
('Balcão 1'), ('Balcão 2'), ('Balcão 3'), 
('Balcão 4'), ('Balcão 5'), ('Balcão 6');

-- Assuntos
INSERT INTO assuntos (descricao) VALUES 
('Reclamação'), ('Informação'), ('Denúncia'), 
('Solicitação'), ('Orientação'), ('Outros');
```

## REGRAS DE NEGÓCIO

### Geração de Senhas
- **Normal**: N001, N002, N003... (resetam diariamente)
- **Prioritário**: P001, P002, P003... (resetam diariamente)
- **Reset**: Todo dia à meia-noite automaticamente
- **Sem limite diário** de senhas

### Priorização
- **Prioritário sempre antes de normal**
- Ordem: todas as senhas P pendentes, depois todas as N pendentes
- Dentro do mesmo tipo: ordem cronológica de criação

### Exibição de Dados
- **CPF mascarado**: 999.xxx.xxx-99 (primeiros 3 e últimos 2 dígitos)
- **Nome completo** no telão
- **Telão atualiza automaticamente** quando balcão chama

### Fluxo de Atendimento
1. Atendente registra pessoa → status 'aguardando'
2. Balconista chama próxima senha → status 'atendendo' + registro no histórico
3. **Não há funcionalidade de \"finalizar\"** - quando chama próxima, a anterior sai automaticamente

## TECNOLOGIAS

### Frontend
- **JavaScript puro + Vite**
- **Funcionalidade > aparência** (mínimo usável)
- **Polling simples** a cada 2-3 segundos para atualização em tempo real
- **Sem frameworks** pesados

### Backend
- **Node.js simples**
- **Express mínimo** apenas para servir arquivos estáticos
- **Queries SQL diretas** (sem ORM)
- **pg (node-postgres)** para conexão PostgreSQL

## FUNCIONALIDADES POR INTERFACE

### Interface do Atendente (/atendente)
**Campos do formulário:**
- Nome (input text, obrigatório)
- CPF (input text com máscara, obrigatório, validação básica)
- Tipo: Radio buttons (Normal/Prioritário)
- Assunto: Select dropdown (buscar da tabela assuntos)
- Botão \"Gerar Senha\"

**Comportamento:**
- Ao submeter: gera próxima senha sequencial do tipo
- Exibe a senha gerada para o usuário
- Limpa formulário para próximo atendimento

### Interface do Balcão (/balcao/[1-6])
**Exibição:**
- Identificação do balcão (ex: \"Balcão 3\")
- Próxima senha na fila (com nome e CPF mascarado)
- Botão \"Chamar Próxima Senha\"
- Lista das últimas 5 senhas chamadas neste balcão

**Comportamento:**
- Busca próxima senha (prioritário primeiro)
- Ao chamar: atualiza status e registra no histórico
- **Não pode pular senhas** - apenas próxima da fila
- Atualização automática da lista

### Interface do Telão (/telao)
**Layout para TV 50\":**
- **Destaque grande**: Senha atual sendo atendida + Nome + CPF mascarado + Balcão
- **Lista pequena**: Últimas 3 chamadas (contexto)
- **Atualização automática** a cada 2 segundos
- **Fonte grande** e **cores contrastantes** para visibilidade

**Não exibe:**
- Quantidade de pessoas na fila
- Senhas futuras (apenas atual e histórico)

## ENDPOINTS DA API

### GET /api/assuntos
Retorna lista de assuntos para o dropdown

### POST /api/senha
Body: {nome, cpf, tipo, assunto_id}
Gera nova senha e retorna dados

### GET /api/fila/:balcao_id
Retorna próxima senha na fila para o balcão específico

### POST /api/chamar/:balcao_id
Chama próxima senha no balcão específico

### GET /api/telao
Retorna dados para exibição no telão (senha atual + últimas 3)

### GET /api/historico/:balcao_id
Retorna últimas chamadas do balcão específico

## CONSIDERAÇÕES TÉCNICAS

### Reset Diário
- Implementar via CRON job ou verificação na geração de senha
- Verificar se já existe senha para data atual, senão resetar contador

### Validações
- CPF: validação básica de formato (11 dígitos)
- Campos obrigatórios: nome, cpf, tipo, assunto
- Máscara de CPF automática nos inputs

### Performance
- Polling leve (apenas dados necessários)
- Índices no banco: data_senha, status, tipo, criado_em
- Limpeza periódica de dados antigos (implementar depois)

### Deploy
- **Servidor em nuvem** (VPS)
- **Deploy direto** (sem Docker inicialmente)
- Variáveis de ambiente para configuração do banco
- PM2 para manter Node.js rodando

## ORDEM DE IMPLEMENTAÇÃO
1. Scripts SQL (database/)
2. Backend básico (server.js + db.js)
3. Frontend - Página inicial (index.html)
4. Frontend - Interface atendente
5. Frontend - Interface balcão
6. Frontend - Interface telão
7. Testes e ajustes
8. Documentação de deploy

## NOTAS IMPORTANTES
- **Manter tudo o mais simples possível**
- **Quebrar código em arquivos pequenos**
- **Priorizar funcionalidade sobre aparência**
- **Deixar espaço para melhorias futuras** (login, relatórios, customização)
- **Comentar código adequadamente**
- **Tratar erros básicos** (conexão banco, validações)
`
}


