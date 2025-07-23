const TEMA_ATUAL = 1;

const TEMAS = {
    1: {
        cores: {
            backgroundPrincipal: '#99CC00',
            cardNormal: '#0F5C2E',
            cardPrioritario: '#F2660D',
            backgroundInterno: '#0D1212',
            textoEscuro: '#0D1212',
            textoClaro: '#99CC00',
            destaquePrioritario: '#F2660D',
            linksAtivos: '#00A117'
        },
        fontes: {
            impacto: 'Charlevoix Pro',
            destaque: 'Object Sans Heavy', 
            compacto: 'Druk Text Medio',
            corpo: 'Object Sans Heavy'
        },
        telao: {
            senhaAtual: { fonte: 'impacto', tamanho: '80px' },
            nome: { fonte: 'destaque', tamanho: '48px' },
            cpf: { fonte: 'compacto', tamanho: '32px' },
            balcao: { fonte: 'compacto', tamanho: '40px' },
            historico: { fonte: 'compacto', tamanho: '24px' }
        },
        normal: {
            background: 'cardNormal',
            textoSenha: { cor: 'textoClaro', fonte: 'destaque' },
            textoNome: { cor: 'textoClaro', fonte: 'compacto' }
        },
        prioritario: {
            background: 'cardPrioritario', 
            textoSenha: { cor: 'textoClaro', fonte: 'impacto' },
            textoNome: { cor: 'textoClaro', fonte: 'destaque' }
        }
    }
};

function obterTemaAtual() {
    return TEMAS[TEMA_ATUAL];
}

function obterCorTema(nomeCor) {
    const tema = obterTemaAtual();
    return tema.cores[nomeCor] || '#000000';
}

function obterFonteTema(nomeFonte) {
    const tema = obterTemaAtual();
    return tema.fontes[nomeFonte] || 'Arial, sans-serif';
}

function aplicarTemaNoTelao() {
    const tema = obterTemaAtual();
    
    const style = document.createElement('style');
    style.id = 'tema-dinamico';
    
    style.textContent = `
        :root {
            --cor-background-principal: ${tema.cores.backgroundPrincipal};
            --cor-card-normal: ${tema.cores.cardNormal};
            --cor-card-prioritario: ${tema.cores.cardPrioritario};
            --cor-background-interno: ${tema.cores.backgroundInterno};
            --cor-texto-escuro: ${tema.cores.textoEscuro};
            --cor-texto-claro: ${tema.cores.textoClaro};
            --cor-destaque-prioritario: ${tema.cores.destaquePrioritario};
            --cor-links-ativos: ${tema.cores.linksAtivos};
            
            --fonte-impacto: '${tema.fontes.impacto}', Arial, sans-serif;
            --fonte-destaque: '${tema.fontes.destaque}', Arial, sans-serif;
            --fonte-compacto: '${tema.fontes.compacto}', Arial, sans-serif;
            --fonte-corpo: '${tema.fontes.corpo}', Arial, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, ${tema.cores.backgroundInterno}, ${tema.cores.backgroundPrincipal});
        }
        
        .nome-destaque h2 {
            font-family: var(--fonte-destaque);
            font-size: ${tema.telao.nome.tamanho};
        }
        
        .senha-referencia span#senhaAtualNumero {
            font-family: var(--fonte-impacto);
            font-size: ${tema.telao.senhaAtual.tamanho};
        }
        
        .pessoa-info p {
            font-family: var(--fonte-compacto);
            font-size: ${tema.telao.cpf.tamanho};
        }
        
        .balcao-info {
            font-family: var(--fonte-compacto);
            font-size: ${tema.telao.balcao.tamanho} !important;
        }
        
        .ultima-senha {
            font-family: var(--fonte-compacto);
        }
        
        .ultima-nome {
            font-family: var(--fonte-compacto);
            font-size: ${tema.telao.historico.tamanho} !important;
        }
    `;
    
    const existingStyle = document.getElementById('tema-dinamico');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    document.head.appendChild(style);
}

function aplicarEstiloSenha(elemento, tipo) {
    const tema = obterTemaAtual();
    const config = tipo === 'P' ? tema.prioritario : tema.normal;
    
    const corBackground = tema.cores[config.background];
    const corTexto = tema.cores[config.textoSenha.cor];
    const fonte = tema.fontes[config.textoSenha.fonte];
    
    if (elemento) {
        elemento.style.background = corBackground;
        elemento.style.color = corTexto;
        elemento.style.fontFamily = `'${fonte}', Arial, sans-serif`;
    }
}

function aplicarEstiloNome(elemento, tipo) {
    const tema = obterTemaAtual();
    const config = tipo === 'P' ? tema.prioritario : tema.normal;
    
    const corTexto = tema.cores[config.textoNome.cor];
    const fonte = tema.fontes[config.textoNome.fonte];
    
    if (elemento) {
        elemento.style.color = corTexto;
        elemento.style.fontFamily = `'${fonte}', Arial, sans-serif`;
    }
}