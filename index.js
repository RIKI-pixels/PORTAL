
/* =====================================================
   PORTAL CDI
   Desenvolvido por: Kallyel
   Versão: 2.0
===================================================== */


/* =====================================================
   LINK DA PLANILHA
===================================================== */

const url =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTo2yDYJIk7j-FOFM_02DgQyXXrH6TXbjlR5T_RvqyoeEpKjaIOc4xJRekjmD24MA/pub?gid=1756837760&single=true&output=tsv";


/* =====================================================
   VARIÁVEIS GLOBAIS
===================================================== */

let dados = [];
let relatorioAtual = "";

/* =====================================================
   MAPEAMENTO DAS COLUNAS
===================================================== */

let COL = {};

function mapearColunas(){

    if(!dados.length) return;

    const cabecalho = dados[0];

    COL = {};

    cabecalho.forEach((nome,indice)=>{

        COL[nome.trim().toUpperCase()] = indice;

    });

    console.log("COLUNAS ENCONTRADAS");

    console.table(COL);

}
/* =====================================================
   CLIENTES ESTUFAGEM
===================================================== */

const clientesEstufagem = [

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


/* =====================================================
   CARREGA PLANILHA
===================================================== */

Papa.parse(url, {

    download: true,

    delimiter: "\t",

    skipEmptyLines: true,

    complete(resultado){

        dados = resultado.data;

        mapearColunas();

        console.log("Planilha carregada.");

        console.log("Total de linhas:", dados.length);

        document.getElementById("tbody").innerHTML = `
            <tr>
                <td class="loading">
                    Planilha carregada com sucesso.
                </td>
            </tr>
        `;

    },

    error(err){

        console.error(err);

        document.getElementById("tbody").innerHTML = `
            <tr>
                <td class="loading">
                    Erro ao carregar planilha.
                </td>
            </tr>
        `;

    }

});


/* =====================================================
   CONTROLE DAS TELAS
===================================================== */

function limparMenu(){

    document
        .querySelectorAll(".menu-item")
        .forEach(item => item.classList.remove("active"));

}


function mostrarInicio(){

    limparMenu();

    document.getElementById("inicioBtn").classList.add("active");

    document.getElementById("inicio").style.display = "flex";

    document.getElementById("relatorios").style.display = "none";

    document.getElementById("programacao").style.display = "none";

}


function mostrarRelatorios(){

    limparMenu();

    document.getElementById("relatoriosBtn").classList.add("active");

    document.getElementById("inicio").style.display = "none";

    document.getElementById("relatorios").style.display = "block";

    document.getElementById("programacao").style.display = "none";

}


function mostrarProgramacao(){

    limparMenu();

    document.getElementById("programacaoBtn").classList.add("active");

    document.getElementById("inicio").style.display = "none";

    document.getElementById("relatorios").style.display = "none";

    document.getElementById("programacao").style.display = "block";

}



/* =====================================================
   DATA BR
===================================================== */

function parseDataBR(dataStr){

    if(!dataStr) return null;

    dataStr = String(dataStr).trim();

    if(dataStr === "00/00/00")
        return null;

    const somenteData = dataStr.split(" ")[0];

    const partes = somenteData.split("/");

    if(partes.length !== 3)
        return null;

    let dia = Number(partes[0]);

    let mes = Number(partes[1]);

    let ano = Number(partes[2]);

    if(
        isNaN(dia) ||
        isNaN(mes) ||
        isNaN(ano)
    ){
        return null;
    }

    if(ano < 100)
        ano += 2000;

    const data = new Date(
        ano,
        mes - 1,
        dia,
        12,
        0,
        0
    );

    if(
        data.getFullYear() !== ano ||
        data.getMonth() !== mes - 1 ||
        data.getDate() !== dia
    ){
        return null;
    }

    return data;

}



/* =====================================================
   CONVERTE INPUT DATE
===================================================== */

function parseInputDate(valor, fim = false){

    if(!valor)
        return null;

    const data = new Date(valor + "T00:00:00");

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



/* =====================================================
   COMPARA PERÍODO
===================================================== */

function dataEntre(data, inicio, fim){

    if(
        !data ||
        !inicio ||
        !fim
    ){
        return false;
    }

    return (
        data >= inicio &&
        data <= fim
    );

}
/* =====================================================
   RELATÓRIOS
===================================================== */

function abrirRelatorio(tipo){

    relatorioAtual = tipo;

    const filtros = document.getElementById("filtrosRelatorio");

    switch(tipo){

        case "DEVS":

            filtros.classList.add("active");
            break;

        default:

            filtros.classList.remove("active");
            buscarRelatorio();
            break;

    }

}


/* =====================================================
   VALIDA PERÍODO
===================================================== */

function validarPeriodo(dataLinha){

    const inicio = parseInputDate(
        document.getElementById("inicioData").value
    );

    const fim = parseInputDate(
        document.getElementById("fimData").value,
        true
    );

    return dataEntre(
        dataLinha,
        inicio,
        fim
    );

}


/* =====================================================
   FILTRO RELATÓRIOS
===================================================== */

function buscarRelatorio(){

    if(dados.length <= 1){

        alert("Planilha ainda não foi carregada.");

        return;

    }

    const lista = dados.filter((linha,index)=>{

        if(index === 0)
            return false;

        const status = (linha[1] || "").trim().toUpperCase();

        const tipo = (linha[4] || "").trim().toUpperCase();

        const dataAg = parseDataBR(linha[10]);

        const janela = (linha[11] || "").trim();

        const armador = (linha[14] || "").trim();

        const ddl = parseDataBR(linha[18]);

        const pendencia = (linha[22] || "").trim().toUpperCase();



        /* ==========================================
           DEVOLUÇÕES
        ========================================== */

        if(relatorioAtual === "DEVS"){

            if(tipo !== "IMPO")
                return false;

            if(!dataAg)
                return false;

            return validarPeriodo(dataAg);

        }



        /* ==========================================
           PENDÊNCIAS
        ========================================== */

        if(relatorioAtual === "PENDENCIAS"){

            return pendencia === "PENDÊNCIAS";

        }



        /* ==========================================
           DEADLINES
        ========================================== */

        if(relatorioAtual === "DEADLINE"){

            if(status !== "AGENDAR")
                return false;

            if(!ddl)
                return false;

            const hoje = new Date();

            hoje.setHours(
                0,
                0,
                0,
                0
            );

            ddl.setHours(
                0,
                0,
                0,
                0
            );

            const dias =
                Math.floor(
                    (ddl - hoje) /
                    86400000
                );

            return (
                dias >= 0 &&
                dias <= 2
            );

        }

        return false;

    });
    
/* =====================================================
   RENDERIZA TABELA
===================================================== */

function renderizarTabela(thead, tbody, colunas, lista){

    thead.innerHTML = "";
    tbody.innerHTML = "";

    /* Cabeçalho */

    let htmlHead = "";

    colunas.forEach(col=>{

        htmlHead += `<th>${col.titulo}</th>`;

    });

    thead.innerHTML = htmlHead;


    /* Sem resultados */

    if(lista.length === 0){

        tbody.innerHTML = `
            <tr>
                <td colspan="${colunas.length}">
                    Nenhum resultado encontrado.
                </td>
            </tr>
        `;

        return;

    }


    /* Corpo */

    let htmlBody = "";

    lista.forEach(item=>{

        htmlBody += "<tr>";

        colunas.forEach(col=>{

            htmlBody += `
                <td>${item[col.indice] ?? ""}</td>
            `;

        });

        htmlBody += "</tr>";

    });

    tbody.innerHTML = htmlBody;

}

    function renderTabela(lista,tipo){

    const tbody =
        document.getElementById("tbody");

    const thead =
        document.getElementById("thead");

    let colunas = [];


    /* DEVOLUÇÕES */

    if(tipo === "DEVS"){

        colunas = [

            { titulo:"DU-E / DI", indice:COL["DU-E / DI"] },

            { titulo:"ISO", indice:COL["ISO"] },

            { titulo:"CONTAINER", indice:COL["CONTAINER"] },

            { titulo:"DATA AG.", indice:COL["DATA AG."] },

            { titulo:"JANELA", indice:COL["JANELA"] },

            { titulo:"CLIENTE", indice:COL["CLIENTE"] }

        ];

    }


    /* PENDÊNCIAS */

    if(tipo === "PENDENCIAS"){

        colunas = [

            { titulo:"STATUS", indice:COL["STATUS"] },

            { titulo:"CONTAINER", indice:COL["CONTAINER"] },

            { titulo:"CLIENTE", indice:COL["CLIENTE"] },

            { titulo:"DATA AG.", indice:COL["DATA AG."] },

            { titulo:"PENDÊNCIA", indice:COL["PENDÊNCIAS"] }

        ];

    }


    /* DEADLINE */

    if(tipo === "DEADLINE"){

        colunas = [

            { titulo:"STATUS", indice:COL["STATUS"] },

            { titulo:"CONTAINER", indice:COL["CONTAINER"] },

            { titulo:"CLIENTE", indice:COL["CLIENTE"] },

            { titulo:"DATA AG.", indice:COL["DATA AG."] },

            { titulo:"DDL", indice:COL["DDL"] }

        ];

    }


    renderizarTabela(

        thead,

        tbody,

        colunas,

        lista

    );

}
/* =====================================================
   PROGRAMAÇÃO
===================================================== */

function buscarProgramacao(){

    if(dados.length <= 1){

        alert("A planilha ainda não foi carregada.");
        return;

    }

    const tipo = document.getElementById("tipoProgramacao").value;

    const inicio = parseInputDate(
        document.getElementById("progInicio").value
    );

    const fim = parseInputDate(
        document.getElementById("progFim").value,
        true
    );

    if(!inicio || !fim){

        alert("Selecione um período.");

        return;

    }

    const lista = dados.filter((linha,index)=>{

        if(index === 0)
            return false;

        const status =
         (linha[COL["TIPO"]] || "")
            .trim()
            .toUpperCase();

        const cliente =
            (linha[COL["CLIENTE"]] || "")
            .trim()
            .toUpperCase();

        const dataTexto =
            (linha[COL["DATA AG."]] || "")
            .trim();

        const data =
            parseDataBR(dataTexto);

        if(!data)
            return false;

        if(!dataEntre(data,inicio,fim))
            return false;

        if(tipo === "ESTUFAGEM"){

            return clientesEstufagem
                .map(c=>c.toUpperCase())
                .includes(cliente);

        }

        return status === tipo;

    });

    renderProgramacao(lista);

}
/* =====================================================
   TABELA PROGRAMAÇÃO
===================================================== */

function renderProgramacao(lista){

    const tbody =
        document.getElementById("tbodyProg");

    const thead =
        document.getElementById("theadProg");

    renderizarTabela(

        thead,

        tbody,

        [

            { titulo:"TIPO", indice:COL["TIPO"] },

            { titulo:"CLIENTE", indice:COL["CLIENTE"] },

            { titulo:"CONTAINER", indice:COL["CONTAINER"] },

            { titulo:"DATA AG.", indice:COL["DATA AG."] },

            { titulo:"JANELA", indice:COL["JANELA"] },

            { titulo:"BOOKING", indice:COL["BOOKING"] },

            { titulo:"DDL", indice:COL["DDL"] }

        ],

        lista

    );

}
    /* =========================
    PENDÊNCIAS
    ========================= */

    if(tipo === "PENDENCIAS"){

        colunas = [

            { nome:"STATUS", coluna:1 },
            { nome:"CONTAINER", coluna:9 },
            { nome:"CLIENTE", coluna:12 },
            { nome:"DATA", coluna:10 },
            { nome:"PENDÊNCIA", coluna:22 }

        ];

    }

    /* =========================
    DEADLINE
    ========================= */

    if(tipo === "DEADLINE"){

        colunas = [

            { nome:"STATUS", coluna:1 },
            { nome:"CONTAINER", coluna:9 },
            { nome:"CLIENTE", coluna:12 },
            { nome:"DATA", coluna:10 },
            { nome:"DDL", coluna:18 }

        ];

    }

    colunas.forEach(campo=>{

        thead.innerHTML += `
            <th>${campo.nome}</th>
        `;

    });

    lista.forEach(item=>{

        let linha = "<tr>";

        colunas.forEach(campo=>{

            linha += `
                <td>${item[campo.coluna] || ""}</td>
            `;

        });

        linha += "</tr>";

        tbody.innerHTML += linha;

    });

}

/* =========================
ABRE HOME AO INICIAR
========================= */

mostrarInicio();
