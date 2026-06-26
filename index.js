
/* =========================
LINK PLANILHA
========================= */

const url =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTo2yDYJIk7j-FOFM_02DgQyXXrH6TXbjlR5T_RvqyoeEpKjaIOc4xJRekjmD24MA/pub?gid=565323721&single=true&output=tsv";

/* =========================
DADOS
========================= */

let dados = [];
let relatorioAtual = "";

/* =========================
CLIENTES ESTUFAGEM
========================= */

const clientesEstufagem = [

    "MARINI",
    "RANDA",
    "METISA",
    "COMPENSADOS NM",
    "EURO",
    "EAGLE",
    "THOMASI",
    "AFFONSO DITZEL",
    "MULTIPINE",
    


];
/* =========================
CARREGA PLANILHA
========================= */

Papa.parse(url,{

    download:true,
    delimiter:"\t",
    skipEmptyLines:true,

    complete:function(resultado){

        dados = resultado.data;

        document.getElementById("tbody").innerHTML = `
            <tr>
                <td class="loading">
                    Planilha carregada com sucesso.
                </td>
            </tr>
        `;

        console.log(dados);

    }

});

/* =========================
TELAS
========================= */

function limparMenu(){

    document.querySelectorAll(".menu-item")
    .forEach(item=>item.classList.remove("active"));

}

function mostrarInicio(){

    limparMenu();

    document.getElementById("inicioBtn")
    .classList.add("active");

    document.getElementById("inicio")
    .style.display = "flex";

    document.getElementById("relatorios")
    .style.display = "none";

    document.getElementById("programacao")
    .style.display = "none";

}

function mostrarRelatorios(){

    limparMenu();

    document.getElementById("relatoriosBtn")
    .classList.add("active");

    document.getElementById("inicio")
    .style.display = "none";

    document.getElementById("relatorios")
    .style.display = "block";

    document.getElementById("programacao")
    .style.display = "none";

}

function mostrarProgramacao(){

    limparMenu();

    document.getElementById("programacaoBtn")
    .classList.add("active");

    document.getElementById("inicio")
    .style.display = "none";

    document.getElementById("relatorios")
    .style.display = "none";

    document.getElementById("programacao")
    .style.display = "block";

}

/* =========================
DATA BR
========================= */

function parseDataBR(dataStr){

    if(!dataStr) return null;

    dataStr = dataStr.toString().trim();

    const partes = dataStr.split(" ");
    const dataParte = partes[0];

    const d = dataParte.split("/");

    if(d.length !== 3) return null;

    let dia = parseInt(d[0],10);
    let mes = parseInt(d[1],10)-1;
    let ano = parseInt(d[2],10);

    if(ano < 100){
        ano += 2000;
    }

    const data = new Date(ano,mes,dia);

    if(isNaN(data.getTime())){
        return null;
    }

    return data;

}

/* =========================
ABRIR RELATÓRIO
========================= */

function abrirRelatorio(tipo){

    relatorioAtual = tipo;

    const filtros =
        document.getElementById("filtrosRelatorio");

    if(tipo === "DEVS"){

        filtros.classList.add("active");

    }else{

        filtros.classList.remove("active");

        buscarRelatorio();

    }

}

/* =========================
VALIDAR PERÍODO
========================= */

function validarPeriodo(dataLinha){

    const inicio =
        document.getElementById("inicioData").value;

    const fim =
        document.getElementById("fimData").value;

    if(!inicio || !fim) return false;

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    dataInicio.setHours(0,0,0,0);
    dataFim.setHours(23,59,59,999);

    return (
        dataLinha >= dataInicio &&
        dataLinha <= dataFim
    );

}

/* =========================
RELATÓRIOS
========================= */

function buscarRelatorio(){

    let filtrado = [];

    filtrado = dados.filter((linha,index)=>{

 
        if(index === 0) return false;

        const B = (linha[1] || "").trim();
        const E = (linha[4] || "").trim();
        const K = (linha[10] || "").trim();
        const S = (linha[18] || "").trim();
        const W = (linha[22] || "").trim();
        const L = (linha[11] || "").trim();
        const O = (linha[14] || "").trim();

        //const B = (linha[1] || "").trim();
        //const G = (linha[6] || "").trim();
        //const H = (linha[7] || "").trim();
        //const L = (linha[11] || "").trim();
        //const M = (linha[12] || "").trim();
        //const N = (linha[13] || "").trim();




        /* =========================
        DEVOLUÇÕES
        COLUNA E = IMPO
        ========================= */

        if(relatorioAtual === "DEVS"){

            const dataK = parseDataBR(K);

            if(!dataK) return false;

            return (
                E.toUpperCase() === "IMPO" &&
                validarPeriodo(dataK)
            );

        }

        /* =========================
        PENDÊNCIAS
        COLUNA W
        ========================= */

        if(relatorioAtual === "PENDENCIAS"){

            return (
                W.toUpperCase() === "PENDÊNCIAS"
            );

        }

        /* =========================
        DEADLINE
        COLUNA S
        ========================= */

        if(relatorioAtual === "DEADLINE"){

            if(B.toUpperCase() !== "AGENDAR"){
                return false;
            }

            const dataDeadline =
                parseDataBR(S);

            if(!dataDeadline){
                return false;
            }

            const hoje = new Date();

            hoje.setHours(0,0,0,0);
            dataDeadline.setHours(0,0,0,0);

            const diff =
                (dataDeadline - hoje) /
                (1000 * 60 * 60 * 24);

            return diff >= 0 && diff <= 2;

        }

    });

    renderTabela(filtrado,relatorioAtual);

}

/* =========================
PROGRAMAÇÃO
========================= */

function buscarProgramacao(){

    const tipo = document.getElementById("tipoProgramacao").value;

    const inicio = document.getElementById("progInicio").value;

    const fim = document.getElementById("progFim").value;

    if(!inicio || !fim){
        alert("Selecione o período.");
        return;
    }

    const dataInicio = new Date(inicio + "T00:00:00");
    const dataFim = new Date(fim + "T23:59:59");

    const tbody = document.getElementById("tbodyProg");
    const thead = document.getElementById("theadProg");

    tbody.innerHTML = "";
    thead.innerHTML = "";

    console.clear();

    console.log("Filtro");
    console.log({
        tipo,
        inicio,
        fim,
        dataInicio,
        dataFim
    });

    const lista = dados.filter((linha,index)=>{

        if(index === 0) return false;

        const status = (linha[0] || "").trim().toUpperCase();

        const cliente = (linha[12] || "").trim().toUpperCase();

        const dataTexto = (linha[10] || "").trim();

        const dataLinha = parseDataBR(dataTexto);

        if(!dataLinha){

            console.warn("Data inválida:", dataTexto, linha);

            return false;

        }

        dataLinha.setHours(0,0,0,0);

        let aprovado = false;

        if(tipo === "ESTUFAGEM"){

            aprovado =
                clientesEstufagem
                    .map(c => c.toUpperCase())
                    .includes(cliente)

                &&

                dataLinha >= dataInicio

                &&

                dataLinha <= dataFim;

        }else{

            aprovado =
                status === tipo

                &&

                dataLinha >= dataInicio

                &&

                dataLinha <= dataFim;

        }

        console.log({
            container: linha[9],
            status,
            cliente,
            dataTexto,
            dataLinha,
            aprovado
        });

        return aprovado;

    });

    console.log("Total encontrados:", lista.length);

    const colunas = [

        { nome:"TIPO", coluna:0 },
        { nome:"CLIENTE", coluna:12 },
        { nome:"CONTAINER", coluna:9 },
        { nome:"DATA AG.", coluna:10 },
        { nome:"JANELA", coluna:11 },
        { nome:"BOOKING", coluna:13 },
        { nome:"DDL", coluna:18 }

    ];

    colunas.forEach(c=>{

        thead.innerHTML += `<th>${c.nome}</th>`;

    });

    if(lista.length === 0){

        tbody.innerHTML = `
            <tr>
                <td colspan="${colunas.length}">
                    Nenhum resultado encontrado
                </td>
            </tr>
        `;

        return;

    }

    lista.forEach(item=>{

        let linha = "<tr>";

        colunas.forEach(c=>{

            linha += `<td>${item[c.coluna] || ""}</td>`;

        });

        linha += "</tr>";

        tbody.innerHTML += linha;

    });

}
        /* AZ E RX */

      return (
    A === tipo 
          &&
    K >= dataInicio 
          &&
    K <= dataFim
);
    const colunas = [

        { nome:"TIPO", coluna:0 },
        { nome:"CLIENTE", coluna:12 },
        { nome:"CONTAINER", coluna:9 },
        { nome:"DATA AG.", coluna:10 },
        { nome:"JANELA", coluna:11 },
        { nome:"BOOKING", coluna:13 },
        { nome:"DDL", coluna:18 }

    ];

    colunas.forEach(c=>{

        thead.innerHTML += `
            <th>${c.nome}</th>
        `;

    });

    lista.forEach(item=>{

        let linha = "<tr>";

        colunas.forEach(c=>{

            linha += `
                <td>${item[c.coluna] || ""}</td>
            `;

        });

        linha += "</tr>";

        tbody.innerHTML += linha;

    });

}
/* =========================
TABELA
========================= */

function renderTabela(lista,tipo){

    const tbody =
        document.getElementById("tbody");

    const thead =
        document.getElementById("thead");

    tbody.innerHTML = "";
    thead.innerHTML = "";

    if(lista.length === 0){

        tbody.innerHTML = `
            <tr>
                <td colspan="30">
                    Nenhum dado encontrado
                </td>
            </tr>
        `;

        return;

    }

    let colunas = [];

    /* =========================
    DEVOLUÇÕES
    ========================= */

    if(tipo === "DEVS"){

        colunas = [

            { nome:"DU-E / DI", coluna:6 },
            { nome:"ISO", coluna:8 },
            { nome:"CONTAINER", coluna:9 },
            { nome:"DATA AG.", coluna:10 },
            { nome:"JANELA", coluna:11 },
            { nome:"CLIENTE", coluna:12 },

            //{ nome:"BOOKING", coluna:13 },
            //{ nome:"ARMADOR", coluna:14 },
            //{ nome:"DDL", coluna:18 }
        ];

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
