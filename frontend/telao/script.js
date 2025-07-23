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

    abreviarNomeSeNecessario(nomeCompleto) {
        const LIMITE_CARACTERES = 28;
        
        if (!nomeCompleto || nomeCompleto.length <= LIMITE_CARACTERES) {
            return nomeCompleto;
        }
        
        const palavras = nomeCompleto.trim().split(/\s+/);
        
        if (palavras.length <= 2) {
            return nomeCompleto;
        }
        
        const primeiroNome = palavras[0];
        const ultimoSobrenome = palavras[palavras.length - 1];
        const nomesMeio = palavras.slice(1, -1);
        
        const iniciais = nomesMeio.map(nome => {
            if (nome.toLowerCase() === 'de' || nome.toLowerCase() === 'da' || 
                nome.toLowerCase() === 'do' || nome.toLowerCase() === 'dos' || 
                nome.toLowerCase() === 'das') {
                return nome.toLowerCase();
            }
            return nome.charAt(0).toUpperCase() + '.';
        });
        
        const nomeAbreviado = [primeiroNome, ...iniciais, ultimoSobrenome].join(' ');
        
        return nomeAbreviado;
    }

    atualizarInterface(data) {
        this.atualizarSenhaAtual(data.senhaAtual);
        this.atualizarUltimasChamadas(data.ultimasChamadas);
    }

    atualizarSenhaAtual(senhaAtual) {
        const nomeDestaque = this.elementos.senhaAtualNome.parentElement;
        
        if (senhaAtual) {
            this.elementos.senhaAtualNumero.textContent = senhaAtual.senha;
            const nomeAbreviado = this.abreviarNomeSeNecessario(senhaAtual.nome);
            this.elementos.senhaAtualNome.textContent = nomeAbreviado.toUpperCase();
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