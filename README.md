# Sistema de Senhas - Procon

Sistema simples para gerenciamento de senhas de atendimento no Procon, desenvolvido para rodar em servidor em nuvem.

## Visão Geral

O sistema organiza a retirada, chamada e exibição de senhas em 6 balcões, com 1 telão central para o público.

### Funcionalidades

- **Interface do Atendente**: Registra pessoas e gera senhas
- **Interface dos Balcões**: 6 balcões independentes para chamar senhas
- **Telão Público**: Exibe senha atual sendo atendida e histórico
- **Priorização**: Senhas prioritárias (P) sempre antes das normais (N)
- **Reset Diário**: Senhas resetam automaticamente todo dia

## Tecnologias

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: JavaScript puro + Vite
- **Banco**: PostgreSQL com queries diretas

## Estrutura do Projeto

```
├── database/           # Scripts SQL
├── backend/           # Servidor Node.js
└── frontend/          # Interfaces web
    ├── atendente/     # Interface para gerar senhas
    ├── balcao/        # Interface dos balcões
    └── telao/         # Interface do telão público
```

## Configuração

### 1. Banco de Dados PostgreSQL

Configure as variáveis de ambiente:

```bash
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=sua_senha
export DB_NAME=senhas_procon
export DB_PORT=5432
```

Execute os scripts SQL:

```bash
psql -d senhas_procon -f database/create_tables.sql
psql -d senhas_procon -f database/seed_data.sql
```

### 2. Backend

```bash
cd backend
npm install
npm start
```

O servidor roda na porta 3000 por padrão.

### 3. Frontend (Desenvolvimento)

```bash
cd frontend
npm install
npm run dev
```

Para produção:

```bash
npm run build
```

## Uso

1. **Página inicial**: `http://localhost:3000/`
2. **Atendente**: `http://localhost:3000/atendente`
3. **Balcões**: `http://localhost:3000/balcao/[1-6]`
4. **Telão**: `http://localhost:3000/telao`

## Deploy em Produção

### 1. VPS/Servidor

1. Clone o repositório
2. Configure variáveis de ambiente do PostgreSQL
3. Instale dependências: `cd backend && npm install --production`
4. Build do frontend: `cd frontend && npm install && npm run build`
5. Use PM2 para manter o servidor rodando:

```bash
npm install -g pm2
pm2 start backend/server.js --name senhas-procon
pm2 startup
pm2 save
```

### 2. Configuração do Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## API Endpoints

- `GET /api/assuntos` - Lista de assuntos
- `POST /api/senha` - Gera nova senha
- `GET /api/fila/:balcao_id` - Próxima senha na fila
- `POST /api/chamar/:balcao_id` - Chama próxima senha
- `GET /api/telao` - Dados para o telão
- `GET /api/historico/:balcao_id` - Histórico do balcão

## Regras de Negócio

### Senhas
- **Normal**: N001, N002, N003...
- **Prioritário**: P001, P002, P003...
- Reset automático diário à meia-noite

### Priorização
- Prioritário sempre antes de normal
- Dentro do mesmo tipo: ordem cronológica

### CPF
- Mascaramento: 999.xxx.xxx-99
- Validação básica de formato

## Manutenção

### Logs
```bash
pm2 logs senhas-procon
```

### Restart
```bash
pm2 restart senhas-procon
```

### Backup do Banco
```bash
pg_dump senhas_procon > backup.sql
```

## Melhorias Futuras

- Sistema de autenticação
- Relatórios gerenciais
- Configurações personalizáveis
- Limpeza automática de dados antigos
- Notificações sonoras
- API para integração com outros sistemas