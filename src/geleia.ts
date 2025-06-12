import fs from 'fs'

function lerArquivo(callback: (data: string) => void): void {
    fs.readFile('instance.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return;
        }
        callback(data);
    });
}

function qtdadeVariaveis(data: string): number {
    let linha = data.split('\n')[0].trim() //pega a primeira linha do arquivo
    const index = linha.indexOf('=') //guarda a posição do = na linha (vai ser -1 se n encontrar)

    if (index !== -1) {
        linha = linha.slice(index + 1).trim(); // remove tudo antes do = e o = também
    }

    const quantidadeX = linha.split('').filter(char => char === 'x').length; //retorna a quantidade de x na linha

    return quantidadeX;
}

function qtdadeRestricoes(data: string): number {
    let numEquacoes = 0
    let linhas = data.split('\n').slice(1) //divide o arquivo em um array de linhas e ignora a primeira

    for (const linha of linhas) {
        if(linha.includes('>=') || linha.includes('<=') || linha.includes('=')) {
            numEquacoes++ // conta as linhas com >= ou <= ou =
        }
    }

    return numEquacoes
}

function calculafuncObjetivo(data: string): number[] {
    const funcObjetivo: number[] = []
    
    const primeiraLinha: string = data.split('\n')[0].trim() //pega só a primeira linha da entrada
    const termos: string = primeiraLinha.split('=')[1].trim() //pega só o que está depois do =
    const coeficientes: string[] = termos.replace(/\s+/g, '').split(/(?=[+-])/) //separa todos os coeficientes com o sinal sem espaços em branco

    coeficientes.map(coeficiente => {
        if(coeficiente === '') return

        if(coeficiente.startsWith('x') || coeficiente.startsWith('+x')){
            funcObjetivo.push(1) //se o 1 estiver implícito  
            return
        } 
        if(coeficiente.startsWith('-x')){
            funcObjetivo.push(-1) //se o -1 estiver implícito
            return
        } 

        const numero = coeficiente.split('x')[0] //pega exatamente o número antes do x (decimal também)

        let valor: number
        if (numero === '+' || numero === '') valor = 1
        else if(numero === '-') valor = -1
        else valor = parseFloat(numero)

        funcObjetivo.push(valor)
    })
    
    return funcObjetivo.filter(coef => !isNaN(coef))
}

function verificaMaxMin(data: string): string{
    const primeiraLinha: string = data.split('\n')[0].trim().toLowerCase() //pega só a primeira linha da entrada minuscula
    
    if(primeiraLinha.includes('max')) return 'max'
    if(primeiraLinha.includes('min')) return 'min'
    else return 'null'
}

function montaMatriz(data: string, numVariaveis: number, numRestricoes: number): number[][]{
    const linhas: string[] = data.split('\n') //separando linha a linha
                                .slice(1) //ignorando a primeira linha
                                .map(linha => linha.trim()) //remove os espaços em branco das linhas
                                .filter(linha => linha !== '') //remove linhas em branco
    const tamColuna: number = numVariaveis + numRestricoes

    let matriz: number[][] = []

    for(let i=0; i<linhas.length; i++){
        const linha = linhas[i] //pega a linha atual
        const linhaMatriz: number[] = Array(tamColuna).fill(0) //preenche a linha com 0

        const sinais = linha.match(/(<=|>=|=|<|>)/) //procura se tem os sinais ai do regex
        if(!sinais) continue //se nao encontrar sinal, pula pra proxima iteração

        const sinal = sinais[0] //pega o primeiro sinal encontrado
        const ladoEsquerdo = linha.split(sinais[0])[0].trim() //pega só os termos das restrições (esquerda do sinal)

        const termos = ladoEsquerdo.match(/([-+]?\s*\d*\.?\d*)x\d+/g) || [] //array com os termos de cada linha separados levando em consideração os caracteres de espaço
        for(const termo of termos){
            if(!termo) continue

            const termoLimpo = termo.replace(/\s+/g, '') //remove os espaços internos
            const variavel = termoLimpo.match(/([+-]?\d*\.?\d*)x(\d+)/) //extrai coeficiente e índice da variavel
            if (variavel) { //se o número está explicito
                let coef = variavel[1] //pega o numero
                const indice = parseInt(variavel[2]) - 1 // x1 → índice 0 e segue
                
                //trata os coeficientes implícitos
                if (coef === '+' || coef === '') coef = '1'
                if (coef === '-') coef = '-1'
                
                linhaMatriz[indice] = parseFloat(coef) //transforma em numero e coloca na coluna correspondente
            }
        }

        //adiciona variaveis de folga e excesso
        if (sinal === '<=' || sinal === '<') {
            linhaMatriz[numVariaveis + i] = 1
        } 
        else if (sinal === '>=' || sinal === '>') {
            linhaMatriz[numVariaveis + i] = -1
        }
        //para o = nao faz nada

        matriz.push(linhaMatriz);
    }

    return matriz
}

function montaVetorB(data: string): number[]{
    const linhas: string[] = data.split('\n') //separando linha a linha
                                .slice(1) //ignorando a primeira linha
                                .map(linha => linha.trim()) //remove os espaços em branco das linhas
                                .filter(linha => linha !== '') //remove linhas em branco
    const vetorB: number[] = []

    for(const linha of linhas){
        const sinais = linha.match(/(<=|>=|=|<|>)/) //procura se tem os sinais ai do regex
        if(!sinais) continue //se nao encontrar sinal, pula pra proxima iteração

        const sinal = sinais[0] //pega o primeiro sinal encontrado
        const ladoDireito = linha.split(sinal)[1].trim() //pega só os coeficientes após a direta dos sinais

        const valor = parseFloat(ladoDireito)
        if(!isNaN(valor)){ //se for realmente um numero
            vetorB.push(valor)
        } else {
            throw new Error('Algum erro com os coeficientes do vetor B')
        }
    }

    return vetorB
}  

function extraiSinaisRestricao(data: string): string[] {
    const linhas: string[] = data.split('\n') //separando linha a linha
                                .slice(1) //ignorando a primeira linha
                                .map(linha => linha.trim()) //remove os espaços em branco das linhas
                                .filter(linha => linha !== '') //remove linhas em branco

    const sinais: string[] = []

    for (const linha of linhas) {
        const sinal = linha.match(/(>=|<=|>|<|=)/g);
        if (sinal && sinal.length > 0) {
            const ultimoSinal = sinal[sinal.length - 1];
            sinais.push(ultimoSinal);
        }
    }

    return sinais

}

function verificaSinais(matriz: number[][], vetorB: number[], sinaisRestricao: string[]): {matriz: number[][], vetorB: number[], sinaisRestricao: string[]}{
    for(let i=0; i<matriz.length; i++){
        if(vetorB[i] < 0) { //se tiver algum valor negativo no vetorB
            vetorB[i] *= -1
            //inverte as desigualdades caso haja um valor negativo na linha
            if(sinaisRestricao[i] === '>='){
                sinaisRestricao[i] = '<='
            }
            else if(sinaisRestricao[i] === '<='){
                sinaisRestricao[i] = '>='
            }
            else if(sinaisRestricao[i] === '<'){
                sinaisRestricao[i] = '>'
            }
            else if(sinaisRestricao[i] === '>'){
                sinaisRestricao[i] = '<'
            }
            for(let j=0; j<matriz[0].length; j++){
                matriz[i][j] *= -1 //altera todos os valores da respectativa linha
            }
        }
    }

    return {matriz, vetorB, sinaisRestricao}
}

function processaDadosDeEntrada(data: string) {
    const { numVariaveis, numRestricoes, tipoFuncao } = obterDados(data) //pega dados basicos da entrada
    const { funcObjetivo, matriz, vetorB, sinaisRestricao } = prepararDados(data, numVariaveis, numRestricoes, tipoFuncao) //monta as estruturas necessarias

    console.log("Função Objetivo:", funcObjetivo)
    console.log("Tipo de Função:", tipoFuncao)
    console.log("Sinais de cada restrição:", sinaisRestricao)
    console.table(matriz)
    console.log("Vetor B:", vetorB)

    const resultado = simplex(data, numVariaveis, numRestricoes, matriz, vetorB, sinaisRestricao)
    return resultado
}

function obterDados(data: string){
    return {
        numVariaveis: qtdadeVariaveis(data),
        numRestricoes: qtdadeRestricoes(data),
        tipoFuncao: verificaMaxMin(data)
    };
}

function prepararDados(data: string, numVariaveis: number, numRestricoes: number, tipoFuncao: string) {
    let funcObjetivo = calculafuncObjetivo(data)
    let sinaisRestricao = extraiSinaisRestricao(data)
    let { matriz, vetorB } = montaEstruturas(data, numVariaveis, numRestricoes, sinaisRestricao)

    if (tipoFuncao === 'max') {
        funcObjetivo = funcObjetivo.map(coef => coef * -1) //multiplica todos os termos da função objetivo por -1
    }

    return { funcObjetivo, matriz, vetorB, sinaisRestricao };
}

function montaEstruturas(data: string, numVariaveis: number, numRestricoes: number, sinaisRestricao: string[]) {
    const matriz = montaMatriz(data, numVariaveis, numRestricoes)
    const vetorB = montaVetorB(data)
    const { matriz:matrizVerificada, vetorB:vetorBVerificado } = verificaSinais(matriz, vetorB, sinaisRestricao)
    return {
        matriz:matrizVerificada,
        vetorB:vetorBVerificado,
        sinaisRestricao
    }
}

function precisaFaseI(sinaisRestricao: string[]): boolean {
    for(let i=0; i<sinaisRestricao.length; i++){
        if(sinaisRestricao[i] === '>=' || sinaisRestricao[i] === '>' || sinaisRestricao[i] === '=') {
            return true
        }
    }
    return false
}

function faseII(data: string, numVariaveis: number, numRestricoes: number, matriz: number[][], vetorB: number[], sinaisRestricao: string[]){
    //declarando muita variavel ai que vamo ter que ta usando
    const numVarBasicas: number = numRestricoes
    const colunasMatriz: number = matriz[0].length
    const numVarNaoBasicas: number = colunasMatriz - numRestricoes

    const xB: number = 0
    const lambda: number = 0
    const custosRelativos: number[] = []
    const vetorY: number[] = []
    const cnk: number = 0
    const epsilon: number = 0

    const basicas: number[] = []
    const nBasicas: number[] = []
    
    const indicesColunas = [...Array(colunasMatriz).keys()]

    for(let i=indicesColunas.length -1; i > 0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [indicesColunas[i], indicesColunas[j]] = [indicesColunas[j], indicesColunas[i]]
    }

    const colunasBasicas = indicesColunas.slice(0, numVarBasicas)
    const colunasNBasicas = indicesColunas.slice(numVarBasicas)

    console.log("Índices das colunas aleatorizadas:", indicesColunas);
    console.log("Colunas básicas (aleatórias):", colunasBasicas);
    console.log("Colunas não básicas (aleatórias):", colunasNBasicas);

    const matrizBasica = matriz.map(linha => colunasBasicas.map(indice => linha[indice]))
    const matrizNBasica = matriz.map(linha => colunasNBasicas.map(indice => linha[indice]))

    console.log("Matriz básica (aleatória):", matrizBasica);
    console.log("Matriz não básica (aleatória):", matrizNBasica);

    // const baseValida = isBaseValida(matrizBasica, vetorB)
    // if(!baseValida){
    //     throw new Error('A base não é viável.')
    // }

    //caso precise da fase 1
    if(precisaFaseI(sinaisRestricao)){
        console.log('entrou fase 1')
    }
    
    if(!precisaFaseI(sinaisRestricao)){
        //definindo colunas basicas e nao básicas
        for(let i=0; i<numVarNaoBasicas; i++){
            nBasicas[i] = i
        }
        let indice: number = 0
        for(let i=numVariaveis; i<colunasMatriz; i++){
            basicas[indice] = i
            indice++
        }


    }
}

function simplex(data: string, numVariaveis: number, numRestricoes: number, matriz: number[][], vetorB: number[], sinaisRestricao: string[]): void{
    console.log('trabaiando na tal da fase2')
    faseII(data, numVariaveis, numRestricoes, matriz, vetorB, sinaisRestricao)
    
}

lerArquivo((data) => {
    const resultado = processaDadosDeEntrada(data)

})