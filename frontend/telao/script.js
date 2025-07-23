class TelaoInterface {
    constructor() {
        this.intervalId = null;
        this.clockIntervalId = null;
        this.isConnected = true;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.elementos = {
            dataAtual: document.getElementById('dataAtual'),
            horaAtual: document.getElementById('horaAtual'),
            senhaAtualNumero: document.getElementById('senhaAtualNumero'),
            senhaAtualNome: document.getElementById('senhaAtualNome'),
            senhaAtualCpf: document.getElementById('senhaAtualCpf'),
            senhaAtualBalcao: document.getElementById('senhaAtualBalcao'),
            ultimasLista: document.getElementById('ultimasLista'),
            connectionError: document.getElementById('connectionError')
        };

        this.init();
    }

    init() {
        this.iniciarRelogio();
        this.iniciarAtualizacaoAutomatica();
        this.atualizarDados();
    }

    iniciarRelogio() {
        this.atualizarRelogio();
        this.clockIntervalId = setInterval(() => {
            this.atualizarRelogio();
        }, 1000);
    }

    atualizarRelogio() {
        const agora = new Date();
        
        const dataFormatada = agora.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const horaFormatada = agora.toLocaleTimeString('pt-BR');
        
        this.elementos.dataAtual.textContent = dataFormatada.toUpperCase();
        this.elementos.horaAtual.textContent = horaFormatada;
    }

    iniciarAtualizacaoAutomatica() {
        this.intervalId = setInterval(() => {
            this.atualizarDados();
        }, 2000);
    }

    async atualizarDados() {
        try {
            const response = await fetch('/api/telao');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            this.atualizarInterface(data);
            this.marcarConectado();
            this.retryCount = 0;
            
        } catch (error) {
            console.error('Erro ao atualizar dados do telão:', error);
            this.marcarDesconectado();
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => {
                    this.atualizarDados();
                }, 5000);
            }
        }
    }

    atualizarInterface(data) {
        this.atualizarSenhaAtual(data.senhaAtual);
        this.atualizarUltimasChamadas(data.ultimasChamadas);
    }

    atualizarSenhaAtual(senhaAtual) {
        const nomeDestaque = this.elementos.senhaAtualNome.parentElement;
        
        if (senhaAtual) {
            this.elementos.senhaAtualNumero.textContent = senhaAtual.senha;
            this.elementos.senhaAtualNome.textContent = senhaAtual.nome.toUpperCase();
            this.elementos.senhaAtualCpf.textContent = senhaAtual.cpf;
            this.elementos.senhaAtualBalcao.textContent = senhaAtual.balcao_nome.toUpperCase();
            
            nomeDestaque.classList.remove('sem-dados');
            
        } else {
            this.elementos.senhaAtualNumero.textContent = '---';
            this.elementos.senhaAtualNome.textContent = 'AGUARDANDO PRÓXIMA CHAMADA...';
            this.elementos.senhaAtualCpf.textContent = '';
            this.elementos.senhaAtualBalcao.textContent = '';
            
            nomeDestaque.classList.add('sem-dados');
        }
    }

    atualizarUltimasChamadas(ultimasChamadas) {
        if (!ultimasChamadas || ultimasChamadas.length === 0) {
            this.elementos.ultimasLista.innerHTML = '<div class="sem-dados">Nenhuma chamada registrada hoje</div>';
            return;
        }

        const html = ultimasChamadas.map(chamada => `
            <div class="ultima-item">
                <div class="ultima-item-header">
                    <span class="ultima-senha">${chamada.senha}</span>
                    <span class="ultima-balcao">${chamada.balcao_nome}</span>
                </div>
                <div class="ultima-nome">${chamada.nome.toUpperCase()}</div>
            </div>
        `).join('');

        this.elementos.ultimasLista.innerHTML = html;
    }

    marcarConectado() {
        if (!this.isConnected) {
            this.isConnected = true;
            this.elementos.connectionError.style.display = 'none';
        }
    }

    marcarDesconectado() {
        if (this.isConnected) {
            this.isConnected = false;
            this.elementos.connectionError.style.display = 'flex';
        }
    }

    destruir() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (this.clockIntervalId) {
            clearInterval(this.clockIntervalId);
        }
    }
}

window.addEventListener('beforeunload', () => {
    if (window.telaoInterface) {
        window.telaoInterface.destruir();
    }
});

window.addEventListener('focus', () => {
    if (window.telaoInterface) {
        window.telaoInterface.atualizarDados();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.telaoInterface = new TelaoInterface();
});