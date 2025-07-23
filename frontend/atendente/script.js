class AtendenteInterface {
    constructor() {
        this.form = document.getElementById('senhaForm');
        this.cpfInput = document.getElementById('cpf');
        this.assuntoSelect = document.getElementById('assunto');
        this.resultado = document.getElementById('resultado');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        
        this.init();
    }

    init() {
        this.carregarAssuntos();
        this.configurarEventos();
        this.aplicarMascaraCPF();
    }

    async carregarAssuntos() {
        try {
            const response = await fetch('/api/assuntos');
            const assuntos = await response.json();
            
            this.assuntoSelect.innerHTML = '<option value="">Selecione um assunto</option>';
            assuntos.forEach(assunto => {
                const option = document.createElement('option');
                option.value = assunto.id;
                option.textContent = assunto.descricao;
                this.assuntoSelect.appendChild(option);
            });
        } catch (error) {
            this.mostrarError('Erro ao carregar assuntos: ' + error.message);
        }
    }

    configurarEventos() {
        this.form.addEventListener('submit', (e) => this.gerarSenha(e));
        
        const btnNova = document.getElementById('novaSenh');
        btnNova.addEventListener('click', () => this.limparFormulario());
    }

    aplicarMascaraCPF() {
        this.cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }

    async gerarSenha(event) {
        event.preventDefault();

        const formData = new FormData(this.form);
        const dados = {
            nome: formData.get('nome').trim(),
            cpf: formData.get('cpf').replace(/\D/g, ''),
            tipo: formData.get('tipo'),
            assunto_id: parseInt(formData.get('assunto'))
        };

        if (!this.validarDados(dados)) {
            return;
        }

        this.mostrarLoading(true);
        this.esconderError();

        try {
            const response = await fetch('/api/senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao gerar senha');
            }

            await this.exibirResultado(result);

        } catch (error) {
            this.mostrarError('Erro ao gerar senha: ' + error.message);
        } finally {
            this.mostrarLoading(false);
        }
    }

    validarDados(dados) {
        if (!dados.nome) {
            this.mostrarError('Nome é obrigatório');
            return false;
        }

        if (!dados.cpf || dados.cpf.length !== 11) {
            this.mostrarError('CPF deve conter 11 dígitos');
            return false;
        }

        if (!dados.tipo) {
            this.mostrarError('Tipo de atendimento é obrigatório');
            return false;
        }

        if (!dados.assunto_id) {
            this.mostrarError('Assunto é obrigatório');
            return false;
        }

        return true;
    }

    async exibirResultado(dados) {
        const assuntoSelect = this.assuntoSelect;
        const assuntoTexto = assuntoSelect.options[assuntoSelect.selectedIndex].text;
        const tipoTexto = dados.tipo === 'P' ? 'Prioritário' : 'Normal';

        document.getElementById('senhaNumero').textContent = dados.senha;
        document.getElementById('senhaNome').textContent = dados.nome;
        document.getElementById('senhaCpf').textContent = dados.cpf;
        document.getElementById('senhaTipo').textContent = tipoTexto;
        document.getElementById('senhaAssunto').textContent = assuntoTexto;

        this.resultado.style.display = 'block';
        this.form.style.display = 'none';
    }

    limparFormulario() {
        this.form.reset();
        this.resultado.style.display = 'none';
        this.form.style.display = 'block';
        this.esconderError();
        
        document.querySelector('input[name="tipo"][value="N"]').checked = true;
    }

    mostrarLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = show;
        submitBtn.textContent = show ? 'Gerando...' : 'Gerar Senha';
    }

    mostrarError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
        
        setTimeout(() => {
            this.esconderError();
        }, 5000);
    }

    esconderError() {
        this.error.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AtendenteInterface();
});