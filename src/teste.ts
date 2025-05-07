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

function pegarPrimeiraLinha(data: string): string {
    return data.split('\n')[0].trim();
}

function maximoMinimo(data: string): string {
    const primeiraLinha = pegarPrimeiraLinha(data)

    if (primeiraLinha.startsWith('max')) return 'max'
    if (primeiraLinha.startsWith('min')) return 'min'
    return 'nao é max nem min'
}

function quantidadeVariaveisMaxima(data: string): number {
    let numVariaveis: number = 0
    let index: number = 0
    for(let i=0; i < i+1; i++) {
        let linha = data.split('\n')[i].trim()
        for (const char of linha) {
            if (char === 'x') numVariaveis++;
        }
        if(numVariaveis > index) numVariaveis = index
        numVariaveis = 0
    }
    
    return index;
}

function calculaNumeroRestricoes(data: string): number {
    const linhas = data.split('\n').slice(1); // ignora a linha 0
    let numRestricoes = 0;

    linhas.forEach(linha => {
        if (linha.includes(">=") || linha.includes("<=")) numRestricoes++; //ignora as linhas =
    });

    return numRestricoes
}

function gerarMatrizA(data: string, numVariaveis: number, numRestricoes: number): number[][] {
    const linhas = data.split('\n').slice(1); // ignora a linha
    const regexRestricao = /([-+]?\d*.\d*)x(\d+)/g;

    let auxIndex = numVariaveis; 
    const matriz: number[][] = [];

    for (const linha of linhas) {
        if (linha.includes("=") && !linha.includes("<=") && !linha.includes(">=")) { //ignora a linha de =
            continue
        }

        let valores: number[] = new Array(numVariaveis + numRestricoes).fill(0); // Criamos um array zerado para todas as colunas

        let match;
        while ((match = regexRestricao.exec(linha)) !== null) {
            let coeficiente = match[1] ? Number(match[1]) : 1;
            let indice = Number(match[2]) - 1; // Ajustar para índice de array (0-based)

            valores[indice] = coeficiente;
        }

        // Adiciona a variável de folga ou artificial corretamente
        if (linha.includes("<=")) {
            valores[auxIndex] = 1; // Variável de folga positiva
            auxIndex++;
        } else if (linha.includes(">=")) {
            valores[auxIndex] = -1; // Variável artificial negativa
            auxIndex++;
        }

        matriz.push(valores);
    }

    return matriz;
}

function extrairCoeficientes(linha: string, numVariaveis: number): number[] {
    const regex = /([-+]?\d*\.?\d*)x(\d+)/g;
    const vetor = new Array(numVariaveis).fill(0);
    let match;

    while ((match = regex.exec(linha)) !== null) {
        let coef = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : Number(match[1]);
        let index = Number(match[2]) - 1;
        vetor[index] = coef;
    }

    return vetor;
}

function vetorFuncaoObjetivo(data: string, numRestricoes: number): number[] {
    const primeiraLinha = data.split('\n')[0].trim();
    const regexCoef = /([-+]?\d*\.?\d*)x(\d+)/g;

    const numVariaveis = quantidadeVariaveisMaxima(data);
    const vetor: number[] = new Array(numRestricoes).fill(0);

    for(let i=0; i < numRestricoes; i++) {
        vetor.push(0)
    }

    let match;
    while ((match = regexCoef.exec(primeiraLinha)) !== null) {
        let coef = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : Number(match[1]);
        let indice = Number(match[2]) - 1;
        vetor[indice] = coef;
    }

    return vetor;
}

function calcula_determinante(matriz : number[][]) : number{
    const dim : number = matriz.length
    if(dim == 1) {
        return matriz[0][0]
    }

    let determinante : number = 0
    for(let j=0; j<dim; j++) {
        determinante += matriz[0][j] * cofator(matriz, 0, j, dim)
    }

    return determinante
}

function cofator(matriz : number[][], linha : number, coluna : number, dim:number) : number {
    let submatriz : number[][] = []
    linha=0

    for(let i=1; i<dim; i++) {
        submatriz[linha] = []

        for(var j=0; j<dim; j++){
            if(j!==coluna) {
                submatriz[linha].push(matriz[i][j])
            }
        }
        linha++
    }
    return (coluna % 2 ? -1 : 1)*calcula_determinante(submatriz)

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

lerArquivo((data) => {
    const numRestricoes: number = calculaNumeroRestricoes(data)
    let contVariaveis : number = quantidadeVariaveisMaxima(data)
    
    if(maximoMinimo(data) === 'max') contVariaveis--

    const matriz = gerarMatrizA(data, contVariaveis, numRestricoes)
    console.table(matriz)
    console.log(vetorFuncaoObjetivo(data, numRestricoes))
    /*matriz.forEach(linha => console.log(linha.join(' ')));
    console.log(matriz.map(linha => linha.join(' ')).join('\n'));*/
});

/*debug section
console.log(calcula_determinante([[0,-2,3], [3,3,1], [-1,2,-3]]))
var matrizA : number[][] = [
    [1, 1], [1,1]
] 
var matrizB : number[][] = [
    [1, 1], [1,1]
] 
console.log(multiplicaMatriz(matrizA, matrizB))*/

/*fazer imprimir a matriz b e fazer calculo de matriz inversa */
/*c = [2, 30, 0, 0, 0]
b = [20, 10, 2, 12] */