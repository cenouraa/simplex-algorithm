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

function montandoMatrizA(data: string) {
    const linhas = data.split('\n').slice(1) //ignorando a primeira linha
    const regexRestricao = /([-+]?\d*.\d*)x(\d+)/g

    let tamLinha : number = quantidadeEquacoes(data) // quantidade de equações
    let tamColuna : number = quantidadeVariaveis(data) + contarRestricoes(data) // quantidade de variaveis
    let matrizA: number[][] = [] 

    for(let i=0; i < tamLinha; i++) {
        matrizA.push(new Array(tamColuna).fill(0)) // preenche a matriz com 0
    }

    linhas.forEach((linha, i) => {
        if (linha.includes('>=') || linha.includes('<=')) {
            const partesLinha = linha.split(/>=|<=|=/); // divide a linha em partes usando >=, <= ou =
            const ladoEsquerdo = partesLinha[0].trim(); // pega a parte esquerda da equação
            const termos = ladoEsquerdo.split(/(?=[+-])/); // Divide por "+" ou "-" 

            termos.forEach((termo) => {
                termo = termo.trim(); //remove os espaços em branco
                if (termo.includes('x')) {
                    //converte o termo em um número e pega o índice da variável
                    const coeficiente = parseFloat(termo.split('x')[0]) || (termo.startsWith('-') ? -1 : 1);
                    //converte o número da variável em um índice da matriz
                    const variavel = parseInt(termo.split('x')[1], 10) - 1; 
                    matrizA[i][variavel] = coeficiente; 
                }
            });
        }
    });

    console.table(matrizA) // imprime a matriz A

}


lerArquivo((data) => {
    montandoMatrizA(data) // chama a função para montar a matriz A
})

//se for max tem que multiplicar a equação z por -1
//se algum termo no vetor b for menor que zero, multiplica a linha toda por -1 e deixa ele positivo