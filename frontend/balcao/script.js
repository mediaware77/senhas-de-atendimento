class BalcaoInterface {
    constructor() {
        this.balcaoId = this.obterBalcaoId();
        this.proximaSenha = null;
        this.intervalId = null;
        
        this.elementos = {
            titulo: document.getElementById('balcaoTitulo'),
            proximaSenhaCard: document.getElementById('proximaSenhaCard'),
            proximaSenhaNumero: document.getElementById('proximaSenhaNumero'),
            proximaSenhaNome: document.getElementById('proximaSenhaNome'),
            proximaSenhaCpf: document.getElementById('proximaSenhaCpf'),
            proximaSenhaAssunto: document.getElementById('proximaSenhaAssunto'),
            chamarBtn: document.getElementById('chamarBtn'),
            historicoLista: document.getElementById('historicoLista'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error')
        };

        this.init();
    }

    obterBalcaoId() {
        const path = window.location.pathname;
        const match = path.match(/\/balcao\/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }

    init() {
        this.elementos.titulo.textContent = `Balcão ${this.balcaoId}`;
        this.configurarEventos();
        this.iniciarAtualizacaoAutomatica();
        this.atualizarDados();
    }

    configurarEventos() {
        this.elementos.chamarBtn.addEventListener('click', () => this.chamarProximaSenha());
    }

    iniciarAtualizacaoAutomatica() {
        this.intervalId = setInterval(() => {
            this.atualizarDados();
        }, 3000);
    }

    async atualizarDados() {
        try {
            await Promise.all([
                this.carregarProximaSenha(),
                this.carregarHistorico()
            ]);
        } catch (error) {
            console.error('Erro na atualização automática:', error);
        }
    }

    async carregarProximaSenha() {
        try {
            const response = await fetch(`/api/fila/${this.balcaoId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar próxima senha');
            }

            this.proximaSenha = data.proximaSenha;
            this.atualizarInterfaceProximaSenha();

        } catch (error) {
            console.error('Erro ao carregar próxima senha:', error);
            this.mostrarSemSenha();
        }
    }

    atualizarInterfaceProximaSenha() {
        if (this.proximaSenha) {
            this.elementos.proximaSenhaNumero.textContent = this.proximaSenha.senha;
            this.elementos.proximaSenhaNome.textContent = this.proximaSenha.nome;
            this.elementos.proximaSenhaCpf.textContent = this.proximaSenha.cpf;
            this.elementos.proximaSenhaAssunto.textContent = this.proximaSenha.assunto;
            
            this.elementos.proximaSenhaCard.classList.remove('sem-senha');
            this.elementos.chamarBtn.disabled = false;
            this.elementos.chamarBtn.textContent = 'Chamar Próxima Senha';
        } else {
            this.mostrarSemSenha();
        }
    }

    mostrarSemSenha() {
        this.elementos.proximaSenhaNumero.textContent = '-';
        this.elementos.proximaSenhaNome.textContent = 'Nenhuma senha na fila';
        this.elementos.proximaSenhaCpf.textContent = '-';
        this.elementos.proximaSenhaAssunto.textContent = '-';
        
        this.elementos.proximaSenhaCard.classList.add('sem-senha');
        this.elementos.chamarBtn.disabled = true;
        this.elementos.chamarBtn.textContent = 'Fila Vazia';
    }

    async chamarProximaSenha() {
        if (!this.proximaSenha) return;

        this.mostrarLoading(true);
        this.esconderError();

        try {
            const response = await fetch(`/api/chamar/${this.balcaoId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao chamar senha');
            }

            await this.atualizarDados();
            this.mostrarSucesso(`Senha ${data.senha} chamada com sucesso!`);

        } catch (error) {
            this.mostrarError('Erro ao chamar senha: ' + error.message);
        } finally {
            this.mostrarLoading(false);
        }
    }

    async carregarHistorico() {
        try {
            const response = await fetch(`/api/historico/${this.balcaoId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar histórico');
            }

            this.atualizarInterfaceHistorico(data.historico);

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            this.elementos.historicoLista.innerHTML = '<div class="sem-dados">Erro ao carregar histórico</div>';
        }
    }

    atualizarInterfaceHistorico(historico) {
        if (historico.length === 0) {
            this.elementos.historicoLista.innerHTML = '<div class="sem-dados">Nenhuma chamada hoje</div>';
            return;
        }

        const html = historico.map(item => `
            <div class="historico-item">
                <div class="historico-item-header">
                    <span class="historico-senha">${item.senha}</span>
                    <span class="historico-tempo">${this.formatarTempo(item.chamado_em)}</span>
                </div>
                <div class="historico-info">
                    <strong>${item.nome}</strong> - ${item.cpf}<br>
                    <small>${item.assunto}</small>
                </div>
            </div>
        `).join('');

        this.elementos.historicoLista.innerHTML = html;
    }

    formatarTempo(timestamp) {
        const data = new Date(timestamp);
        return data.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    mostrarLoading(show) {
        this.elementos.loading.style.display = show ? 'flex' : 'none';
        this.elementos.chamarBtn.disabled = show || !this.proximaSenha;
        
        if (show) {
            this.elementos.chamarBtn.textContent = 'Chamando...';
        }
    }

    mostrarError(message) {
        this.elementos.error.textContent = message;
        this.elementos.error.style.display = 'block';
        
        setTimeout(() => {
            this.esconderError();
        }, 5000);
    }

    mostrarSucesso(message) {
        this.elementos.error.style.backgroundColor = '#d4edda';
        this.elementos.error.style.color = '#155724';
        this.elementos.error.style.borderColor = '#c3e6cb';
        this.elementos.error.textContent = message;
        this.elementos.error.style.display = 'block';
        
        setTimeout(() => {
            this.esconderError();
        }, 3000);
    }

    esconderError() {
        this.elementos.error.style.display = 'none';
        this.elementos.error.style.backgroundColor = '#f8d7da';
        this.elementos.error.style.color = '#721c24';
        this.elementos.error.style.borderColor = '#f5c6cb';
    }
}

window.addEventListener('beforeunload', () => {
    if (window.balcaoInterface && window.balcaoInterface.intervalId) {
        clearInterval(window.balcaoInterface.intervalId);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.balcaoInterface = new BalcaoInterface();
});