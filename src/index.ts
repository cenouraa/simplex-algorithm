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
function contarRestricoes(data: string): number {
    let linhas = data.split('\n').slice(1) //divide o arquivo em um array de linhas e ignora a primeira
    let contRestricao = 0

    for (const linha of linhas) {
        if(linha.includes('>=') || linha.includes('<=')) {
            contRestricao++ // conta as linhas com >= ou <=
        }
    }

    return contRestricao
}

//ta funcionando 100% 
function maximoOuMinimo(data:string) : string {
    const primeiraLinha = data.split('\n')[0].trim();

    if (primeiraLinha.toLowerCase().startsWith('max')) return 'max'
    if (primeiraLinha.toLowerCase().startsWith('min')) return 'min'
    return 'nao é max nem min'
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

/*da pra usar isso na montagem do vetor b*/
function quantidadeVariaveis(data: string): number {
    let linha = data.split('\n')[0].trim() //pega a primeira linha do arquivo
    const index = linha.indexOf('=') //guarda a posição do = na linha (vai ser -1 se n encontrar)

    if (index !== -1) {
        linha = linha.slice(index + 1).trim(); // remove tudo antes do = e o = também
    }

    const quantidadeX = linha.split('').filter(char => char === 'x').length; //retorna a quantidade de x na linha

    return quantidadeX;
}

function montaMatrizA(data: string) : number[][] {
    const linhas = data.split('\n').slice(1).filter(linha => linha.trim() !== ''); //ignoranda a primeira linha e remove linhas vazias
    let tamLinha : number = quantidadeEquacoes(data) // quantidade de equações
    let tamColuna : number = quantidadeVariaveis(data) + contarRestricoes(data) // quantidade de variaveis
    let matrizA: number[][] = [] 

    //debugzinho console.log(linhas) // imprime as linhas do arquivo

    for(let i=0; i < tamLinha; i++) {
        matrizA.push(new Array(tamColuna).fill(0)) // preenche a matriz com 0
    }

    let colunaFolga = quantidadeVariaveis(data) // quantidade de variaveis

    linhas.forEach((linha, i) => {
        linha = linha.trim() // remove os espaços em branco no começo e no final da linha

        if (linha.includes('>=') || linha.includes('<=') || linha.includes('=')) {
            const partesLinha = linha.split(/>=|<=|=/); // divide a linha em partes usando >=, <= ou =
            const ladoEsquerdo = partesLinha[0].trim(); // pega a parte esquerda da equação
            const termos = ladoEsquerdo.split(/(?=[+-])/) // Divide por "+" ou "-" 

            termos.forEach((termo) => {
                termo = termo.replace(/\s+/g, ''); //remove os espaços em branco
                if (termo.includes('x')) {
                    //converte o termo em um número e pega o índice da variável
                    const coeficiente = parseFloat(termo.split('x')[0]) || (termo.startsWith('-') ? -1 : 1);
                    //converte o número da variável em um índice da matriz
                    const variavel = parseInt(termo.split('x')[1], 10) - 1; 
                    matrizA[i][variavel] = coeficiente; 
                }
            });
        }

        if (linha.includes('<=')) {
            matrizA[i][colunaFolga] = 1; 
            colunaFolga++;
        } else if (linha.includes('>=')) {
            matrizA[i][colunaFolga] = -1; 
            colunaFolga++;
        }
    });

    return matrizA

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
        determinante += ((-1) ** (linha + coluna)) * matriz[linha][coluna] * calculaDeterminante(subMatriz(matriz, linha, coluna));
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

lerArquivo((data) => {
    /*const matrizA = montaMatrizA(data)
    console.log(montaVetorB(data))
    console.table(matrizA)
    console.table(montaMatrizQuadrada(data, matrizA))
    
    */
})

/*inversa*/

//se for max tem que multiplicar a equação z por -1
//se algum termo no vetor b for menor que zero, multiplica a linha toda por -1 e deixa ele positivo