import * as fs from 'fs';


function lerArquivo(callback: (data: string) => void): void {
    fs.readFile('instance.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return;
        }
        callback(data);
    });
}

//ta funcionando tinindo também 
function contarDesigualdades(data: string): number {
    let linhas = data.split('\n').slice(1) //divide o arquivo em um array de linhas e ignora a primeira
    let contRestricao = 0

    for (const linha of linhas) {
        if(linha.includes('>=') || linha.includes('<=')) {
            contRestricao++ // conta as linhas com >= ou <=
        }
    }

    return contRestricao
}

/**funfando demais pra caralho */
function quantidadeEquacoes(data: string): number {
    let numEquacoes = 0
    let linhas = data.split('\n').slice(1) //divide o arquivo em um array de linhas e ignora a primeira

    for (const linha of linhas) {
        if(linha.includes('>=') || linha.includes('<=') || linha.includes('=')) {
            numEquacoes++ // conta as linhas com >= ou <= ou =
        }
    }

    return numEquacoes
}

function quantidadeVariaveis(data: string): number {
    let linha = data.split('\n')[0].trim() //pega a primeira linha do arquivo
    const index = linha.indexOf('=') //guarda a posição do = na linha (vai ser -1 se n encontrar)

    if (index !== -1) {
        linha = linha.slice(index + 1).trim(); // remove tudo antes do = e o = também
    }

    const quantidadeX = linha.split('').filter(char => char === 'x').length; //retorna a quantidade de x na linha

    return quantidadeX;
}

function montaMatrizCompleta(data: string): number[][] {
    const linhas = data.split('\n').slice(1).filter(linha => linha.trim() !== '');
    const tamLinha = linhas.length;
    const numVariaveis = quantidadeVariaveis(data);
    const numFolgas = contarDesigualdades(data);
    const numArtificiais = contarArtificiais(data);
    const tamColuna = numVariaveis + numFolgas + numArtificiais;
    
    let matrizA: number[][] = [];
    for (let i = 0; i < tamLinha; i++) {
        matrizA.push(new Array(tamColuna).fill(0));
    }

    let indiceFolga = numVariaveis;
    let indiceArtificial = numVariaveis + numFolgas;

    linhas.forEach((linha, i) => {
        linha = linha.trim();
        
        if (linha.includes('>=') || linha.includes('<=') || linha.includes('=')) {
            // Processa o lado esquerdo da equação
            const partesLinha = linha.split(/>=|<=|=/);
            const ladoEsquerdo = partesLinha[0].trim();
            const termos = ladoEsquerdo.split(/(?=[+-])/).filter(termo => termo.trim() !== '');

            termos.forEach(termo => {
                termo = termo.replace(/\s+/g, '');
                
                if (termo.includes('x')) {
                    // Processa variáveis originais (x)
                    const partes = termo.split('x');
                    const coeficiente = parseFloat(partes[0]) || (termo.startsWith('-') ? -1 : 1);
                    const indice = parseInt(partes[1], 10) - 1;
                    matrizA[i][indice] = coeficiente;
                } else if (termo.includes('s')) {
                    // Processa variáveis de folga/excesso (s)
                    const partes = termo.split('s');
                    const coeficiente = parseFloat(partes[0]) || (termo.startsWith('-') ? -1 : 1);
                    const indice = parseInt(partes[1], 10) - 1 + numVariaveis;
                    matrizA[i][indice] = coeficiente;
                } else if (termo.includes('a')) {
                    // Processa variáveis artificiais (a)
                    const partes = termo.split('a');
                    const coeficiente = parseFloat(partes[0]) || (termo.startsWith('-') ? -1 : 1);
                    const indice = parseInt(partes[1], 10) - 1 + numVariaveis + numFolgas;
                    matrizA[i][indice] = coeficiente;
                }
            });

            // Adiciona variáveis de folga/excesso e artificiais conforme necessário
            if (linha.includes('=')) {
                // Igualdade: adiciona variável artificial
                matrizA[i][indiceArtificial] = 1;
                indiceArtificial++;
            } else if (linha.includes('<=')) {
                // Menor ou igual: adiciona variável de folga
                matrizA[i][indiceFolga] = 1;
                indiceFolga++;
            } else if (linha.includes('>=')) {
                // Maior ou igual: adiciona variável de excesso e artificial
                matrizA[i][indiceFolga] = -1;
                matrizA[i][indiceArtificial] = 1;
                indiceFolga++;
                indiceArtificial++;
            }
        }
    });

    return matrizA;
}

/**tem que ver isso aqui também */
function contarArtificiais(data: string): number {
    // Conta o número de variáveis artificiais (a) e igualdades
    const linhas = data.split('\n').slice(1);
    let count = 0;
    
    linhas.forEach(linha => {
        // Conta variáveis artificiais explicitas (a1, a2, etc.)
        const artificiaisExplicitas = (linha.match(/a\d+/g) || []).length;
        count += artificiaisExplicitas;
        
        // Adiciona para igualdades que não têm variável artificial explícita
        if (linha.includes('=') && !linha.includes('a') && !linha.includes('<=') && !linha.includes('>=')) {
            count++;
        }
        
        // Adiciona para desigualdades >= que não têm variável artificial explícita
        if (linha.includes('>=') && !linha.includes('a')) {
            count++;
        }
    });
    
    return count;
}

function montaVetorB(data: string) : number[] {
    let vetorB: number[] = []
    const linhas = data.split('\n').slice(1).filter(linha => linha.trim() !== ''); //ignoranda a primeira linha e remove linhas vazias
    linhas.forEach((linha) => {
        linha = linha.trim() // remove os espaços em branco no começo e no final da linha
        if (linha.includes('>=') || linha.includes('<=') || linha.includes('=')) {
            const partesLinha = linha.split(/>=|<=|=/); // divide a linha em partes usando >=, <= ou =
            const ladoDireito = partesLinha[partesLinha.length - 1].trim(); // pega a parte direita da equação
            vetorB.push(parseFloat(ladoDireito)); // adiciona o valor ao vetor B
        }
    });
    return vetorB
}

function montaMatrizQuadrada(data: string, matriz: number[][]) : number[][] {
    const matrizQuadrada: number[][] = []
    const tam = quantidadeEquacoes(data)

    for (let i = 0; i < tam; i++) {
        matrizQuadrada.push(new Array(tam).fill(0)); // Inicializa cada linha da matriz quadrada com zeros
        for (let j = 0; j < tam; j++) {
            matrizQuadrada[i][j] = matriz[i][j]; // Copia os valores da matriz A para a matriz quadrada
        }
    }

    return matrizQuadrada
}

function multiplicaMatriz(matrizA: number[][], matrizB: number[][]) : number[][] {
    let matrizT : number[][] = []
    let mult : number = 0

    const linhasA = matrizA.length;
    const colunasA = matrizA[0].length;
    const linhasB = matrizB.length;
    const colunasB = matrizB[0].length;

    if (colunasA !== linhasB) {
        throw new Error("Número de colunas de A deve ser igual ao número de linhas de B");
    }
    
    for(var i=0; i<linhasA; i++) {
        matrizT[i] = [];
        for(var j=0; j<colunasB; j++) {
            mult = 0
            for (let k = 0; k < colunasA; k++) {
                mult += matrizA[i][k] * matrizB[k][i];
            }
            matrizT[i][j] = mult
        } 
    }
    return matrizT
}

function calculaDeterminante(matriz : number[][]) : number{
    const dimensao = matriz.length //linhas
    const colunas = matriz[0].length

    if(dimensao !== colunas) throw new Error("A matriz não é quadrada")
    if(dimensao == 1) return matriz[0][0]

    let determinante = 0
    const linha = 0
    for(let coluna=0; coluna<dimensao; coluna++) {
        determinante += matriz[linha][coluna] * cofator(linha, coluna, matriz);
    }

    return determinante
}

/*tem que ver como q ta funcionando isso aqui*/
function subMatriz(matriz: number[][], linha: number, coluna: number): number[][] {
    const subMatriz: number[][] = [];

    for (let i = 0; i < matriz.length; i++) {
        if (i === linha) continue; // Ignora a linha especificada

        const novaLinha: number[] = [];
        for (let j = 0; j < matriz[i].length; j++) {
            if (j === coluna) continue; // Ignora a coluna especificada
            novaLinha.push(matriz[i][j]); // Adiciona o elemento à nova linha
        }
        subMatriz.push(novaLinha); // Adiciona a nova linha à submatriz
    }

    return subMatriz;
}

function cofator(i: number, j: number, matriz: number[][]): number {
  const sub = subMatriz(matriz, i, j);
  return ((-1) ** (i + j)) * calculaDeterminante(sub);
}


function matrizInversa(matriz: number[][]): number[][] {
    if(matriz[0].length !== matriz.length) {
        throw new Error('A matriz deve ser quadrada')
    }

    const matrizCof: number[][] = []
    for (let i = 0; i < matriz.length; i++) {
        const linha: number[] = [];
        for (let j = 0; j < matriz.length; j++) {
            linha.push(cofator(i, j, matriz));
        }
        matrizCof.push(linha)
    }

    const matrizAdj: number[][] = [];
    for (let i = 0; i < matriz.length; i++) {
        const linha: number[] = [];
        for (let j = 0; j < matriz.length; j++) {
            linha.push(matrizCof[j][i]); 
        }
        matrizAdj.push(linha)
    }

    const matrizInversa: number[][] = []
    for(let i=0; i < matriz.length; i++) {
        const linha: number[] = []
        for(let j=0; j < matriz.length; j++) {
            // var Fraction = require('fractional').Fraction
            // const fracao = new Fraction(matrizAdj[i][j] / calculaDeterminante(matriz)).toString()
            let valor : number = 0
            valor = matrizAdj[i][j] / calculaDeterminante(matriz)
            linha.push(valor)
        }
        matrizInversa.push(linha)
    }

    return matrizInversa
}

function matrizBasica(matriz: number[][]) : number[][] {

    return matriz
}

/*começando a lidar com as fases
fase de verificação para fase 1*/

/**ta funfando daora também mas tem que entender direito */
function verificaMaxMin(data: string): string {
    const linhas = data.split('\n').map(linha => linha.trim());
    const primeiraLinha = linhas[0];
    let dataTransformada = data;

    if (primeiraLinha.toLowerCase().startsWith('max')) {
        // Inverte os sinais da função objetivo
        const partes = primeiraLinha.split('=');
        const ladoDireito = partes[1].trim();
        const termos = ladoDireito.split(/(?=[+-])/);
        
        const funcaoObjetivoTransformada = termos.map(termo => {
            if (termo.startsWith('+')) return '-' + termo.substring(1);
            if (termo.startsWith('-')) return '+' + termo.substring(1);
            return '-' + termo;
        }).join('');

        dataTransformada = data.replace(primeiraLinha, `min z = ${funcaoObjetivoTransformada}`);
    }

    return dataTransformada;
}

/*ta funfando legalzao, só tem que entender direito*/
function verificaVetorB(vetorB: number[], data: string): string {
    const linhas = data.split('\n').map(linha => linha.trim());
    let dataTransformada = data;
    
    vetorB.forEach((valor, index) => {
        if (valor < 0 && index + 1 < linhas.length) {
            const linha = linhas[index + 1];
            const [ladoEsquerdo] = linha.split(/<=|>=|=/).map(part => part.trim());
            const operador = linha.match(/<=|>=|=/)![0];
            const ladoDireito = parseFloat(linha.split(/<=|>=|=/)[1].trim());
            
            // Troca sinais do lado esquerdo
            const termosTransformados = ladoEsquerdo.split(/(?=[+-])/).map(termo => {
                termo = termo.trim();
                if (termo.startsWith('+')) return '-' + termo.slice(1).trim();
                if (termo.startsWith('-')) return '+' + termo.slice(1).trim();
                return '-' + termo;
            }).join('');

            // Inverte o operador
            let novoOperador = operador;
            if (operador === '<=') novoOperador = '>=';
            if (operador === '>=') novoOperador = '<=';
            
            // Atualiza vetorB e linha
            vetorB[index] = Math.abs(ladoDireito);
            const novaLinha = `${termosTransformados} ${novoOperador} ${vetorB[index]}`;
            dataTransformada = dataTransformada.replace(linha, novaLinha);
        }
    });
    
    return dataTransformada;
}

/*ta funfando mas eu seila o que ta fazendo isso aqui*/
function verificaFase(data: string): boolean {
    const linhas = data.split('\n');
    
    for (const linha of linhas) {
        const linhaTrim = linha.trim();
        
        // Verifica restrições do tipo >= ou >
        if (linhaTrim.includes('>=') || linhaTrim.includes('>')) {
            return true;
        }
        
        // Verifica restrições de igualdade (=) que não sejam parte de <=
        const index = linhaTrim.indexOf('=');
        if (index >= 0) {
            // Verifica se o caractere antes do = não é <
            if (index === 0 || linhaTrim[index - 1] !== '<') {
                // Verifica se não é uma atribuição (como "Max =")
                if (!linhaTrim.toLowerCase().startsWith('max') && 
                    !linhaTrim.toLowerCase().startsWith('min')) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function fazVerificacoes(data: string): string {
    const vetorB = montaVetorB(data)
    data = verificaMaxMin(data)
    data = verificaVetorB(vetorB, data)
    return data
}

function contarRestricoes(data: string): number {
    let linhas = data.split('\n').slice(1) //divide o arquivo em um array de linhas e ignora a primeira
    let contRestricao = 0

    for (const linha of linhas) {
        if(linha.includes('>=') || linha.includes('<=') || linha.includes('=')) {
            contRestricao++ // conta as linhas com >= ou <= ou =
        }
    }

    return contRestricao
}

/**tem que entender isso aqui hein pq ta foda */
function adicionaArtificiais(data: string): string {
    // Divide o conteúdo em linhas
    const linhas = data.split('\n').map(linha => linha.trim());
    let resultado: string[] = [];
    
    // Mantém a primeira linha (função objetivo) inalterada
    resultado.push(linhas[0]);
    
    // Contador para numerar as variáveis artificiais
    let contadorA = 1;
    let contadorS = 1
    
    // Processa cada linha de restrição
    for (let i = 1; i < linhas.length; i++) {
        let linha = linhas[i];
        
        if (linha.includes('=') && !linha.includes('<=') && !linha.includes('>=')) {
            // Restrição de igualdade (=) - adiciona variável artificial
            linha = linha.replace('=', `+ a${contadorA} =`);
            contadorA++;
        } 
        else if (linha.includes('>=')) {
            // Restrição de maior ou igual (>=) - adiciona variável de excesso e artificial
            linha = linha.replace('>=', `- s${contadorS} + a${contadorA} >=`);
            contadorA++;
            contadorS++
        }
        // Restrições de <= não precisam de variáveis artificiais
        
        resultado.push(linha);
    }
    
    return resultado.join('\n');
}

function montaVetorBasicas(data: string): number[] {
    const numVariaveisOriginais = quantidadeVariaveis(data);
    const numRestricoes = contarRestricoes(data);
    const numFolgas = contarDesigualdades(data)
    const vetorBasicas: number[] = [];
    
    const artificiais = numVariaveisOriginais + numFolgas
    // As variáveis básicas iniciais são as artificiais (a1, a2, ...)
    // Elas começam após as variáveis originais + folgas/excessos
    for (let i = 0; i < numRestricoes; i++) {
        vetorBasicas.push(artificiais + i)
    }
    
    return vetorBasicas;
}

function montaVetorNaoBasicas(data: string): number[] {
    const numVariaveisOriginais = quantidadeVariaveis(data);
    const numDesigualdades = contarDesigualdades(data);
    const vetorNaoBasicas: number[] = [];
    
    // Variáveis não-básicas são as originais (x1, x2, ...) e as de folga/excesso (s1, s2, ...)
    for (let i = 0; i < numVariaveisOriginais; i++) {
        vetorNaoBasicas.push(i);
    }
    
    const folgas = numVariaveisOriginais
    for (let i = 0; i < numDesigualdades; i++) {
        vetorNaoBasicas.push(folgas + i);
    }
    
    return vetorNaoBasicas;
}

function montaMatrizBasica(matrizCompleta: number[][], basicas: number[], naoBasicas: number[]): number[][] {
    if(basicas.length === 0){
        throw new Error('Não tá tendo básicas ai né paizao')
    }
    if(basicas.length !== matrizCompleta.length){
        throw new Error('O número de variáveis tem que ser a mesma da matriz paizao')
    }

    const matrizBasica: number[][] = []

    for(let i=0; i<matrizCompleta.length; i++){
        const linhaBasica: number[] = []

        for(let j=0; j<basicas.length; j++){
            const coluna = basicas[j] //nao sei porque mas ta funcionando assim
            if(coluna >= matrizCompleta[i].length){
                throw new Error(`Índice de coluna ${coluna} fora dos limites da matriz.`)

            }
            linhaBasica.push(matrizCompleta[i][coluna])
        }
        matrizBasica.push(linhaBasica)
    }
    return matrizBasica
}

function montaMatrizNaoBasica(matrizCompleta: number[][], naoBasicas: number[]): number[][] {
    if(naoBasicas.length === 0){
        throw new Error('Nao ta tendo nao basicas né paizao')
    }

    const matrizNaoBasica: number[][] = []

    for(let i=0; i<matrizCompleta.length; i++){
        const linhaNaoBasica: number[] = []

        if(!matrizCompleta[i]){
            throw new Error(`Linha ${i} não existe na matriz completa`)
        }

        for(let j=0; j<naoBasicas.length; j++){
            const coluna = naoBasicas[j]
            if(coluna < 0 || coluna >= matrizCompleta[i].length){
                throw new Error(`Índice de coluna ${coluna} inválido para a linha ${i}`)
            }
            linhaNaoBasica.push(matrizCompleta[i][coluna])
        }
        matrizNaoBasica.push(linhaNaoBasica)
    }
    return matrizNaoBasica
}

lerArquivo((data) => {
    console.log(data)
    data = fazVerificacoes(data)
    const verificadorFase = verificaFase(data)
    if(verificadorFase){ //vai para a fase 1
        console.log('Entrou da fase 1')
        data = adicionaArtificiais(data)
        console.log(data)
        const vetorBasicas = montaVetorBasicas(data)
        const vetorNaoBasicas = montaVetorNaoBasicas(data)
        const matriz = montaMatrizCompleta(data)
        console.log(`Vetor Basico: ${vetorBasicas}`)
        console.log(`Vetor Não Básico: ${vetorNaoBasicas}`)
        console.table(matriz)
        const matrizBasica = montaMatrizBasica(matriz, vetorBasicas, vetorNaoBasicas)
        console.table(matrizBasica)
        const matrizNaoBasica = montaMatrizNaoBasica(matriz, vetorNaoBasicas)
        console.table(matrizNaoBasica)
    } 
    else{ //vai para a fase 2
        console.log('Entrou na fase 2')
        
    }
})