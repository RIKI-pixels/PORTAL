/* ==========================================================
   PORTAL OPERACIONAL CDI
   Versão 1.4.3 beta test
========================================================== */


/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const URLS_PADRAO = {

    transporte:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo2yDYJIk7j-FOFM_02DgQyXXrH6TXbjlR5T_RvqyoeEpKjaIOc4xJRekjmD24MA/pub?gid=484487288&single=true&output=tsv",

    estoque:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwLw-C7k481tht-EBvb726lS51kJw2Uf6DtbXHXjqX8iVR-ergQXu2WRWU0Zi45A/pub?gid=1093636519&single=true&output=tsv"

};

const CONFIG = {

    URL_PLANILHA:
        localStorage.getItem("tsvTransporte") || URLS_PADRAO.transporte,

    URL_ESTOQUE:
        localStorage.getItem("tsvEstoque") || URLS_PADRAO.estoque,

    DEBUG: false,

    VERSAO: "2.0.0"

};

/* ==========================================================
   ESTADO DA APLICAÇÃO
========================================================== */

const APP = {

    dados: [],
    dadosEstoque: [],

    listaEstoqueAtual: [],
    listaProgramacaoAtual: [],

    carregado: false,
    carregadoEstoque: false,

    ultimaAtualizacao: null,
    ultimaAtualizacaoEstoque: null,

    paginaEstoque: 1,
    limiteEstoque: 25,

    paginaProgramacao: 1,
    limiteProgramacao: 25

};


/* ==========================================================
   CLIENTES ESTUFAGEM
========================================================== */

const CLIENTES_PADRAO = [

    "MARINI",
    "RANDA",
    "METISA",
    "COMPENSADOS NM",
    "EURO",
    "EAGLE",
    "THOMASI",
    "AFFONSO DITZEL",
    "MULTIPINE",
    "COPERAGUAS"

];

const CLIENTES_ESTUFAGEM =

    localStorage.getItem("clientesEstufagem")

    ?

    localStorage
        .getItem("clientesEstufagem")
        .split("\n")
        .map(c=>c.trim().toUpperCase())
        .filter(c=>c)

    :

    CLIENTES_PADRAO;

/* ==========================================================
   COLUNAS DA PLANILHA
========================================================== */

const COL = {

    TIPO:0,

    STATUS:1,

    MODAL:4,

    DU_DI:6,

    ISO:8,

    CONTAINER:9,

    DATA_AG:10,

    JANELA:11,

    CLIENTE:12,

    BOOKING:13,

    ARMADOR:14,

    DEADLINE:18,

    PENDENCIA:22

};


/* ==========================================================
   ELEMENTOS HTML
========================================================== */

const DOM = {

    inicio: document.getElementById("inicio"),
    programacao: document.getElementById("programacao"),
    estoque: document.getElementById("estoque"),
    dev: document.getElementById("dev"),

    inicioBtn: document.getElementById("inicioBtn"),
    programacaoBtn: document.getElementById("programacaoBtn"),
    estoqueBtn: document.getElementById("estoqueBtn"),
   
    theadProg: document.getElementById("theadProg"),
    tbodyProg: document.getElementById("tbodyProg"),

    theadEstoque: document.getElementById("theadEstoque"),
    tbodyEstoque: document.getElementById("tbodyEstoque")

};


/* ==========================================================
   DEBUG
========================================================== */

function debug(...mensagem){

    if(CONFIG.DEBUG){

        console.log(...mensagem);

    }

}


/* ==========================================================
   UTILITÁRIOS
========================================================== */

function texto(valor){

    if(valor === undefined) return "";

    if(valor === null) return "";

    return String(valor).trim();

}


function textoMaiusculo(valor){

    return texto(valor).toUpperCase();

}


function valor(linha,coluna){

    return texto(linha[coluna]);

}


function limparTabela(){

    DOM.thead.innerHTML = "";

    DOM.tbody.innerHTML = "";

}


function limparTabelaProgramacao(){

    DOM.theadProg.innerHTML = "";

    DOM.tbodyProg.innerHTML = "";

}


/* ==========================================================
   MANIPULAÇÃO DE DATAS
========================================================== */

/* =========================
DATA BR
========================= */

function parseDataBR(dataStr){

    if(!dataStr) return null;

    dataStr = dataStr.toString().trim();

    const partes = dataStr.split(" ")[0].split("/");

    if(partes.length !== 3) return null;

    let dia = Number(partes[0]);
    let mes = Number(partes[1]) - 1;
    let ano = Number(partes[2]);

    if(ano < 100){
        ano += 2000;
    }

    const data = new Date(ano, mes, dia);

     data.setHours(12,0,0,0);

     return data;

}

/* ==========================================================
   CONVERTE INPUT DATE
========================================================== */

function parseInputDate(valor){

    if(!valor){
        return null;
    }

    const [ano, mes, dia] = valor
        .split("-")
        .map(Number);

    const data = new Date(
        ano,
        mes - 1,
        dia
    );

    data.setHours(12,0,0,0);

    return data;

}

/* =========================
CONVERTE DATA PARA NÚMERO
========================= */

function dataNumero(data){

    if(!data) return 0;

    return (
        data.getFullYear() * 10000 +
        (data.getMonth() + 1) * 100 +
        data.getDate()
    );

}

/* ==========================================================
   VALIDAÇÃO DE PERÍODO
========================================================== */

function dataEntre(data,inicio,fim){

    if(!data || !inicio || !fim){

        return false;

    }

    const numeroData = dataNumero(data);
    const numeroInicio = dataNumero(inicio);
    const numeroFim = dataNumero(fim);

    return (

        numeroData >= numeroInicio &&

        numeroData <= numeroFim

    );

}

/* ==========================================================
   CONVERSÃO DE LINHA PARA REGISTRO
========================================================== */

function criarRegistro(linha){

    return{

        tipo: valor(linha,COL.TIPO),

        status: textoMaiusculo(valor(linha,COL.STATUS)),

        modal: textoMaiusculo(valor(linha,COL.MODAL)),

        duDi: valor(linha,COL.DU_DI),

        iso: valor(linha,COL.ISO),

        container: valor(linha,COL.CONTAINER),

        dataTexto: valor(linha,COL.DATA_AG),

        dataAg: parseDataBR(valor(linha,COL.DATA_AG)),

        janela: valor(linha,COL.JANELA),

        cliente: textoMaiusculo(valor(linha,COL.CLIENTE)),

        booking: valor(linha,COL.BOOKING),

        armador: valor(linha,COL.ARMADOR),

        ddlTexto: valor(linha,COL.DEADLINE),

        ddl: parseDataBR(valor(linha,COL.DEADLINE)),

        pendencia: textoMaiusculo(valor(linha,COL.PENDENCIA))

    };

}

function criarRegistroEstoque(linha){

    const container = textoMaiusculo(linha[0]);

    return{

        container: container,
        iso: textoMaiusculo(linha[1]),
        estado: textoMaiusculo(linha[2]),
        cliente: textoMaiusculo(linha[3]),
        booking: textoMaiusculo(linha[4]),
        localizacao: obterLocalizacao(container)

    };

}


/* ==========================================================
   CARREGAMENTO DA PLANILHA
========================================================== */

function carregarPlanilha() {

    console.log("URL utilizada:", CONFIG.URL_PLANILHA);

    Papa.parse(CONFIG.URL_PLANILHA, {

        download: true,
        delimiter: "\t",
        skipEmptyLines: true,

        complete(resultado) {

            APP.dados = resultado.data
                .slice(1)
                .map(criarRegistro);

            APP.carregado = true;
            APP.ultimaAtualizacao = new Date();

            debug(
                "Planilha carregada.",
                APP.dados.length,
                "registros."
            );

            document.getElementById("linhasTransporte").textContent =
                APP.dados.length.toLocaleString("pt-BR");

            document.getElementById("dataTransporte").textContent =
                APP.ultimaAtualizacao.toLocaleString("pt-BR");

        },

        error(erro) {

            console.error(erro);

            document.getElementById("linhasTransporte").textContent = "--";

            document.getElementById("dataTransporte").textContent =
                "Erro ao carregar";

        }

    });

}

function carregarEstoque(){

    Papa.parse(

        CONFIG.URL_ESTOQUE,

        {

            download:true,
            delimiter:"\t",
            skipEmptyLines:true,

            complete(resultado){

                APP.dadosEstoque = resultado.data
                    .slice(1)
                    .map(criarRegistroEstoque);

                APP.carregadoEstoque = true;

                APP.ultimaAtualizacaoEstoque = new Date();

                document.getElementById("linhasEstoque").textContent =
                    APP.dadosEstoque.length.toLocaleString("pt-BR");

                document.getElementById("dataEstoque").textContent =
                    APP.ultimaAtualizacaoEstoque.toLocaleString("pt-BR");

            },

            error(){

                document.getElementById("linhasEstoque").textContent="--";

                document.getElementById("dataEstoque").textContent="Erro";

            }

        }

    );

}


/* ==========================================================
   VALIDAÇÃO
========================================================== */

function verificarCarregamento(){

    if(APP.carregado){

        return true;

    }

    alert(

        "A planilha ainda está sendo carregada."

    );

    return false;

}


/* ==========================================================
   CONTROLE DAS TELAS
========================================================== */

function limparMenu(){

    document

        .querySelectorAll(".menu-item")

        .forEach(item=>{

            item.classList.remove("active");

        });

}


function mostrarInicio(){

    DOM.inicio.style.display = "flex";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "none";
    DOM.dev.style.display = "none";

    DOM.inicioBtn.classList.add("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.remove("active");

}


function mostrarProgramacao(){
   
    DOM.dev.style.display = "none";
    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "block";
    DOM.estoque.style.display = "none";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.add("active");
    DOM.estoqueBtn.classList.remove("active");

}

function mostrarEstoque(){
   
    DOM.dev.style.display = "none";
    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "block";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.add("active");

}

function abrirDEV(){

    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "none";
    DOM.dev.style.display = "block";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.remove("active");

    document.getElementById("urlTransporte").value =
        CONFIG.URL_PLANILHA;

    document.getElementById("urlEstoque").value =
        CONFIG.URL_ESTOQUE;
   
    document.getElementById("clientesEstufagem").value =
     CLIENTES_ESTUFAGEM.join("\n");
}

/* ==========================================================
   ESTOQUE
========================================================== */

function buscarEstoque(){

    if(!APP.carregadoEstoque){

        alert("O estoque ainda está carregando.");

        return;

    }

    const tipo =
        document.getElementById("tipoBuscaEstoque").value;

    const pesquisa =
        textoMaiusculo(
            document.getElementById("valorBuscaEstoque").value
        );

    let lista = APP.dadosEstoque;

    if(pesquisa){

        lista = lista.filter(registro=>{

            switch(tipo){

                case "ISO":
                    return registro.iso.includes(pesquisa);

                case "CONTAINER":
                    return registro.container.includes(pesquisa);

                case "CLIENTE":
                    return registro.cliente.includes(pesquisa);

                case "BOOKING":
                    return registro.booking.includes(pesquisa);

                default:
                    return true;

            }

        });

    }
    APP.listaEstoqueAtual = lista;
   
    renderTabelaEstoque(lista);

}

/* ==========================================================
   PROGRAMAÇÃO
========================================================== */

function renderTabelaEstoque(lista){

    const inicio =
        (APP.paginaEstoque - 1) * APP.limiteEstoque;

    const fim =
        inicio + APP.limiteEstoque;

    const pagina =
        lista.slice(inicio, fim);

    DOM.theadEstoque.innerHTML = "";
    DOM.tbodyEstoque.innerHTML = "";

    DOM.theadEstoque.innerHTML = `

        <th>CONTAINER</th>
        <th>ISO</th>
        <th>ESTADO</th>
        <th>CLIENTE</th>
        <th>BOOKING</th>
        <th>LOCALIZAÇÃO</th>

    `;

    if(pagina.length === 0){

        DOM.tbodyEstoque.innerHTML = `

            <tr>
                <td colspan="6" class="loading">
                    Nenhum resultado encontrado.
                </td>
            </tr>

        `;

    }else{

        pagina.forEach(registro=>{

            const localizacao =
                obterLocalizacao(registro.container);

            DOM.tbodyEstoque.innerHTML += `

                <tr>

                    <td>${registro.container}</td>
                    <td>${registro.iso}</td>
                    <td>${registro.estado}</td>
                    <td>${registro.cliente}</td>
                    <td>${registro.booking}</td>

                    <td>

                        ${localizacao
                            ? localizacao
                            : `

                                <button
                                    onclick="editarLocalizacao('${registro.container}')">

                                    Editar

                                </button>

                            `
                        }

                    </td>

                </tr>

            `;

        });

    }

    document.getElementById("totalEstoque").textContent =
        lista.length;

    document.getElementById("paginaEstoque").textContent =
        APP.paginaEstoque;

}


/* ==========================================================
   ADM
========================================================== */

function salvarTSV(){

    localStorage.setItem(
        "tsvTransporte",
        document.getElementById("urlTransporte").value
    );

    localStorage.setItem(
        "tsvEstoque",
        document.getElementById("urlEstoque").value
    );

   localStorage.setItem(

    "clientesEstufagem",

    document
        .getElementById("clientesEstufagem")
        .value

    );

    location.reload();

}

function restaurarTSV(){

    localStorage.removeItem("tsvTransporte");
    localStorage.removeItem("tsvEstoque");
    localStorage.removeItem("clientesEstufagem");
    location.reload();

}

/* ==========================================================
   COLUNAS DA PROGRAMAÇÃO
========================================================== */

function obterColunasProgramacao(){

    return[

        {

            nome:"TIPO",

            campo:"tipo"

        },

        {

            nome:"CLIENTE",

            campo:"cliente"

        },

        {

            nome:"CONTAINER",

            campo:"container"

        },

        {

            nome:"DATA AG.",

            campo:"dataTexto"

        },

        {

            nome:"JANELA",

            campo:"janela"

        },

        {

            nome:"BOOKING",

            campo:"booking"

        },

        {

            nome:"DDL",

            campo:"ddlTexto"

        }

    ];

}

function obterColunasEstoque(){

    return[

        {nome:"CONTAINER",campo:"container"},
        {nome:"ISO",campo:"iso"},
        {nome:"ESTADO",campo:"estado"},
        {nome:"CLIENTE",campo:"cliente"},
        {nome:"BOOKING",campo:"booking"},
        {nome:"LOCALIZAÇÃO",campo:"localizacao"}

    ];

}


/* ==========================================================
   RENDER UNIVERSAL
========================================================== */

function renderTabela(

    thead,

    tbody,

    colunas,

    lista

){

    thead.innerHTML = "";

    tbody.innerHTML = "";

    if(lista.length === 0){

        tbody.innerHTML =

        `

        <tr>

            <td colspan="${colunas.length}">

                Nenhum resultado encontrado.

            </td>

        </tr>

        `;

        return;

    }

    let htmlHead = "";

    let htmlBody = "";

    colunas.forEach(coluna=>{

        htmlHead += `

            <th>

                ${coluna.nome}

            </th>

        `;

    });

    lista.forEach(registro=>{

        htmlBody += "<tr>";

        colunas.forEach(coluna=>{

            htmlBody += `

                <td>

                    ${registro[coluna.campo] ?? ""}

                </td>

            `;

        });

        htmlBody += "</tr>";

    });

    thead.innerHTML = htmlHead;

    tbody.innerHTML = htmlBody;

}


/* ==========================================================
   RENDER PROGRAMAÇÃO
========================================================== */

function renderTabelaProgramacao(lista){

    document.getElementById("totalProgramacao").textContent =
        lista.length;

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            lista.length /
            APP.limiteProgramacao
        )
    );

    if(APP.paginaProgramacao > totalPaginas){

        APP.paginaProgramacao = totalPaginas;

    }

    document.getElementById("paginaProgramacao").textContent =
        APP.paginaProgramacao;

    const inicio =
        (APP.paginaProgramacao - 1) *
        APP.limiteProgramacao;

    const pagina =
        lista.slice(
            inicio,
            inicio + APP.limiteProgramacao
        );

    renderTabela(

        DOM.theadProg,
        DOM.tbodyProg,
        obterColunasProgramacao(),
        pagina

    );

}

function programacaoAnterior(){

    if(APP.paginaProgramacao > 1){

        APP.paginaProgramacao--;

        renderTabelaProgramacao(
            APP.listaProgramacaoAtual
        );

    }

}

function programacaoProximo(){

    const totalPaginas = Math.ceil(

        APP.listaProgramacaoAtual.length /

        APP.limiteProgramacao

    );

    if(APP.paginaProgramacao < totalPaginas){

        APP.paginaProgramacao++;

        renderTabelaProgramacao(
            APP.listaProgramacaoAtual
        );

    }

}

function alterarLimiteProgramacao(){

    APP.limiteProgramacao = Number(

        document.getElementById(
            "limiteProgramacao"
        ).value

    );

    APP.paginaProgramacao = 1;

    renderTabelaProgramacao(
        APP.listaProgramacaoAtual
    );

}

/* ==========================================================
   LOCALIZAÇÃO
========================================================== */

function obterLocalizacao(container){

    const mapa = JSON.parse(
        localStorage.getItem("localizacoesContainers") || "{}"
    );

    return mapa[container] || "";

}

function editarLocalizacao(container){

    const atual = obterLocalizacao(container);

    const nova = prompt(
        "Informe a localização do container:",
        atual
    );

    if(nova === null){

        return;

    }

    const mapa = JSON.parse(
        localStorage.getItem("localizacoesContainers") || "{}"
    );

    mapa[container] = nova.trim();

    localStorage.setItem(
        "localizacoesContainers",
        JSON.stringify(mapa)
    );

    buscarEstoque();

}


/* ==========================================================
   RENDER ESTOQUE
========================================================== */

function renderTabelaEstoque(lista){

    const inicio =
        (APP.paginaEstoque - 1) * APP.limiteEstoque;

    const fim =
        inicio + APP.limiteEstoque;

    const pagina =
        lista.slice(inicio, fim);

    DOM.theadEstoque.innerHTML = `

        <th>CONTAINER</th>
        <th>ISO</th>
        <th>ESTADO</th>
        <th>CLIENTE</th>
        <th>BOOKING</th>
        <th>LOCALIZAÇÃO</th>

    `;

    DOM.tbodyEstoque.innerHTML = "";

    if(pagina.length === 0){

        DOM.tbodyEstoque.innerHTML = `

            <tr>

                <td colspan="6" class="loading">
                    Nenhum resultado encontrado.
                </td>

            </tr>

        `;

        return;

    }

    pagina.forEach(registro=>{

        const localizacao =
            obterLocalizacao(registro.container);

        DOM.tbodyEstoque.innerHTML += `

            <tr>

                <td>${registro.container}</td>
                <td>${registro.iso}</td>
                <td>${registro.estado}</td>
                <td>${registro.cliente}</td>
                <td>${registro.booking}</td>

                <td>

                    ${localizacao
                        ? localizacao
                        : `

                            <button
                                onclick="editarLocalizacao('${registro.container}')">

                                Editar

                            </button>

                        `
                    }

                </td>

            </tr>

        `;

    });

    document.getElementById("totalEstoque").textContent =
        lista.length;

    document.getElementById("paginaEstoque").textContent =
        APP.paginaEstoque;

}
/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

function iniciarPortal(){

    debug(

        "================================"

    );

    debug(

        "Portal Operacional CDI"

    );

    debug(

        "Versão:",

        CONFIG.VERSAO

    );

    debug(

        "================================"

    );

   carregarPlanilha();
   
    carregarEstoque();
   
     mostrarInicio();

}



/* ==========================================================
   EVENTOS
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        iniciarPortal();

       document
    .getElementById("estoqueAnterior")
    .addEventListener("click", estoqueAnterior);

       document
    .getElementById("estoqueProximo")
    .addEventListener("click", estoqueProximo);

       document
    .getElementById("limiteEstoque")
    .addEventListener("change", alterarLimiteEstoque);
    }

);



/* ==========================================================
   ATALHOS
========================================================== */

function atualizarPlanilha(){

    APP.carregado = false;

    APP.dados = [];

    carregarPlanilha();

}



function totalRegistros(){

    return APP.dados.length;

}



function obterRegistro(indice){

    return APP.dados[indice];

}



/* ==========================================================
   PESQUISA FUTURA
========================================================== */

function pesquisarContainer(numero){

    numero = textoMaiusculo(numero);

    return APP.dados.filter(registro=>{

        return registro.container

            .includes(numero);

    });

}



function pesquisarCliente(cliente){

    cliente = textoMaiusculo(cliente);

    return APP.dados.filter(registro=>{

        return registro.cliente

            .includes(cliente);

    });

}



/* ==========================================================
   ORDENAÇÃO
========================================================== */

function ordenarPorData(lista){

    return [...lista].sort(

        (a,b)=>{

            if(

                !a.dataAg ||

                !b.dataAg

            ){

                return 0;

            }

            return a.dataAg - b.dataAg;

        }

    );

}



/* ==========================================================
   ESTATÍSTICAS
========================================================== */

function estatisticas(){

    return{

        registros:

            APP.dados.length,

        carregado:

            APP.carregado,

        ultimaAtualizacao:

            APP.ultimaAtualizacao,


    };

}



/* ==========================================================
   DEBUG
========================================================== */

if(CONFIG.DEBUG){

    window.APP = APP;

    window.CONFIG = CONFIG;

    window.DOM = DOM;

}



/* ==========================================================
   EXPORTAÇÕES FUTURAS
========================================================== */

window.mostrarInicio = mostrarInicio;
window.mostrarProgramacao = mostrarProgramacao;
window.buscarProgramacao = buscarProgramacao;

window.mostrarEstoque = mostrarEstoque;
window.editarLocalizacao = editarLocalizacao;
window.buscarEstoque = buscarEstoque;

window.abrirDEV = abrirDEV;
window.salvarTSV = salvarTSV;
window.restaurarTSV = restaurarTSV;

window.atualizarPlanilha = atualizarPlanilha;

/* ==========================================================
   FIM DO ARQUIVO
========================================================== */
