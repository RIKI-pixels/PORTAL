/* ==========================================================
   PORTAL OPERACIONAL CDI
   Versão 2.0
========================================================== */


/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const CONFIG = {

    URL_PLANILHA:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo2yDYJIk7j-FOFM_02DgQyXXrH6TXbjlR5T_RvqyoeEpKjaIOc4xJRekjmD24MA/pub?gid=921961552&single=true&output=tsv",

    DEBUG: false,

    VERSAO: "2.0.0"

};


/* ==========================================================
   ESTADO DA APLICAÇÃO
========================================================== */

const APP = {

    dados: [],

    relatorioAtual: "",

    carregado: false,

    ultimaAtualizacao: null

};


/* ==========================================================
   CLIENTES ESTUFAGEM
========================================================== */

const CLIENTES_ESTUFAGEM = [

    "MARINI",

    "RANDA",

    "METISA",

    "COMPENSADOS NM",

    "EURO",

    "EAGLE",

    "THOMASI",

    "AFFONSO DITZEL",

    "MULTIPINE"

];


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

    tbody: document.getElementById("tbody"),

    thead: document.getElementById("thead"),

    tbodyProg: document.getElementById("tbodyProg"),

    theadProg: document.getElementById("theadProg")

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

function parseDataBR(dataStr){

    if(!dataStr){

        return null;

    }

    dataStr = texto(dataStr);

    if(dataStr === ""){

        return null;

    }

    const somenteData = dataStr.split(" ")[0];

    const partes = somenteData.split("/");

    if(partes.length !== 3){

        return null;

    }

    let dia = parseInt(partes[0]);

    let mes = parseInt(partes[1]);

    let ano = parseInt(partes[2]);

    if(isNaN(dia)) return null;

    if(isNaN(mes)) return null;

    if(isNaN(ano)) return null;

    if(ano < 100){

        ano += 2000;

    }

    const data = new Date(

        ano,

        mes - 1,

        dia,

        12,

        0,

        0

    );

    if(

        data.getDate() !== dia ||

        data.getMonth() !== (mes - 1) ||

        data.getFullYear() !== ano

    ){

        return null;

    }

    return data;

}


function parseInputData(valor,fim=false){

    if(!valor){

        return null;

    }

    const data = new Date(valor);

    if(fim){

        data.setHours(

            23,

            59,

            59,

            999

        );

    }else{

        data.setHours(

            0,

            0,

            0,

            0

        );

    }

    return data;

}


function dataEntre(data,inicio,fim){

    if(!data){

        return false;

    }

    return (

        data >= inicio &&

        data <= fim

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


/* ==========================================================
   CARREGAMENTO DA PLANILHA
========================================================== */

function carregarPlanilha(){

    DOM.tbody.innerHTML = `

        <tr>

            <td class="loading">

                Carregando planilha...

            </td>

        </tr>

    `;

    Papa.parse(

        CONFIG.URL_PLANILHA,

        {

            download:true,

            delimiter:"\t",

            skipEmptyLines:true,

            complete(resultado){

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

                DOM.tbody.innerHTML = `

                    <tr>

                        <td class="loading">

                            Planilha carregada com sucesso.

                            <br><br>

                            ${APP.dados.length} registros encontrados.

                        </td>

                    </tr>

                `;

            },

            error(erro){

                console.error(erro);

                DOM.tbody.innerHTML = `

                    <tr>

                        <td class="loading">

                            Erro ao carregar a planilha.

                        </td>

                    </tr>

                `;

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

    limparMenu();

    document
        .getElementById("inicioBtn")
        .classList.add("active");

    document
        .getElementById("inicio")
        .style.display = "flex";

    document
        .getElementById("relatorios")
        .style.display = "none";

    document
        .getElementById("programacao")
        .style.display = "none";

}


function mostrarRelatorios(){

    limparMenu();

    document
        .getElementById("relatoriosBtn")
        .classList.add("active");

    document
        .getElementById("inicio")
        .style.display = "none";

    document
        .getElementById("relatorios")
        .style.display = "block";

    document
        .getElementById("programacao")
        .style.display = "none";

}


function mostrarProgramacao(){

    limparMenu();

    document
        .getElementById("programacaoBtn")
        .classList.add("active");

    document
        .getElementById("inicio")
        .style.display = "none";

    document
        .getElementById("relatorios")
        .style.display = "none";

    document
        .getElementById("programacao")
        .style.display = "block";

}

/* ==========================================================
   ABRIR RELATÓRIO
========================================================== */

function abrirRelatorio(tipo){

    APP.relatorioAtual = tipo;

    const filtros = document.getElementById("filtrosRelatorio");

    if(tipo === "DEVS"){

        filtros.classList.add("active");

    }else{

        filtros.classList.remove("active");

        buscarRelatorio();

    }

}


/* ==========================================================
   VALIDAÇÃO DE PERÍODO
========================================================== */

function validarPeriodo(data){

    const inicio = document.getElementById("inicioData").value;

    const fim = document.getElementById("fimData").value;

    if(!inicio || !fim){

        return false;

    }

    const dataInicio = parseInputData(inicio);

    const dataFim = parseInputData(fim,true);

    return dataEntre(

        data,

        dataInicio,

        dataFim

    );

}


/* ==========================================================
   RELATÓRIOS
========================================================== */

function buscarRelatorio(){

    if(!verificarCarregamento()){

        return;

    }

    let lista = [];

    switch(APP.relatorioAtual){

        /* ==========================
           DEVOLUÇÕES
        ========================== */

        case "DEVS":

            lista = APP.dados.filter(registro=>{

                if(!registro.dataAg){

                    return false;

                }

                return(

                    registro.modal === "IMPO"

                    &&

                    validarPeriodo(registro.dataAg)

                );

            });

        break;



        /* ==========================
           PENDÊNCIAS
        ========================== */

        case "PENDENCIAS":

            lista = APP.dados.filter(registro=>{

                return(

                    registro.pendencia === "PENDÊNCIAS"

                );

            });

        break;



        /* ==========================
           DEADLINE
        ========================== */

        case "DEADLINE":

            lista = APP.dados.filter(registro=>{

                if(

                    registro.status !== "AGENDAR"

                ){

                    return false;

                }

                if(!registro.ddl){

                    return false;

                }

                const hoje = new Date();

                hoje.setHours(

                    0,

                    0,

                    0,

                    0

                );

                registro.ddl.setHours(

                    0,

                    0,

                    0,

                    0

                );

                const dias =

                    (registro.ddl - hoje)

                    /

                    86400000;

                return(

                    dias >= 0

                    &&

                    dias <= 2

                );

            });

        break;

    }

    renderTabelaRelatorio(lista);

}



/* ==========================================================
   COLUNAS DOS RELATÓRIOS
========================================================== */

function obterColunasRelatorio(){

    switch(APP.relatorioAtual){

        case "DEVS":

            return [

                {

                    nome:"DU-E / DI",

                    campo:"duDi"

                },

                {

                    nome:"ISO",

                    campo:"iso"

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

                    nome:"CLIENTE",

                    campo:"cliente"

                }

            ];



        case "PENDENCIAS":

            return [

                {

                    nome:"STATUS",

                    campo:"status"

                },

                {

                    nome:"CONTAINER",

                    campo:"container"

                },

                {

                    nome:"CLIENTE",

                    campo:"cliente"

                },

                {

                    nome:"DATA",

                    campo:"dataTexto"

                },

                {

                    nome:"PENDÊNCIA",

                    campo:"pendencia"

                }

            ];



        case "DEADLINE":

            return [

                {

                    nome:"STATUS",

                    campo:"status"

                },

                {

                    nome:"CONTAINER",

                    campo:"container"

                },

                {

                    nome:"CLIENTE",

                    campo:"cliente"

                },

                {

                    nome:"DATA",

                    campo:"dataTexto"

                },

                {

                    nome:"DDL",

                    campo:"ddlTexto"

                }

            ];

    }

    return [];

}

/* ==========================================================
   PROGRAMAÇÃO
========================================================== */

function buscarProgramacao(){

    if(!verificarCarregamento()){

        return;

    }

    const tipo = document.getElementById("tipoProgramacao").value;

    const inicio = document.getElementById("progInicio").value;

    const fim = document.getElementById("progFim").value;

    if(!inicio || !fim){

        alert("Selecione o período.");

        return;

    }

    const dataInicio = parseInputData(inicio);

    const dataFim = parseInputData(fim,true);

    let lista = APP.dados.filter(registro=>{

        if(!registro.dataAg){

            return false;

        }

        if(!dataEntre(

            registro.dataAg,

            dataInicio,

            dataFim

        )){

            return false;

        }

        if(tipo === "ESTUFAGEM"){

            return CLIENTES_ESTUFAGEM.includes(

                registro.cliente

            );

        }

        return registro.tipo === tipo;

    });

    lista.sort((a,b)=>{

        return a.dataAg - b.dataAg;

    });

    renderTabelaProgramacao(lista);

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
   RENDER RELATÓRIOS
========================================================== */

function renderTabelaRelatorio(lista){

    renderTabela(

        DOM.thead,

        DOM.tbody,

        obterColunasRelatorio(),

        lista

    );

}



/* ==========================================================
   RENDER PROGRAMAÇÃO
========================================================== */

function renderTabelaProgramacao(lista){

    renderTabela(

        DOM.theadProg,

        DOM.tbodyProg,

        obterColunasProgramacao(),

        lista

    );

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

    mostrarInicio();

}



/* ==========================================================
   EVENTOS
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        iniciarPortal();

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

        relatorioAtual:

            APP.relatorioAtual

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

window.mostrarRelatorios = mostrarRelatorios;

window.mostrarProgramacao = mostrarProgramacao;

window.buscarProgramacao = buscarProgramacao;

window.buscarRelatorio = buscarRelatorio;

window.abrirRelatorio = abrirRelatorio;

window.atualizarPlanilha = atualizarPlanilha;



/* ==========================================================
   FIM DO ARQUIVO
========================================================== */
