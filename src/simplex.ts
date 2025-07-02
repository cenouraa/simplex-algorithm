import fs, { ftruncate } from 'fs'

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

function calculafuncObjetivo(data: string, numRestricoes: number): number[] {
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
        if (numero === '+' || numero === '') valor = 1 //trata +x como +1
        else if(numero === '-') valor = -1 //trata -x como -1
        else valor = parseFloat(numero)

        funcObjetivo.push(valor)
    })
    
    const coeficientesFilter = funcObjetivo.filter(coef => !isNaN(coef)) //remove os NaN
    const zerosFolga = Array(numRestricoes).fill(0) //zero para variaveis de folga

    return [...coeficientesFilter, ...zerosFolga]
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
            const ultimoSinal = sinal[sinal.length - 1] //pega o ultimo sinal da linha
            sinais.push(ultimoSinal)
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
    console.log("Quantidade de restrições do problema:", numRestricoes)

    const resultado = simplex(data, numVariaveis, numRestricoes, matriz, vetorB, sinaisRestricao, funcObjetivo, tipoFuncao) //chama as fases
    return resultado
}

function obterDados(data: string){
    return {
        numVariaveis: qtdadeVariaveis(data),
        numRestricoes: qtdadeRestricoes(data),
        tipoFuncao: verificaMaxMin(data)
    }
}

function prepararDados(data: string, numVariaveis: number, numRestricoes: number, tipoFuncao: string) {
    let funcObjetivo = calculafuncObjetivo(data, numRestricoes)
    let sinaisRestricao = extraiSinaisRestricao(data)
    let { matriz, vetorB } = montaEstruturas(data, numVariaveis, numRestricoes, sinaisRestricao)

    if (tipoFuncao === 'max') {
        funcObjetivo = funcObjetivo.map(coef => coef * -1) //multiplica todos os termos da função objetivo por -1
    }

    return { funcObjetivo, matriz, vetorB, sinaisRestricao }
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
        if(sinaisRestricao[i] === '>=' || sinaisRestricao[i] === '>' || sinaisRestricao[i] === '=') { //percorre os sinais e ve se tem algum ai
            return true
        }
    }
    return false
}

function existeBaseValida(matriz: number[][], linhas: number, colunas: number): number[] { //procura a base identidade
    const baseInicial: number[] = []

    for(let j=0; j<colunas; j++){
        const coluna: number[] = []
        for(let i=0; i<linhas; i++){
            coluna.push(matriz[i][j])
        }

        const count1 = coluna.filter(x => x === 1).length //conta quantos 1
        const count2 = coluna.filter(x => x === 0).length //conta quantos 0

        if(count1 === 1 && count2 === linhas - 1){ //forma a coluna basica
            baseInicial.push(j)
        }
    }

    return baseInicial.slice(0, linhas)
}

function montaMatrizBasicaENBasica(numVarBasicas: number, numColunas: number, matriz: number[][]){
    const indicesColunas = [...Array(numColunas).keys()] //array de 0 a colunas-1
    for(let i=indicesColunas.length -1; i > 0; i--){
        const j = Math.floor(Math.random() * (i+1)); //tamo aleatorizando aqui
        [indicesColunas[i], indicesColunas[j]] = [indicesColunas[j], indicesColunas[i]] //troca os elementos de posicao
    }
    
    const colunasBasicas = indicesColunas.slice(0, numVarBasicas) //seleciona as basicas
    const colunasNBasicas = indicesColunas.slice(numVarBasicas) //seleciona o resto como nao basicas

    console.log("Índices das colunas aleatorizadas:", indicesColunas)
    console.log("Colunas básicas (aleatórias):", colunasBasicas)
    console.log("Colunas não básicas (aleatórias):", colunasNBasicas)
    
    const matrizBasica = matriz.map(linha => colunasBasicas.map(indice => linha[indice])) //monta a matriz extraindo das basicas
    const matrizNBasica = matriz.map(linha => colunasNBasicas.map(indice => linha[indice])) //extraindo das nao basicas

    return { colunasBasicas, colunasNBasicas, matrizBasica, matrizNBasica }
}

function calculaDeterminante(matriz : number[][]) : number{
    const dimensao = matriz.length //linhas
    const colunas = matriz[0].length

    if(dimensao !== colunas) throw new Error("A matriz não é quadrada")
    if(dimensao == 1) return matriz[0][0]

    let determinante = 0
    const linha = 0
    for(let coluna=0; coluna<dimensao; coluna++) {
        determinante += matriz[linha][coluna] * cofator(linha, coluna, matriz) //pelo metodo dos cofatores
    }

    return determinante
}

function subMatriz(matriz: number[][], linha: number, coluna: number): number[][] {
    const subMatriz: number[][] = []

    for (let i = 0; i < matriz.length; i++) {
        if (i === linha) continue //ignora a linha especifica

        const novaLinha: number[] = []
        for (let j = 0; j < matriz[i].length; j++) {
            if (j === coluna) continue // Ignora a coluna especificada
            novaLinha.push(matriz[i][j]) //adiciona o elemento a nova linha
        }
        subMatriz.push(novaLinha) //adiciona a nova linha na submatriz
    }

    return subMatriz
}

function cofator(i: number, j: number, matriz: number[][]): number {
  const sub = subMatriz(matriz, i, j);
  return ((-1) ** (i + j)) * calculaDeterminante(sub);
}

function calculaMatrizInversa(matriz: number[][]): number[][] {
    if(matriz[0].length !== matriz.length) {
        throw new Error('A matriz deve ser quadrada')
    }

    if(calculaDeterminante(matriz) === 0){
        throw new Error('A matriz deve ter determinante diferente de zero!')
    }

    const matrizCof: number[][] = [] 
    for (let i = 0; i < matriz.length; i++) { //monta a matriz dos cofatores
        const linha: number[] = []
        for (let j = 0; j < matriz.length; j++) {
            linha.push(cofator(i, j, matriz)) //calcula o cofator Cij
        }
        matrizCof.push(linha)
    }

    const matrizAdj: number[][] = [] 
    for (let i = 0; i < matriz.length; i++) { //transpoe a matriz dos cofatores: adjunta
        const linha: number[] = []
        for (let j = 0; j < matriz.length; j++) {
            linha.push(matrizCof[j][i]) //troca linhas por colunas
        }
        matrizAdj.push(linha)
    }

    const matrizInversa: number[][] = []
    for(let i=0; i < matriz.length; i++) { //obtem a inversa dividindo cada elemento da adjunta pelo determinante
        const linha: number[] = []
        for(let j=0; j < matriz.length; j++) {
            let valor : number = 0
            valor = matrizAdj[i][j] / calculaDeterminante(matriz) //calculo do valor final
            linha.push(valor)
        }
        matrizInversa.push(linha)
    }

    return matrizInversa
}

function multiplicaMatrizes(matrizA: number[][], matrizB: number[][]) : number[][] {
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
                mult += matrizA[i][k] * matrizB[k][j];
            }
            matrizT[i][j] = mult
        } 
    }
    return matrizT
}

function calculaMatrizTransposta(matrizBasica: number[][]): number[][]{
    if(matrizBasica.length === 0) return []

    const numColunas: number = matrizBasica[0].length

    const basicaTransposta: number[][] = Array(numColunas).fill(0).map((_, colunaIndex) => matrizBasica.map((linha) => linha[colunaIndex]))
    return basicaTransposta
}

function calculaXB(matrizBasica: number[][], vetorB: number[]): number[][]{
    const inversaBasica: number[][] = calculaMatrizInversa(matrizBasica)
    const matrizVetorB: number[][] = vetorB.map(i => [i])
    const xB: number[][] = multiplicaMatrizes(inversaBasica, matrizVetorB);
    return xB
}

function calculaCustoBasico(colunasBasica: number[], funcObjetivo: number[]){
    const cB: number[] = colunasBasica.map(col => funcObjetivo[col]) //extrai os custos de cada variavel basica
    return cB
}

function calculaCustoNBasico(colunasNBasica: number[], funcObjetivo: number[]){
    const cNB: number[] = colunasNBasica.map(col => funcObjetivo[col]) //extrai os custos de cada variavel nao basica
    return cNB
}

function calculaLambdaT(matrizBasica: number[][], custoBasico: number[]){
    const inversaBasica = calculaMatrizInversa(matrizBasica)
    const matrizCustoBasico: number[][] = custoBasico.map(i => [i])
    const custoBasicoT = calculaMatrizTransposta(matrizCustoBasico)
    const lambdaT = multiplicaMatrizes(custoBasicoT, inversaBasica)
    return lambdaT[0] //retornando como vetor
}

function calculaCustosRelativos(colunasNBasicas: number[], lambdaT: number[], funcObjetivo: number[], matriz: number[][], custoNBasico: number[], matrizNBasica: number[][]){
    const matrizLambdaT = [lambdaT]
    const multiplicacao = multiplicaMatrizes(matrizLambdaT, matrizNBasica)
    let custoRelativo = []
    for(let i = 0; i < custoNBasico.length; i++){
        custoRelativo.push(custoNBasico[i] - multiplicacao[0][i]);
    }
    return custoRelativo
}

function calculaVetorY(matrizBasica: number[][], colunaAK: number[]): number[]{
    const matrizInversa = calculaMatrizInversa(matrizBasica)
    const matrizColunaAK: number[][] = colunaAK.map(i => [i])
    const vetorY = multiplicaMatrizes(matrizInversa, matrizColunaAK)
    return vetorY.map(linha => linha[0])
}

function condicaoDeParadaVetorY(vetorY: number[]): boolean{
    return vetorY.every(y => y <= 0);  //ve se todos y são ≤ 0
}

function calculaEpsilon(vetorY: number[], xB: number[][]){ //calcula variavel que sai da base pela razao minima
    const vetorXB: number[] = xB.map(linha => linha[0])
    let min = Infinity
    let indiceMin = -1

    for(let i=0; i<vetorY.length; i++){
        if(vetorY[i] > 0){
            const razao = vetorXB[i] / vetorY[i] 
            if(razao < min){
                min = razao
                indiceMin = i
            }
        }
    }
    if(indiceMin === -1) {
        console.log('Todas as razões são inválidas! (calculaEpsilon)')
    }
    
    return indiceMin
}

function remontaMatrizBasicaENBasica(colunasBasicas: number[], colunasNBasicas: number[], matriz: number[][]) {
    const numRestricoes = matriz.length
    const numColunas = matriz[0].length
    
    const matrizBasica: number[][] = []
    for (let i = 0; i < numRestricoes; i++) {
        matrizBasica[i] = []
        for (let j = 0; j < colunasBasicas.length; j++) {
            matrizBasica[i][j] = matriz[i][colunasBasicas[j]]
        }
    }
    
    const matrizNBasica: number[][] = [];
    for (let i = 0; i < numRestricoes; i++) {
        matrizNBasica[i] = []
        for (let j = 0; j < colunasNBasicas.length; j++) {
            matrizNBasica[i][j] = matriz[i][colunasNBasicas[j]]
        }
    }
    
    return {
        colunasBasicas,
        colunasNBasicas,
        matrizBasica,
        matrizNBasica
    }
}

function fatorial(n: number): number {
    if (n <= 1) return 1
    return n * fatorial(n - 1)
}

function combinacao(n: number, k: number): number {
    if (k > n) return 0
    if (k === 0 || k === n) return 1
    return Math.round(fatorial(n) / (fatorial(k) * fatorial(n - k))) //formula da combinação
}

function tentaBaseViavelAleatoria(matriz: number[][], vetorB: number[], numRestricoes: number): { colunasBasicas: number[], colunasNBasicas: number[] } | null {
    const numColunas = matriz[0].length
    const maxTentativas = combinacao(numColunas, numRestricoes) //maximo de tentativas é a combinação de todas as possibilidades
    let tentativas = 0

    while (tentativas < maxTentativas) {
        tentativas++;
        const { colunasBasicas, colunasNBasicas, matrizBasica } = montaMatrizBasicaENBasica(numRestricoes, numColunas, matriz)

        try {
            const xB = calculaXB(matrizBasica, vetorB)
            const viavel = xB.every(linha => linha[0] >= 0) //verifica se todos os valores de xBasico sao >= 0

            if (viavel) {
                console.log(`Base aleatória viável encontrada após ${tentativas} tentativa(s)`)
                return { colunasBasicas, colunasNBasicas }
            }
        } catch (e) {
            //matriz não invertivel - passa para proxima combinação
        }
    }

    console.log('Não foi possível encontrar base viável aleatória.');
    return null;
}

function montaSubmatriz(colunas: number[], matriz: number[][]): number[][] { //extrai apenas as colunas especificas
    return matriz.map(linha => colunas.map(i => linha[i]))
}

function criarMatrizArtificial(matrizOriginal: number[][], sinaisRestricao: string[], numVariaveisOriginais: number): { matriz: number[][], colunasArtificiais: number[] } {
    const numRestricoes = matrizOriginal.length
    const numColunasOriginal = matrizOriginal[0].length
    const colunasArtificiais: number[] = []
    
    for (let i = 0; i < numRestricoes; i++) {
        if (sinaisRestricao[i] === '>=' || sinaisRestricao[i] === '=') { //se precisa de artificial
            const colunaExcesso = numVariaveisOriginais + i //coluna do -1
            if (matrizOriginal[i][colunaExcesso] !== -1) {
                throw new Error(`Esperado -1 na coluna ${colunaExcesso} para restrição ${i+1}`)
            }
            colunasArtificiais.push(numColunasOriginal + colunasArtificiais.length)
        }
    }
    
    const matriz = matrizOriginal.map(linha => [...linha]) //clona a matriz original
    
    colunasArtificiais.forEach((colArtificial, idx) => { //identifica qual restrição receberá 1
        const restricaoIdx = sinaisRestricao.findIndex((s, i) => 
            (s === '>=' || s === '=') && i >= idx)
        
        for (let i = 0; i < numRestricoes; i++) {
            if (i === restricaoIdx) {
                matriz[i].push(1)  //1 na linha
            } else {
                matriz[i].push(0) //0 nas outras linhas
            }
        }
    })
    
    return { matriz, colunasArtificiais }
}

function iteracaoSimplex(matriz: number[][], vetorB: number[], funcObjetivo: number[], colunasBasicas: number[], colunasNBasicas: number[], tipoFuncao: string, modo: 'faseI' | 'faseII', colunasArtificiais: number[] = []): { base: number[], nBase: number[], xB: number[][] } | null {
    let matrizBasica = montaSubmatriz(colunasBasicas, matriz)
    let matrizNBasica = montaSubmatriz(colunasNBasicas, matriz)

    let iteracao = 0
    let parar = false

    while (!parar && iteracao < 100) {
        iteracao++
        console.log(`\n--- Iteração ${iteracao} (${modo}) ---`)

        //PASSO 1
        const xB = calculaXB(matrizBasica, vetorB)
        console.log('xB:', xB)

        //PASSO 2
        const custoBasico = calculaCustoBasico(colunasBasicas, funcObjetivo)
        const lambdaT = calculaLambdaT(matrizBasica, custoBasico)
        const custoNBasico = calculaCustoNBasico(colunasNBasicas, funcObjetivo)
        const custosRelativos = calculaCustosRelativos(colunasNBasicas, lambdaT, funcObjetivo, matriz, custoNBasico, matrizNBasica)

        console.log('Custos Relativos:', custosRelativos)

        //PASSO 3
        const cnk = custosRelativos.reduce((minIndex, cr, i) => cr < custosRelativos[minIndex] ? i : minIndex, 0) //escolhe a variavel mais negativa que entra

        if (custosRelativos[cnk] >= 0) { //se solução otima
            console.log('Condição ótima atingida.')

            //verificacoes especificas da faseI
            if (modo === 'faseI') {
                let z = 0
                for (let i = 0; i < colunasBasicas.length; i++) {
                    z += funcObjetivo[colunasBasicas[i]] * xB[i][0]
                }
                console.log('Valor função objetivo artificial (Z):', z)
                if (z !== 0) {
                    console.log('Problema inviável (fase I).')
                    return null //nao tem solução viável
                }

                //remove as variaveis artificiais da base
                const novaBase = colunasBasicas.filter(col => !colunasArtificiais.includes(col))
                const novaNBase = [...colunasNBasicas, ...colunasBasicas.filter(col => colunasArtificiais.includes(col))]

                return { base: novaBase, nBase: novaNBase, xB }
            }

            //final da faseII
            let z = 0
            for (let i = 0; i < colunasBasicas.length; i++) {
                z += funcObjetivo[colunasBasicas[i]] * xB[i][0]
            }
            if (tipoFuncao === "max") z *= -1 //tem que inverter o valor final se for max

            const solucao: number[] = new Array(matriz[0].length).fill(0) //vetor solução
            colunasBasicas.forEach((col, idx) => {
                solucao[col] = xB[idx][0]
            })

            console.log('\nSolução ótima encontrada:')
            solucao.forEach((v, i) => {
                if (v !== 0) console.log(`x${i + 1} = ${v}`) //exibe apenas as variáveis com valor diferente de zero
            })
            console.log(`Z = ${z}`)
            return { base: colunasBasicas, nBase: colunasNBasicas, xB }
        }

        //PASSO 4
        const colunaAK = matriz.map(linha => linha[colunasNBasicas[cnk]])
        const vetorY = calculaVetorY(matrizBasica, colunaAK)

        //PASSO 5
        if (condicaoDeParadaVetorY(vetorY)) { //se y <= 0
            console.log('Problema ilimitado: vetorY <= 0.')
            return null
        }

        //PASSO 6: cálculo do epsilon (escolhe a variavel que sai da base)
        const epsilon = calculaEpsilon(vetorY, xB)
        const varSaiBase = colunasBasicas[epsilon]

        //troca na base
        colunasBasicas[epsilon] = colunasNBasicas[cnk]
        colunasNBasicas[cnk] = varSaiBase

        //atualiza matrizes
        const resultado = remontaMatrizBasicaENBasica(colunasBasicas, colunasNBasicas, matriz);

        matrizBasica = resultado.matrizBasica;
        matrizNBasica = resultado.matrizNBasica;
    }

    console.log('Número máximo de iterações atingido.')
    return null
}

function executarFaseI(matriz: number[][], funcObjetivoArtificial: number[], vetorB: number[], base: number[], nBase: number[], tipoFuncao: string, colunasArtificiais: number[]): { base: number[], nBase: number[], xB: number[][] } | null {
    return iteracaoSimplex(
        matriz,
        vetorB,
        funcObjetivoArtificial,
        base,
        nBase,
        tipoFuncao,
        'faseI',
        colunasArtificiais
    )
}

function faseI(funcObjetivo: number[], numVariaveis: number, numRestricoes: number, matrizOriginal: number[][], sinaisRestricao: string[], vetorB: number[]){
    const { matriz, colunasArtificiais } = criarMatrizArtificial(matrizOriginal, sinaisRestricao, numVariaveis)

    const funcObjetivoArtificial = new Array(matriz[0].length).fill(0)
    colunasArtificiais.forEach(col => funcObjetivoArtificial[col] = 1) //coloca 1 nas colunas artificiais

    console.log('Matriz Artificial:')
    console.table(matriz)
    console.log('Função Objetivo Artificial:', funcObjetivoArtificial)

    const base: number[] = []
    const nBase: number[] = []
    
    //colunas identidade entram na base
    for (let i = 0; i < numRestricoes; i++) {
        if (sinaisRestricao[i] === '<=') {
            base.push(numVariaveis + i)
        }
    }
    
    //adiciona as colunas artificiais na base
    base.push(...colunasArtificiais)
    
    //as colunas nao usadas na base entram na nBase
    for (let col = 0; col < matriz[0].length; col++) {
        if (!base.includes(col)) {
            nBase.push(col)
        }
    }

    console.log('Base inicial:', base)
    console.log('Não base inicial:', nBase)

    const resultadoFaseI = executarFaseI(matriz, funcObjetivoArtificial, vetorB, base, nBase, 'max', colunasArtificiais)
    return resultadoFaseI

}

function faseII(data: string, numVariaveis: number, numRestricoes: number, matriz: number[][], vetorB: number[], sinaisRestricao: string[], funcObjetivo: number[], tipoFuncao: string){
    if(precisaFaseI(sinaisRestricao)){ //caso precise da fase 1
        let baseNova = faseI(funcObjetivo, numVariaveis, numRestricoes, matriz, sinaisRestricao, vetorB)

        if (!baseNova) {
            console.log('Problema inviável. Encerrando execução.')
            return
        }

        const { base: novaBase, nBase: novaNBase, xB } = baseNova

        //chama a faseII com a base viável encontrada na faseI
        const resultadoFaseII = iteracaoSimplex(matriz, vetorB, funcObjetivo, novaBase, novaNBase, tipoFuncao,'faseII')
        return resultadoFaseII
    }
    else {
        //se não precisa da faseI, aleatoriza a base
        const tentativaBase = tentaBaseViavelAleatoria(matriz, vetorB, numRestricoes);

        if (!tentativaBase) {
            console.log('Não foi possível encontrar uma base viável aleatória. Encerrando.');
            return null;
        }

        const { colunasBasicas, colunasNBasicas } = tentativaBase

        const resultado = iteracaoSimplex(matriz, vetorB, funcObjetivo, colunasBasicas, colunasNBasicas, tipoFuncao, 'faseII')
        return resultado
    }
    
}

function simplex(data: string, numVariaveis: number, numRestricoes: number, matriz: number[][], vetorB: number[], sinaisRestricao: string[], funcObjetivo: number[], tipoFuncao: string): void{    
    faseII(data, numVariaveis, numRestricoes, matriz, vetorB, sinaisRestricao, funcObjetivo, tipoFuncao) //chama a faseII direto e ve se precisa da faseI la memo
}

lerArquivo((data) => {
    processaDadosDeEntrada(data)

})