 /* ==========================================================
   PORTAL OPERACIONAL CDI
   Versão 1.5.1 SUBPASE REAL TESTE 1
========================================================== */


/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

/* ==========================================================
   SUPABASE
========================================================== */

const SUPABASE_URL =
    "https://pkgqdwkueimfznhamtgv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_3SWvnPPmmHJme5Xp57CQkg_8IwwJtBE";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log(
    "Supabase conectado:",
    supabaseClient
);

/* ==========================================================
   AUTENTICAÇÃO PORTAL
========================================================== */

let USUARIO_PORTAL = null;


function normalizarCPFLogin(cpf) {

    return String(cpf || "")
        .replace(/\D/g, "");

}


function mostrarErroLogin(mensagem) {

    const erro =
        document.getElementById(
            "loginErro"
        );

    if (!erro) {
        return;
    }

    erro.textContent =
        mensagem;

    erro.style.display =
        "block";

}


function limparErroLogin() {

    const erro =
        document.getElementById(
            "loginErro"
        );

    if (!erro) {
        return;
    }

    erro.textContent = "";

    erro.style.display =
        "none";

}

async function entrarPortal() {

    const inputCPF =
        document.getElementById(
            "loginCPF"
        );

    const inputSenha =
        document.getElementById(
            "loginSenha"
        );

    const botao =
        document.getElementById(
            "btnLogin"
        );


    limparErroLogin();


    const cpf =
        normalizarCPFLogin(
            inputCPF.value
        );

    const senha =
        inputSenha.value;


    if (
        cpf.length !== 11 ||
        !senha
    ) {

        mostrarErroLogin(
            "Informe CPF e senha."
        );

        return;

    }

    botao.disabled = true;
    botao.textContent = "ENTRANDO...";


    try {

        const resposta =
            await fetch(
                `${SUPABASE_URL}/functions/v1/login-portal`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_KEY

                    },

                    body:
                        JSON.stringify({
                            cpf,
                            senha
                        })

                }
            );


        const resultado =
            await resposta.json();


        if (
            !resposta.ok ||
            !resultado.sucesso
        ) {

            mostrarErroLogin(
                resultado.erro ||
                "Não foi possível realizar o login."
            );

            return;

        }

        /* =========================================
           SALVA SESSÃO NO SUPABASE
        ========================================= */

        const {
            error: erroSessao
        } =
            await supabaseClient
                .auth
                .setSession({

                    access_token:
                        resultado
                            .session
                            .access_token,

                    refresh_token:
                        resultado
                            .session
                            .refresh_token

                });


        if (erroSessao) {

            console.error(
                "Erro ao salvar sessão:",
                erroSessao
            );

            mostrarErroLogin(
                "Não foi possível iniciar a sessão."
            );

            return;

        }


        /* =========================================
           USUÁRIO LOGADO
        ========================================= */

        USUARIO_PORTAL =
            resultado.usuario;


        console.log(
            "Usuário conectado:",
            USUARIO_PORTAL
        );


        document
            .getElementById(
                "telaLogin"
            )
            .style
            .display =
                "none";


        inputSenha.value = "";


    }
    catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );


        mostrarErroLogin(
            "Erro de conexão com o servidor."
        );

    }
    finally {

        botao.disabled =
            false;

        botao.textContent =
            "ENTRAR";

    }

}

 /* ==========================================================
   LOG DE ATIVIDADES
========================================================== */

async function registrarLog({
    area,
    acao,
    container = null,
    detalhes = null
}) {

    if (!USUARIO_PORTAL) {

        console.warn(
            "Log ignorado: usuário não identificado."
        );

        return false;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "portal_logs"
                )
                .insert({

                    usuario_id:
                        USUARIO_PORTAL.id,

                    usuario:
                        USUARIO_PORTAL.nome,

                    nivel:
                        USUARIO_PORTAL.nivel,

                    area:
                        String(area || "")
                            .trim()
                            .toUpperCase(),

                    acao:
                        String(acao || "")
                            .trim()
                            .toUpperCase(),

                    container:
                        container
                            ? String(container)
                                .trim()
                                .toUpperCase()
                            : null,

                    detalhes:
                        detalhes
                            ? String(detalhes)
                            : null

                });


        if (error) {

            console.error(
                "Erro ao registrar log:",
                error
            );

            return false;

        }


        console.log(
            "Log registrado:",
            area,
            acao
        );

        return true;

    }
    catch (erro) {

        console.error(
            "Erro inesperado no log:",
            erro
        );

        return false;

    }

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

       restaurarSessaoPortal();

        const botao =
            document.getElementById(
                "btnLogin"
            );


        if (botao) {

            botao.addEventListener(
                "click",
                entrarPortal
            );

        }


        const senha =
            document.getElementById(
                "loginSenha"
            );


        if (senha) {

            senha.addEventListener(
                "keydown",
                evento => {

                    if (
                        evento.key ===
                        "Enter"
                    ) {

                        entrarPortal();

                    }

                }
            );

        }

    }
);

async function restaurarSessaoPortal() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Erro ao verificar sessão:",
                error
            );

            return;

        }


        if (
            !data.session ||
            !data.session.user
        ) {

            return;

        }


        const userId =
            data.session.user.id;


        const {
            data: perfil,
            error: erroPerfil
        } =
            await supabaseClient
                .from(
                    "portal_usuarios"
                )
                .select(
                    "id, nome, cpf, nivel, ativo"
                )
                .eq(
                    "id",
                    userId
                )
                .maybeSingle();


        if (
            erroPerfil ||
            !perfil ||
            !perfil.ativo
        ) {

            console.warn(
                "Sessão existente sem perfil válido."
            );

            await supabaseClient
                .auth
                .signOut();

            return;

        }


        USUARIO_PORTAL =
            perfil;


        console.log(
            "Sessão restaurada:",
            USUARIO_PORTAL
        );


        const telaLogin =
            document.getElementById(
                "telaLogin"
            );


        if (telaLogin) {

            telaLogin.style.display =
                "none";

        }

    }
    catch (erro) {

        console.error(
            "Erro ao restaurar sessão:",
            erro
        );

    }

}

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
    listaProgramacaoBase: [],

    carregado: false,
    carregadoEstoque: false,

    ultimaAtualizacao: null,
    ultimaAtualizacaoEstoque: null,

    paginaEstoque: 1,
    limiteEstoque: 25,

    paginaProgramacao: 1,
    limiteProgramacao: 25,

    pracaSelecionada: null,
   linhaSelecionada: null,
   pilhaSelecionada: null,
   nivelSelecionado: null,
   destinoSelecionado: null,

   containerSelecionado: null,
   
   destinoEstufagemSelecionado: null

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
   PRÇAS
========================================================== */

const PRACAS_PATIO = {

    A: 10,
    B: 37,
    C: 37,
    D: 37

};

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
    mapa: document.getElementById("mapa"),

    inicioBtn: document.getElementById("inicioBtn"),
    programacaoBtn: document.getElementById("programacaoBtn"),
    estoqueBtn: document.getElementById("estoqueBtn"),
    mapaBtn: document.getElementById("mapaBtn"),

    theadProg: document.getElementById("theadProg"),
    tbodyProg: document.getElementById("tbodyProg"),

    theadEstoque: document.getElementById("theadEstoque"),
    tbodyEstoque: document.getElementById("tbodyEstoque"),

    mapaGeral: document.getElementById("mapaGeral"),
    mapaPraca: document.getElementById("mapaPraca"),
    mapaLinha: document.getElementById("mapaLinha"),

    nomePracaSelecionada:
        document.getElementById("nomePracaSelecionada"),

    quantidadeLinhasPraca:
        document.getElementById("quantidadeLinhasPraca"),

    linhasPraca:
        document.getElementById("linhasPraca"),

    nomeLinhaSelecionada:
        document.getElementById("nomeLinhaSelecionada"),

    voltarMapaGeral:
        document.getElementById("voltarMapaGeral"),

    solicitacoes:
         document.getElementById("solicitacoes"),
            
   solicitacoesBtn:

         document.getElementById("solicitacoesBtn")

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

        dataAg: parseDataBR(
            valor(linha,COL.DATA_AG)
        ),

        janela: valor(linha,COL.JANELA),

        cliente: textoMaiusculo(
            valor(linha,COL.CLIENTE)
        ),

        booking: valor(linha,COL.BOOKING),

        armador: valor(linha,COL.ARMADOR),

        ddlTexto: valor(linha,COL.DEADLINE),

        ddl: parseDataBR(
            valor(linha,COL.DEADLINE)
        ),

        pendencia: textoMaiusculo(
            valor(linha,COL.PENDENCIA)
        ),

        localizacao:
            obterLocalizacao(
                valor(linha,COL.CONTAINER)
            ) || "AGUARDANDO MAPEAMENTO"

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

    console.log(
        "Atualizando TSV Transporte..."
    );

    return new Promise(
        (resolve, reject) => {

            Papa.parse(
                CONFIG.URL_PLANILHA,
                {

                    download: true,
                    delimiter: "\t",
                    skipEmptyLines: true,

                    complete(resultado) {

                        APP.dados =
                            resultado.data
                                .slice(1)
                                .map(criarRegistro);

                        APP.carregado = true;

                        APP.ultimaAtualizacao =
                            new Date();

                        document
                            .getElementById(
                                "linhasTransporte"
                            )
                            .textContent =
                                APP.dados.length
                                    .toLocaleString(
                                        "pt-BR"
                                    );

                        document
                            .getElementById(
                                "dataTransporte"
                            )
                            .textContent =
                                APP
                                    .ultimaAtualizacao
                                    .toLocaleString(
                                        "pt-BR"
                                    );

                           console.log(
                            "TSV Transporte atualizado:",
                              APP.dados.length,
                              "registros"
                            );


   /* ==========================================================
                     ATUALIZA PROGRAMAÇÃO ABERTA
   ========================================================== */

                                    const progInicio =
                                        document.getElementById(
                                      "progInicio"
                                     );

                                       const progFim =
                                        document.getElementById(
                                      "progFim"
                                     );


                                 if(
                                    DOM.programacao &&
                                    DOM.programacao.style.display !== "none" &&
                                    progInicio &&
                                    progFim &&
                                    progInicio.value &&
                                    progFim.value
                                 ){

                              console.log(
                                "Atualizando programação exibida..."
                               );

                            buscarProgramacao();

                        }


                              resolve(
                            APP.dados
                        );

                       

                    },

                    error(erro) {

                        console.error(
                            "Erro ao atualizar TSV:",
                            erro
                        );

                        document
                            .getElementById(
                                "linhasTransporte"
                            )
                            .textContent =
                                "--";

                        document
                            .getElementById(
                                "dataTransporte"
                            )
                            .textContent =
                                "Erro ao carregar";

                        reject(erro);

                    }

                }
            );

        }
    );

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
    DOM.mapa.style.display = "none";
    DOM.solicitacoes.style.display = "none";
   
    DOM.inicioBtn.classList.add("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.remove("active");
    DOM.mapaBtn.classList.remove("active");
    DOM.solicitacoesBtn.classList.remove("active");

}


function mostrarProgramacao(){
   
    DOM.dev.style.display = "none";
    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "block";
    DOM.estoque.style.display = "none";
    DOM.mapa.style.display = "none";
    DOM.solicitacoes.style.display = "none";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.add("active");
    DOM.estoqueBtn.classList.remove("active");
    DOM.mapaBtn.classList.remove("active");
    DOM.solicitacoesBtn.classList.remove("active");

}

function mostrarEstoque(){
   
    DOM.dev.style.display = "none";
    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "block";
    DOM.mapa.style.display = "none";
    DOM.solicitacoes.style.display = "none";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.add("active");
    DOM.mapaBtn.classList.remove("active");
    DOM.solicitacoesBtn.classList.remove("active");
}

function abrirDEV(){

    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "none";
    DOM.dev.style.display = "block";
    DOM.mapa.style.display = "none";
    DOM.solicitacoes.style.display = "none";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.remove("active");
    DOM.mapaBtn.classList.remove("active");
    DOM.solicitacoesBtn.classList.remove("active");

    document.getElementById("urlTransporte").value =
        CONFIG.URL_PLANILHA;

    document.getElementById("urlEstoque").value =
        CONFIG.URL_ESTOQUE;

    document.getElementById("clientesEstufagem").value =
        CLIENTES_ESTUFAGEM.join("\n");

}


function mostrarMapa(){

    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "none";
    DOM.dev.style.display = "none";
    DOM.mapa.style.display = "block";
    DOM.solicitacoes.style.display = "none";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.remove("active");
    DOM.mapaBtn.classList.add("active");
    DOM.solicitacoesBtn.classList.remove("active");

    mostrarMapaGeral();

   atualizarAreasSolicitadasMapa();

   atualizarContainerSelecionadoMapa();

   

}

function mostrarSolicitacoes(){

    DOM.inicio.style.display = "none";
    DOM.programacao.style.display = "none";
    DOM.estoque.style.display = "none";
    DOM.mapa.style.display = "none";
    DOM.dev.style.display = "none";
    DOM.solicitacoes.style.display = "block";

    DOM.inicioBtn.classList.remove("active");
    DOM.programacaoBtn.classList.remove("active");
    DOM.estoqueBtn.classList.remove("active");
    DOM.mapaBtn.classList.remove("active");
    DOM.solicitacoesBtn.classList.add("active");

    atualizarDashboardSolicitacoes();

    renderSolicitacoesPendentes();

    renderSolicitacoesEmAndamento();

    renderSolicitacoesConcluidas();
   
   atualizarNotificacaoSolicitacoes();

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

                   <div class="localizacao-estoque">

                       <span>
                        ${localizacao || "SEM LOCALIZAÇÃO"}
                       </span>

                          <button
                              onclick="movimentarContainer('${registro.container}')">

                              Movimentar

                          </button>

                      </div>

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

function estoqueAnterior(){

    if(APP.paginaEstoque > 1){

        APP.paginaEstoque--;

        renderTabelaEstoque(APP.listaEstoqueAtual);

    }

}

function estoqueProximo(){

    const totalPaginas = Math.ceil(

        APP.listaEstoqueAtual.length /
        APP.limiteEstoque

    );

    if(APP.paginaEstoque < totalPaginas){

        APP.paginaEstoque++;

        renderTabelaEstoque(APP.listaEstoqueAtual);

    }

}

function alterarLimiteEstoque(){

    APP.limiteEstoque = Number(

        document.getElementById("limiteEstoque").value

    );

    APP.paginaEstoque = 1;

    renderTabelaEstoque(APP.listaEstoqueAtual);

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

function resetarLocalizacoes(){

    const confirmar = confirm(
        "Deseja realmente apagar todas as localizações salvas?\n\nSolicitações pendentes e em andamento também serão removidas."
    );

    if(!confirmar){
        return;
    }


    // REMOVE TODAS AS LOCALIZAÇÕES

    localStorage.removeItem(
        "localizacoesContainers"
    );


    // MANTÉM SOMENTE O HISTÓRICO CONCLUÍDO

    const solicitacoes =
        obterSolicitacoes();

    const historico =
        solicitacoes.filter(item=>{

            return item.status === "CONCLUÍDO";

        });

    salvarSolicitacoes(
        historico
    );


    // ATUALIZA O ESTADO EM MEMÓRIA DO ESTOQUE

    if(APP.carregadoEstoque){

        APP.dadosEstoque.forEach(registro=>{

            registro.localizacao = "";

        });

    }


    APP.containerSelecionado = null;


    atualizarDashboardSolicitacoes();

    renderSolicitacoesPendentes();

    renderSolicitacoesEmAndamento();

    renderSolicitacoesConcluidas();

    atualizarAreasSolicitadasMapa();

    atualizarNotificacaoSolicitacoes();


    alert(
        "Localizações resetadas.\nSolicitações pendentes e em andamento foram removidas."
    );


    if(APP.carregadoEstoque){

        buscarEstoque();

    }

}

/* ==========================================================
   TESTE SUPABASE - DEV
========================================================== */

async function testarSupabase(){

    try{

        const { data, error } =
            await supabaseClient
                .from("portal_eventos")
                .insert([
                    {
                        tipo: "TESTE",
                        usuario: "DEV",
                        detalhes: "Teste de conexão do Portal CDI"
                    }
                ])
                .select();

        if(error){
            console.error(
                "Erro ao gravar no Supabase:",
                error
            );

            alert(
                "Erro ao gravar no Supabase."
            );

            return;
        }

        console.log(
            "Evento gravado no Supabase:",
            data
        );

        alert(
            "Evento gravado com sucesso!"
        );

    }
    catch(erro){

        console.error(
            "Erro inesperado:",
            erro
        );

        alert(
            "Erro inesperado ao conectar com o Supabase."
        );

    }

}

/* ==========================================================
   ATUALIZAÇÃO GLOBAL DO TSV
========================================================== */

async function atualizarTSVGlobal(){

    try{

        console.log(
            "Iniciando atualização global do TSV..."
        );

        /*
        Primeiro atualiza o computador
        que clicou no botão.
        */
        await carregarPlanilha();

        /*
        Depois avisa todos os outros
        portais através do Supabase.
        */
        const { error } =
            await supabaseClient
                .from("portal_eventos")
                .insert([
                    {
                        tipo: "ATUALIZAR_TSV",
                        usuario: "DEV",
                        detalhes:
                            "Atualização global do TSV Transporte"
                    }
                ]);

        if(error){

            console.error(
                "Erro ao enviar atualização global:",
                error
            );

            alert(
                "TSV atualizado neste computador, mas houve erro ao avisar os outros usuários."
            );

            return;

        }

        console.log(
            "Atualização global enviada."
        );

       await registrarLog({

    area:
        "DEV",

    acao:
        "ATUALIZOU TSV",

    detalhes:
        "Atualização global do TSV Transporte"

   });

        alert(
            "TSV atualizado para todos os usuários!"
        );

    }
    catch(erro){

        console.error(
            "Erro na atualização global:",
            erro
        );

        alert(
            "Não foi possível atualizar o TSV."
        );

    }

}

/* ==========================================================
   REALTIME SUPABASE
========================================================== */

function iniciarRealtimeSupabase(){

    console.log(
        "Iniciando Realtime Supabase..."
    );

    supabaseClient
        .channel("portal-eventos-global")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "portal_eventos"
            },

            payload => {

                console.log(
                    "Evento realtime recebido:",
                    payload.new
                );

                const evento =
                    payload.new;


                /* =========================
                   TESTE
                ========================= */

                if(
                    evento.tipo ===
                    "TESTE"
                ){

                    console.log(
                        "TESTE recebido:",
                        evento
                    );

                    return;
                }


                /* =========================
                   ATUALIZAÇÃO GLOBAL TSV
                ========================= */

                if(
                    evento.tipo ===
                    "ATUALIZAR_TSV"
                ){

                    console.log(
                        "Solicitação global de atualização TSV recebida."
                    );

                    carregarPlanilha()
                        .then(()=>{

                            console.log(
                                "TSV atualizado através do Realtime."
                            );

                        })
                        .catch(erro=>{

                            console.error(
                                "Erro ao atualizar TSV pelo Realtime:",
                                erro
                            );

                        });

                }

            }
        )

        .subscribe(status => {

            console.log(
                "Status Realtime:",
                status
            );

        });

}

/* ==========================================================
   MAPA
========================================================== */

   function mostrarMapaGeral(){

    DOM.mapaGeral.style.display = "block";

    DOM.mapaPraca.style.display = "none";

    DOM.mapaLinha.style.display = "none";

    DOM.voltarMapaGeral.style.display = "none";

}

function abrirPraca(nomePraca){

    const quantidadeLinhas =
        PRACAS_PATIO[nomePraca];

    if(!quantidadeLinhas){
        return;
    }

    APP.pracaSelecionada = nomePraca;
    APP.linhaSelecionada = null;

    DOM.mapaGeral.style.display = "none";
    DOM.mapaPraca.style.display = "block";
    DOM.mapaLinha.style.display = "none";

    DOM.voltarMapaGeral.style.display = "block";

    DOM.nomePracaSelecionada.textContent =
        nomePraca;

    DOM.quantidadeLinhasPraca.textContent =
        quantidadeLinhas;

    gerarLinhasPraca(
        nomePraca,
        quantidadeLinhas
    );

}

   function gerarLinhasPraca(
    nomePraca,
    quantidade
){

    DOM.linhasPraca.innerHTML = "";

    for(
        let numero = 1;
        numero <= quantidade;
        numero++
    ){

        const numeroFormatado =
            String(numero).padStart(2,"0");

        const nomeLinha =
            `${nomePraca}-${numeroFormatado}`;

        const botao =
            document.createElement("button");

        botao.className =
            "linha-patio";

        botao.innerHTML = `

            <strong>
                ${nomeLinha}
            </strong>

            <span>
                4 pilhas
            </span>

        `;

        botao.addEventListener(
            "click",
            ()=>abrirLinha(nomeLinha)
        );

        DOM.linhasPraca.appendChild(
            botao
        );

    }

}

function abrirLinha(nomeLinha){

    APP.linhaSelecionada = nomeLinha;

    DOM.mapaGeral.style.display = "none";
    DOM.mapaPraca.style.display = "none";
    DOM.mapaLinha.style.display = "block";

    DOM.voltarMapaGeral.style.display = "block";

    DOM.nomeLinhaSelecionada.textContent =
        nomeLinha;

    atualizarVisualLinha();

}

function obterLocalizacoes(){

    return LOCALIZACOES_CONTAINERS;

}


function salvarLocalizacoes(localizacoes){

    console.warn(
        "salvarLocalizacoes() está desativada. As localizações agora são salvas no Supabase.",
        localizacoes
    );

}

function obterContainerNaPosicao(posicao){

    const localizacoes =
        obterLocalizacoes();

    for(const container in localizacoes){

        if(localizacoes[container] === posicao){

            return container;

        }

    }

    return null;

}

function atualizarVisualLinha(){

    if(!APP.linhaSelecionada){
        return;
    }

    document
        .querySelectorAll("#mapaLinha .nivel")
        .forEach(botao=>{

            const pilha =
                botao.closest(".pilha").dataset.pilha;

            const nivel =
                botao.dataset.nivel;

            const posicao =
                `${APP.linhaSelecionada}-${pilha}-${nivel}`;

            const container =
                obterContainerNaPosicao(posicao);

            botao.dataset.posicao =
                posicao;

            if(container){

                botao.classList.add("ocupado");

                botao.innerHTML = `
                    <strong>${container}</strong>
                    <span>${posicao}</span>
                `;

            }else{

                botao.classList.remove("ocupado");

                botao.innerHTML = `
                    <strong>VAZIO</strong>
                    <span>${posicao}</span>
                `;

            }

        });

}

function abrirMovimentacao(botao){

    const pilha =
        Number(
            botao.closest(".pilha").dataset.pilha
        );

    const nivel =
        Number(botao.dataset.nivel);

    const destino =
        `${APP.linhaSelecionada}-${pilha}-${nivel}`;

    APP.pilhaSelecionada = pilha;
    APP.nivelSelecionado = nivel;
    APP.destinoSelecionado = destino;


    const containerOcupando =
        obterContainerNaPosicao(destino);


    if(containerOcupando){

        alert(
            `Posição ocupada por ${containerOcupando}.`
        );

        return;

    }


    document.getElementById(
        "destinoMovimentacao"
    ).textContent =
        `Destino: ${destino}`;


    const input =
        document.getElementById(
            "containerMovimentacao"
        );

    if(APP.containerSelecionado){

    input.value =
        APP.containerSelecionado;

}else{

    input.value = "";

}


    document.getElementById(
        "modalMovimentacao"
    ).style.display = "flex";


    input.focus();

}

function normalizarContainer(numero){

    return textoMaiusculo(numero)
        .replace(/\s/g, "")
        .replace(/-/g, "");

}

function validarFormatoContainer(numero){

    numero = normalizarContainer(numero);

    return /^[A-Z]{4}[0-9]{7}$/.test(numero);

}

function buscarContainerNoEstoque(numero){

    numero =
        normalizarContainer(numero);

    return APP.dadosEstoque.find(registro=>{

        return normalizarContainer(
            registro.container
        ) === numero;

    });

}

function validarEmpilhamento(){

    const nivel =
        APP.nivelSelecionado;

    if(nivel === 1){
        return true;
    }

    for(
        let nivelInferior = 1;
        nivelInferior < nivel;
        nivelInferior++
    ){

        const posicaoInferior =
            `${APP.linhaSelecionada}-${APP.pilhaSelecionada}-${nivelInferior}`;

        if(
            !obterContainerNaPosicao(
                posicaoInferior
            )
        ){

            return false;

        }

    }

    return true;

}

function validarRetiradaContainer(container){

    const localAtual =
        obterLocalizacao(container);

    if(!localAtual){
        return true;
    }


    const partes =
        localAtual.split("-");


    if(partes.length < 4){

        // Está em área especial, como MAPA/FUMIGAÇÃO/ESTUFAGEM
        return true;

    }


    const nivelAtual =
        Number(
            partes[partes.length - 1]
        );


    if(!nivelAtual){
        return true;
    }


    const basePosicao =
        partes.slice(
            0,
            partes.length - 1
        ).join("-");


    for(
        let nivelSuperior = nivelAtual + 1;
        nivelSuperior <= 4;
        nivelSuperior++
    ){

        const posicaoSuperior =
            `${basePosicao}-${nivelSuperior}`;

        const containerSuperior =
            obterContainerNaPosicao(
                posicaoSuperior
            );


        if(containerSuperior){

            alert(
                `Não é possível movimentar ${container}.\n\n` +
                `Existe o container ${containerSuperior} acima dele na posição ${posicaoSuperior}.`
            );

            return false;

        }

    }


    return true;

}

async function confirmarMovimentacao(){

    const input =
        document.getElementById(
            "containerMovimentacao"
        );

    const container =
        normalizarContainer(
            input.value
        );


    if(!validarFormatoContainer(container)){

        alert(
            "Formato inválido.\nUse: AAAA 000000-0"
        );

        return;

    }


    const registro =
        buscarContainerNoEstoque(container);


    if(!registro){

        alert(
            "Container não localizado no estoque."
        );

        return;

    }


    if(!validarEmpilhamento()){

        alert(
            "Não é possível utilizar este nível porque existem níveis vazios abaixo."
        );

        return;

    }


    if(!USUARIO_PORTAL){

        alert(
            "Usuário não identificado."
        );

        return;

    }


    const origem =
        obterLocalizacao(container);


    const destino =
        APP.destinoSelecionado;


    if(!destino){

        alert(
            "Destino não selecionado."
        );

        return;

    }


    try{

        const {
            error
        } =
            await supabaseClient
                .from(
                    "portal_localizacoes"
                )
                .upsert(
                    {
                        container:
                            container,

                        localizacao:
                            destino,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()
                    },
                    {
                        onConflict:
                            "container"
                    }
                );


        if(error){

            console.error(
                "Erro ao movimentar container:",
                error
            );

            alert(
                "Não foi possível salvar a movimentação."
            );

            return;

        }


        await carregarLocalizacoesSupabase();


        await registrarLog({

            area:
                "MAPA",

            acao:
                "MOVIMENTOU CONTAINER",

            container:
                container,

            detalhes:
                "De: " +
                (origem || "SEM LOCALIZAÇÃO") +
                " | Para: " +
                destino

        });


        APP.containerSelecionado =
            null;


        fecharMovimentacao();

        atualizarVisualLinha();


        console.log(
            "Container movimentado:",
            container,
            origem,
            "→",
            destino
        );

    }
    catch(erro){

        console.error(
            "Erro inesperado na movimentação:",
            erro
        );

        alert(
            "Erro inesperado ao movimentar container."
        );

    }

}

function fecharMovimentacao(){

    document.getElementById(
        "modalMovimentacao"
    ).style.display = "none";

    APP.destinoSelecionado = null;
    APP.pilhaSelecionada = null;
    APP.nivelSelecionado = null;

}

function atualizarContainerSelecionadoMapa(){

    const painel =
        document.getElementById(
            "containerSelecionadoMapa"
        );

    if(!painel){
        return;
    }


    if(!APP.containerSelecionado){

        painel.style.display = "none";

        return;

    }


    painel.style.display = "flex";


    const numeroContainer =
        document.getElementById(
            "numeroContainerSelecionado"
        );

    if(numeroContainer){

        numeroContainer.textContent =
            APP.containerSelecionado;

    }


    const localAtual =
        obterLocalizacao(
            APP.containerSelecionado
        );


    const localAtualElemento =
        document.getElementById(
            "localAtualContainerSelecionado"
        );

    if(localAtualElemento){

        localAtualElemento.textContent =
            `Local atual: ${localAtual || "SEM LOCALIZAÇÃO"}`;

    }

}


/* ==========================================================
   SOLICITAÇÕES
========================================================== */

let SOLICITACOES_PORTAL = [];


async function carregarSolicitacoesSupabase(){

    try{

        const {
            data,
            error
        } =
            await supabaseClient
                .from("portal_solicitacoes")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if(error){

            console.error(
                "Erro ao carregar solicitações do Supabase:",
                error
            );

            return false;

        }


        SOLICITACOES_PORTAL =
            (data || []).map(item=>{

                return {

                    id:
                        item.id,

                    container:
                        normalizarContainer(
                            item.container
                        ),

                    origem:
                        item.origem || "",

                    destino:
                        item.destino || "",

                    status:
                        item.status || "",

                    criadoEm:
                        item.criado_em || "",

                    posicionadoEm:
                        item.posicionado_em || "",

                    concluidoEm:
                        item.concluido_em || ""

                };

            });


        console.log(
            "Solicitações carregadas do Supabase:",
            SOLICITACOES_PORTAL
        );

        return true;

    }
    catch(erro){

        console.error(
            "Erro inesperado ao carregar solicitações:",
            erro
        );

        return false;

    }

}

function obterSolicitacoes(){

    return SOLICITACOES_PORTAL;

}


function salvarSolicitacoes(lista){

    localStorage.setItem(
        "solicitacoesPosicionamento",
        JSON.stringify(lista)
    );

}

function atualizarDashboardSolicitacoes(){

    const vazios = APP.dadosEstoque.filter(registro=>{

        return textoMaiusculo(registro.estado) === "V";

    }).length;


    const pendentes = obterSolicitacoes().filter(item=>{

        return item.status === "PENDENTE";

    }).length;


    document.getElementById(
        "totalContainersVazios"
    ).textContent = vazios;


    document.getElementById(
        "totalSolicitacoesPendentes"
    ).textContent = pendentes;

}

function fecharFormulariosSolicitacao(){

    document.getElementById(
        "solicitacaoEstufagem"
    ).style.display = "none";

    document.getElementById(
        "solicitacaoMapa"
    ).style.display = "none";

    document.getElementById(
        "solicitacaoFumigacao"
    ).style.display = "none";

}


function abrirSolicitacaoEstufagem(){

    fecharFormulariosSolicitacao();

    document.getElementById(
        "solicitacaoEstufagem"
    ).style.display = "block";

}


function abrirSolicitacaoMapa(){

    fecharFormulariosSolicitacao();

    document.getElementById(
        "solicitacaoMapa"
    ).style.display = "block";

}


function abrirSolicitacaoFumigacao(){

    fecharFormulariosSolicitacao();

    document.getElementById(
        "solicitacaoFumigacao"
    ).style.display = "block";

}

function lerListaContainers(idTextarea){

    const textoLista =
        document.getElementById(idTextarea).value;

    return textoLista
        .split("\n")
        .map(numero=>normalizarContainer(numero))
        .filter(numero=>numero);

}

function containerJaSolicitado(container){

    return obterSolicitacoes().some(item=>{

        return (
            item.container === container &&
            (
                item.status === "PENDENTE" ||
                item.status === "EM ANDAMENTO"
            )
        );

    });

}

function criarSolicitacoes(
    containers,
    destino,
    tipo
){

    const solicitacoes =
        obterSolicitacoes();

    const erros = [];

    let adicionados = 0;


    containers.forEach(container=>{

        const registro =
            buscarContainerNoEstoque(container);


        // CONTAINER NÃO EXISTE

        if(!registro){

            erros.push(
                `${container}: não localizado no estoque`
            );

            return;

        }


        // SEM LOCALIZAÇÃO

        const localAtual =
            obterLocalizacao(container);

        if(!localAtual){

            erros.push(
                `${container}: container sem localização`
            );

            return;

        }


        const estado =
            textoMaiusculo(registro.estado);


        // ESTUFAGEM = SOMENTE VAZIO

        if(
            tipo === "ESTUFAGEM" &&
            estado !== "V"
        ){

            erros.push(
                `${container}: somente containers V podem ser solicitados para estufagem`
            );

            return;

        }


        // MAPA/FUMIGAÇÃO NÃO ACEITAM VAZIO

        if(
            (tipo === "MAPA" ||
             tipo === "FUMIGACAO") &&
            estado === "V"
        ){

            erros.push(
                `${container}: container V não pode ser solicitado para ${destino}`
            );

            return;

        }


        // JÁ SOLICITADO

        if(containerJaSolicitado(container)){

            erros.push(
                `${container}: já possui solicitação pendente`
            );

            return;

        }


        solicitacoes.push({

            container: container,

            origem: localAtual,

            destino: destino,

            tipo: tipo,

            status: "PENDENTE",

            data: new Date()
                .toLocaleString("pt-BR")

        });


        adicionados++;

    });


    salvarSolicitacoes(
        solicitacoes
    );


renderSolicitacoesPendentes();

renderSolicitacoesEmAndamento();

renderSolicitacoesConcluidas();

atualizarDashboardSolicitacoes();

atualizarAreasSolicitadasMapa();


    if(adicionados > 0){

        alert(
            `${adicionados} solicitação(ões) criada(s) com sucesso.`
        );

    }


    if(erros.length > 0){

        alert(

            "Alguns containers não foram solicitados:\n\n" +

            erros.join("\n")

        );

    }

}

function confirmarSolicitacaoEstufagem(){

    const destino =
        APP.destinoEstufagemSelecionado;


    if(!destino){

        alert(
            "Selecione uma área de estufagem."
        );

        return;

    }


    const containers =
        lerListaContainers(
            "containersEstufagem"
        );


    if(containers.length === 0){

        alert(
            "Informe pelo menos um container."
        );

        return;

    }


    criarSolicitacoes(
        containers,
        destino,
        "ESTUFAGEM"
    );


    document.getElementById(
        "containersEstufagem"
    ).value = "";

}

function confirmarSolicitacaoMapa(){

    const containers =
        lerListaContainers(
            "containersMapa"
        );


    if(containers.length === 0){

        alert(
            "Informe pelo menos um container."
        );

        return;

    }


    criarSolicitacoes(
        containers,
        "MAPA",
        "MAPA"
    );


    document.getElementById(
        "containersMapa"
    ).value = "";

}

function confirmarSolicitacaoFumigacao(){

    const containers =
        lerListaContainers(
            "containersFumigacao"
        );


    if(containers.length === 0){

        alert(
            "Informe pelo menos um container."
        );

        return;

    }


    criarSolicitacoes(
        containers,
        "FUMIGAÇÃO",
        "FUMIGACAO"
    );


    document.getElementById(
        "containersFumigacao"
    ).value = "";

}

function renderSolicitacoesPendentes(){

    const tbody =
        document.getElementById(
            "tbodySolicitacoes"
        );

    const pendentes =
        obterSolicitacoes().filter(item=>{

            return item.status === "PENDENTE";

        });

    tbody.innerHTML = "";

    if(pendentes.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="loading">

                    Nenhuma solicitação pendente.

                </td>

            </tr>

        `;

        return;

    }

    pendentes.forEach(item=>{

        tbody.innerHTML += `

            <tr>

                <td>
                    ${item.container}
                </td>

                <td>
                    ${item.origem}
                </td>

                <td>
                    ${item.destino}
                </td>

                <td>
                    ${item.status}
                </td>

            </tr>

        `;

    });

}


/* ==========================================================
   SOLICITAÇÕES EM ANDAMENTO
========================================================== */

function atualizarNotificacaoSolicitacoes(){

    const notificacao =
        document.getElementById(
            "notificacaoSolicitacoes"
        );

    if(!notificacao){
        return;
    }

    const quantidade =
        obterSolicitacoes().filter(item=>{

            return (
                item.status === "EM ANDAMENTO"
            );

        }).length;

    if(quantidade > 0){

        notificacao.textContent =
            quantidade;

        notificacao.style.display =
            "flex";

    }else{

        notificacao.textContent =
            "";

        notificacao.style.display =
            "none";

    }

}

function obterSolicitacoesEmAndamento(){

    return obterSolicitacoes().filter(item=>{

        return item.status === "EM ANDAMENTO";

    });

}


function renderSolicitacoesEmAndamento(){

    const tbody =
        document.getElementById(
            "tbodySolicitacoesAndamento"
        );

    if(!tbody){

        return;

    }

    const andamento =
        obterSolicitacoesEmAndamento();

    tbody.innerHTML = "";

    if(andamento.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading">

                    Nenhuma solicitação em andamento.

                </td>

            </tr>

        `;

        return;

    }

    andamento.forEach(item=>{

        tbody.innerHTML += `

            <tr>

                <td>

                    <input
                        type="checkbox"
                        class="check-solicitacao-andamento"
                        value="${item.container}">

                </td>

                <td>
                    ${item.container}
                </td>

                <td>
                    ${item.destino}
                </td>

                <td>
                    ${item.posicionadoEm || ""}
                </td>

                <td>
                    ${item.status}
                </td>

            </tr>

        `;

    });

}

function obterSolicitacoesConcluidas(){

    return obterSolicitacoes().filter(item=>{

        return item.status === "CONCLUÍDO";

    });

}


function renderSolicitacoesConcluidas(){

    const tbody =
        document.getElementById(
            "tbodySolicitacoesConcluidas"
        );


    if(!tbody){

        return;

    }


    const concluidas =
        obterSolicitacoesConcluidas();


    tbody.innerHTML = "";


    if(concluidas.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="loading">

                    Nenhuma solicitação concluída.

                </td>

            </tr>

        `;

        return;

    }


    concluidas
        .slice()
        .reverse()
        .forEach(item=>{

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${item.container}
                    </td>

                    <td>
                        ${item.origem || ""}
                    </td>

                    <td>
                        ${item.destino}
                    </td>

                    <td>
                        ${item.posicionadoEm || ""}
                    </td>

                    <td>
                        ${item.concluidoEm || ""}
                    </td>

                </tr>

            `;

        });

}

function concluirSolicitacoesSelecionadas(){

    const selecionados = [

        ...document.querySelectorAll(
            ".check-solicitacao-andamento:checked"
        )

    ].map(input=>input.value);

    if(selecionados.length === 0){

        alert(
            "Selecione pelo menos uma solicitação."
        );

        return;

    }

    const solicitacoes =
        obterSolicitacoes();

    solicitacoes.forEach(item=>{

        if(
            selecionados.includes(item.container) &&
            item.status === "EM ANDAMENTO"
        ){

            item.status =
                "CONCLUÍDO";

            item.concluidoEm =
                new Date()
                    .toLocaleString("pt-BR");

        }

    });

    salvarSolicitacoes(
        solicitacoes
    );

renderSolicitacoesPendentes();

renderSolicitacoesEmAndamento();

renderSolicitacoesConcluidas();

atualizarDashboardSolicitacoes();

atualizarAreasSolicitadasMapa();

atualizarNotificacaoSolicitacoes();

    alert(
        `${selecionados.length} solicitação(ões) concluída(s).`
    );

}

function atualizarAreasSolicitadasMapa(){

    const solicitacoes =
        obterSolicitacoes();

    document
        .querySelectorAll(".area-especial")
        .forEach(area=>{

            area.classList.remove(
                "solicitacao-pendente",
                "solicitacao-concluida",
                "solicitacao-mista"
            );

            const local =
                textoMaiusculo(
                    area.dataset.local
                );


            const pendentes =
                solicitacoes.filter(item=>{

                    return (
                        item.status === "PENDENTE" &&
                        textoMaiusculo(item.destino) === local
                    );

                }).length;


            const concluidasAtuais =
                solicitacoes.filter(item=>{

                    if(
                        item.status !== "CONCLUÍDO" ||
                        textoMaiusculo(item.destino) !== local
                    ){

                        return false;

                    }

                    const localAtual =
                        obterLocalizacao(
                            item.container
                        );

                    return (
                        textoMaiusculo(localAtual) === local
                    );

                }).length;


            if(
                pendentes > 0 &&
                concluidasAtuais > 0
            ){

                area.classList.add(
                    "solicitacao-mista"
                );

                return;

            }


            if(pendentes > 0){

                area.classList.add(
                    "solicitacao-pendente"
                );

                return;

            }


            if(concluidasAtuais > 0){

                area.classList.add(
                    "solicitacao-concluida"
                );

            }

        });

}

function obterContainersDaArea(local){

    const localizacoes =
        obterLocalizacoes();

    const localNormalizado =
        textoMaiusculo(local);

    return Object.keys(localizacoes)

        .filter(container=>{

            return textoMaiusculo(
                localizacoes[container]
            ) === localNormalizado;

        })

        .sort();

}


function abrirSolicitacoesArea(destino){

    const pendentes =
        obterSolicitacoes().filter(item=>{

            return (
                item.status === "PENDENTE" &&
                textoMaiusculo(item.destino) ===
                textoMaiusculo(destino)
            );

        });


    const posicionados =
        obterContainersDaArea(destino);


    if(
        pendentes.length === 0 &&
        posicionados.length === 0
    ){

        return;

    }


    let modal =
        document.getElementById(
            "modalSolicitacoesArea"
        );


    if(!modal){

        modal =
            document.createElement("div");

        modal.id =
            "modalSolicitacoesArea";

        modal.className =
            "modal-movimentacao";

        document.body.appendChild(modal);

    }


    /* =========================================
       CONTAINERS JÁ POSICIONADOS
    ========================================= */

    let posicionadosHTML = "";


    if(posicionados.length > 0){

        posicionadosHTML = `

            <div class="area-containers-posicionados">

                <h4>
                    POSICIONADOS
                </h4>

                <div class="lista-containers-area">

                    ${posicionados.map(container=>`

                        <div class="container-area-posicionado">

                            <strong>
                                ${container}
                            </strong>

                            <span>
                                ${destino}
                            </span>

                        </div>

                    `).join("")}

                </div>

            </div>

        `;

    }


    /* =========================================
       SOLICITAÇÕES PENDENTES
    ========================================= */

let pendentesHTML = "";

if(pendentes.length > 0){

    pendentesHTML = `

        <div class="area-containers-pendentes">

            <h4>
                AGUARDANDO POSICIONAMENTO
            </h4>

            <div class="lista-check-solicitacoes">

                ${pendentes.map(item=>{

                    const localAtual =
                        obterLocalizacao(item.container) ||
                        item.origem ||
                        "SEM LOCALIZAÇÃO";

                    return `

                        <label class="solicitacao-checkbox">

                            <input
                                type="checkbox"
                                value="${item.container}">

                            <div class="solicitacao-info">

                                <strong>
                                    ${item.container}
                                </strong>

                                <span>
                                    Local atual: ${localAtual}
                                </span>

                            </div>

                        </label>

                    `;

                }).join("")}

            </div>

        </div>

    `;

}

   function atualizarNotificacaoSolicitacoes(){

    const andamento =
        obterSolicitacoes().filter(item=>{

            return item.status === "EM ANDAMENTO";

        }).length;


    const notificacao =
        document.getElementById(
            "notificacaoSolicitacoes"
        );


    if(!notificacao){
        return;
    }


    if(andamento > 0){

        notificacao.textContent =
            andamento;

        notificacao.style.display =
            "flex";

    }else{

        notificacao.style.display =
            "none";

    }

}

    /* =========================================
       BOTÃO CONFIRMAR
    ========================================= */

    let botaoConfirmar = "";

    if(pendentes.length > 0){

        botaoConfirmar = `

            <button
                onclick="concluirSolicitacoesArea('${destino}')">

                Confirmar movimentação

            </button>

        `;

    }


    /* =========================================
       MODAL
    ========================================= */

    modal.innerHTML = `

        <div class="modal-movimentacao-conteudo">

            <h3>
                ${destino}
            </h3>

            <p>
                Containers da área
            </p>

            ${posicionadosHTML}

            ${pendentesHTML}

            <div class="modal-acoes">

                <button
                    onclick="fecharSolicitacoesArea()">

                    Fechar

                </button>

                ${botaoConfirmar}

            </div>

        </div>

    `;


    modal.style.display = "flex";

}


function fecharSolicitacoesArea(){

    const modal =
        document.getElementById(
            "modalSolicitacoesArea"
        );

    if(modal){

        modal.style.display = "none";

    }

}


function concluirSolicitacoesArea(destino){

    const modal =
        document.getElementById(
            "modalSolicitacoesArea"
        );


    const selecionados =
        [...modal.querySelectorAll(
            'input[type="checkbox"]:checked'
        )]
        .map(input=>input.value);


    if(selecionados.length === 0){

        alert(
            "Selecione pelo menos um container."
        );

        return;

    }


    const solicitacoes =
        obterSolicitacoes();

    const localizacoes =
        obterLocalizacoes();


    selecionados.forEach(container=>{

        localizacoes[container] =
            destino;


        const solicitacao =
            solicitacoes.find(item=>{

                return (
                    item.container === container &&
                    item.status === "PENDENTE" &&
                    textoMaiusculo(item.destino) ===
                    textoMaiusculo(destino)
                );

            });


         if(solicitacao){

             solicitacao.status =
              "EM ANDAMENTO";

             solicitacao.posicionadoEm =
                 new Date()
                  .toLocaleString("pt-BR");

         }
    });


    salvarLocalizacoes(
        localizacoes
    );

    salvarSolicitacoes(
        solicitacoes
    );


    fecharSolicitacoesArea();

    atualizarAreasSolicitadasMapa();

    atualizarDashboardSolicitacoes();

    renderSolicitacoesPendentes();

    renderSolicitacoesEmAndamento();
   
   atualizarNotificacaoSolicitacoes();


    if(APP.carregadoEstoque){

        APP.dadosEstoque.forEach(registro=>{

            registro.localizacao =
                obterLocalizacao(
                    registro.container
                );

        });

    }


    alert(
        `${selecionados.length} container(s) movimentado(s) para ${destino}.`
    );

}

/* ==========================================================
   CONTROLE OPERACIONAL DA PROGRAMAÇÃO
========================================================== */

let CONTROLE_PROGRAMACAO = {};

async function carregarControleProgramacaoSupabase(){

    try{

        const {
            data,
            error
        } =
            await supabaseClient
                .from("portal_programacao")
                .select("*");

        if(error){

            console.error(
                "Erro ao carregar Programação do Supabase:",
                error
            );

            return false;

        }


        CONTROLE_PROGRAMACAO = {};


        for(const registro of data){

const chave = [
    normalizarContainer(registro.container),
    String(registro.data || "").trim(),
    String(registro.janela || "").trim()
].join("|");


            CONTROLE_PROGRAMACAO[chave] = {

                id:
                    registro.id,

                concluido:
                  registro.concluido === true ||
                  registro.concluido === "true" ||
                  registro.concluido === 1,

                observacao:
                    registro.observacao || ""

            };

        }


        console.log(
            "Controle da Programação carregado:",
            CONTROLE_PROGRAMACAO
        );

        return true;

    }
    catch(erro){

        console.error(
            "Erro inesperado ao carregar Programação:",
            erro
        );

        return false;

    }

}

function obterControleProgramacao(){

    return CONTROLE_PROGRAMACAO;

}


function salvarControleProgramacao(controle){

    console.warn(
        "salvarControleProgramacao ignorado: Programação agora utiliza Supabase."
    );

}


function chaveRegistroProgramacao(registro){

    return [
        normalizarContainer(registro.container),
        String(registro.dataTexto || "").trim(),
        String(registro.janela || "").trim()
    ].join("|");

}


function obterEstadoProgramacao(registro){

    const controle =
        obterControleProgramacao();

    const chave =
        chaveRegistroProgramacao(registro);

    const estado =
        controle[chave];

    return estado || {
        concluido:false,
        observacao:""
    };

}

async function alterarConcluidoProgramacao(
    container,
    data,
    janela,
    marcado
){

    if(!USUARIO_PORTAL){

        console.error(
            "Usuário não identificado."
        );

        return;

    }


    const containerNormalizado =
        normalizarContainer(container);


    try{

        const {
            data: registros,
            error: erroBusca
        } =
            await supabaseClient
                .from("portal_programacao")
                .select("id")
                .eq("container", containerNormalizado)
                .eq("data", data)
                .eq("janela", janela)
                .order("id", { ascending: false })
                .limit(1);


        if(erroBusca){

            console.error(
                "Erro ao localizar Programação:",
                erroBusca
            );

            return;

        }


        if(registros.length > 0){

            const {
                error
            } =
                await supabaseClient
                    .from("portal_programacao")
                    .update({

                        concluido:
                            marcado,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        registros[0].id
                    );


            if(error){

                console.error(
                    "Erro ao atualizar Programação:",
                    error
                );

                return;

            }

        }
        else{

            const {
                error
            } =
                await supabaseClient
                    .from("portal_programacao")
                    .insert({

                        container:
                            containerNormalizado,

                        data:
                            data,

                        janela:
                            janela,

                        concluido:
                            marcado,

                        observacao:
                            null,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()

                    });


            if(error){

                console.error(
                    "Erro ao criar Programação:",
                    error
                );

                return;

            }

        }


        await carregarControleProgramacaoSupabase();


        await registrarLog({

            area:
                "PROGRAMAÇÃO",

            acao:
                marcado
                    ? "MARCOU CONCLUÍDO"
                    : "REMOVEU CONCLUÍDO",

            container:
                containerNormalizado,

            detalhes:
                `Data: ${data} | Janela: ${janela}`

        });


        renderTabelaProgramacao(
            APP.listaProgramacaoAtual
        );

    }
    catch(erro){

        console.error(
            "Erro inesperado ao alterar Programação:",
            erro
        );

    }

}


async function alterarConcluidoProgramacao(
    container,
    data,
    janela,
    marcado
){

    if(!USUARIO_PORTAL){

        console.error(
            "Usuário não identificado."
        );

        return;

    }


    const containerNormalizado =
        normalizarContainer(container);


    try{

        /* =========================================
           VERIFICA SE JÁ EXISTE
        ========================================= */

        const {
            data: registros,
            error: erroBusca
        } =
            await supabaseClient
                .from("portal_programacao")
                .select("id, observacao")
                .eq(
                    "container",
                    containerNormalizado
                )
                .eq(
                    "data",
                    data
                )
                .eq(
                    "janela",
                    janela
                )
                .order(
                    "id",
                    {
                        ascending: false
                    }
                )
                .limit(1);


        if(erroBusca){

            console.error(
                "Erro ao localizar Programação:",
                erroBusca
            );

            return;

        }


        /* =========================================
           SE EXISTE → UPDATE
        ========================================= */

        if(registros.length > 0){

            const {
                error
            } =
                await supabaseClient
                    .from("portal_programacao")
                    .update({

                        concluido:
                            marcado,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        registros[0].id
                    );


            if(error){

                console.error(
                    "Erro ao atualizar Programação:",
                    error
                );

                return;

            }

        }

        /* =========================================
           SE NÃO EXISTE → INSERT
        ========================================= */

        else{

            const {
                error
            } =
                await supabaseClient
                    .from("portal_programacao")
                    .insert({

                        container:
                            containerNormalizado,

                        data:
                            data,

                        janela:
                            janela,

                        concluido:
                            marcado,

                        observacao:
                            null,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()

                    });


            if(error){

                console.error(
                    "Erro ao criar Programação:",
                    error
                );

                return;

            }

        }


        /* =========================================
           ATUALIZA ESTE COMPUTADOR
        ========================================= */

        await carregarControleProgramacaoSupabase();


        /* =========================================
           REGISTRA NO LOG
        ========================================= */

        await registrarLog({

            area:
                "PROGRAMAÇÃO",

            acao:
                marcado
                    ? "MARCOU CONCLUÍDO"
                    : "REMOVEU CONCLUÍDO",

            container:
                containerNormalizado,

            detalhes:
                `Data: ${data} | Janela: ${janela}`

        });


        renderTabelaProgramacao(
            APP.listaProgramacaoAtual
        );

    }
    catch(erro){

        console.error(
            "Erro inesperado ao alterar Programação:",
            erro
        );

    }

}

async function alterarObservacaoProgramacao(
    container,
    data,
    janela,
    observacao
){

    if(!USUARIO_PORTAL){

        console.error(
            "Usuário não identificado."
        );

        return;

    }


    const containerNormalizado =
        normalizarContainer(container);

    const novaObservacao =
        String(observacao || "").trim();


    try{

        /* =========================================
           VERIFICA SE JÁ EXISTE
        ========================================= */

        const {
            data: registros,
            error: erroBusca
        } =
            await supabaseClient
                .from("portal_programacao")
                .select("id, concluido")
                .eq(
                    "container",
                    containerNormalizado
                )
                .eq(
                    "data",
                    data
                )
                .eq(
                    "janela",
                    janela
                )
                .order(
                    "id",
                    {
                        ascending: false
                    }
                )
                .limit(1);


        if(erroBusca){

            console.error(
                "Erro ao localizar Programação:",
                erroBusca
            );

            return;

        }


        /* =========================================
           SE EXISTE → UPDATE
        ========================================= */

        if(registros.length > 0){

            const {
                error
            } =
                await supabaseClient
                    .from("portal_programacao")
                    .update({

                        observacao:
                            novaObservacao || null,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        registros[0].id
                    );


            if(error){

                console.error(
                    "Erro ao atualizar observação:",
                    error
                );

                return;

            }

        }

        /* =========================================
           SE NÃO EXISTE → INSERT
        ========================================= */

        else{

            const {
                error
            } =
                await supabaseClient
                    .from("portal_programacao")
                    .insert({

                        container:
                            containerNormalizado,

                        data:
                            data,

                        janela:
                            janela,

                        concluido:
                            false,

                        observacao:
                            novaObservacao || null,

                        atualizado_por:
                            USUARIO_PORTAL.id,

                        atualizado_em:
                            new Date().toISOString()

                    });


            if(error){

                console.error(
                    "Erro ao criar observação:",
                    error
                );

                return;

            }

        }


        /* =========================================
           ATUALIZA ESTE COMPUTADOR
        ========================================= */

        await carregarControleProgramacaoSupabase();


        /* =========================================
           REGISTRA NO LOG
        ========================================= */

        await registrarLog({

            area:
                "PROGRAMAÇÃO",

            acao:
                "ALTEROU OBSERVAÇÃO",

            container:
                containerNormalizado,

            detalhes:
                `Data: ${data} | Janela: ${janela} | Observação: ${novaObservacao || "REMOVIDA"}`

        });


        renderTabelaProgramacao(
            APP.listaProgramacaoAtual
        );

    }
    catch(erro){

        console.error(
            "Erro inesperado ao alterar observação:",
            erro
        );

    }

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
            nome:"LOCALIZAÇÃO",
            campo:"localizacao"
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

    document.getElementById(
        "totalProgramacao"
    ).textContent = lista.length;


    const totalPaginas = Math.max(
        1,
        Math.ceil(
            lista.length /
            APP.limiteProgramacao
        )
    );


    if(
        APP.paginaProgramacao >
        totalPaginas
    ){

        APP.paginaProgramacao =
            totalPaginas;

    }


    document.getElementById(
        "paginaProgramacao"
    ).textContent =
        APP.paginaProgramacao;


    const inicio =
        (APP.paginaProgramacao - 1) *
        APP.limiteProgramacao;


    const pagina =
        lista.slice(
            inicio,
            inicio + APP.limiteProgramacao
        );


    DOM.theadProg.innerHTML = `

        <th>CONCLUÍDO</th>
        <th>TIPO</th>
        <th>CLIENTE</th>
        <th>CONTAINER</th>
        <th>DATA AG.</th>
        <th>JANELA</th>
        <th>BOOKING</th>
        <th>LOCALIZAÇÃO</th>
        <th>OBSERVAÇÕES</th>

    `;


    DOM.tbodyProg.innerHTML = "";


    if(pagina.length === 0){

        DOM.tbodyProg.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="loading">

                    Nenhum resultado encontrado.

                </td>

            </tr>

        `;

        return;

    }


    pagina.forEach(registro=>{

        const estado =
            obterEstadoProgramacao(
                registro
            );

        const classeLinha =
            estado.concluido
                ? "programacao-concluida"
                : "";


        DOM.tbodyProg.innerHTML += `

            <tr class="${classeLinha}">

                <td class="coluna-concluido">

                    <input
                        type="checkbox"
                        class="check-programacao"
                        ${estado.concluido ? "checked" : ""}

                        onchange="
                            alterarConcluidoProgramacao(
                                '${registro.container}',
                                '${registro.dataTexto}',
                                '${registro.janela}',
                                this.checked
                            )
                        "
                    >

                </td>


                <td>
                    ${registro.tipo}
                </td>


                <td>
                    ${registro.cliente}
                </td>


                <td>
                    ${registro.container}
                </td>


                <td>
                    ${registro.dataTexto}
                </td>


                <td>
                    ${registro.janela}
                </td>


                <td>
                    ${registro.booking}
                </td>


                <td>
                    ${
                        obterLocalizacao(
                            registro.container
                        ) ||
                        "AGUARDANDO MAPEAMENTO"
                    }
                </td>


                <td>

                    <input
                        type="text"
                        class="observacao-programacao"

                        value="${
                            estado.observacao
                                .replace(/"/g, "&quot;")
                        }"

                        placeholder="Adicionar observação..."

                        onchange="
                            alterarObservacaoProgramacao(
                                '${registro.container}',
                                '${registro.dataTexto}',
                                '${registro.janela}',
                                this.value
                            )
                        "
                    >

                </td>

            </tr>

        `;

    });

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

function filtrarProgramacaoPorJanela(){

    const seletor =
        document.getElementById(
            "janelaProgramacao"
        );

    const janela =
        seletor.value;

    let lista = [
        ...APP.listaProgramacaoBase
    ];

    if(janela){

        lista =
            lista.filter(registro=>{

                return (
                    registro.janela ===
                    janela
                );

            });

    }

    APP.listaProgramacaoAtual =
        lista;

    APP.paginaProgramacao = 1;

    renderTabelaProgramacao(
        lista
    );

}


/* ==========================================================
   BUSCAR PROGRAMAÇÃO
========================================================== */

async function buscarProgramacao(){

   await carregarControleProgramacaoSupabase();

    if(!verificarCarregamento()){

        return;

    }

    const tipo =
        document.getElementById("tipoProgramacao").value;

    const inicio =
        document.getElementById("progInicio").value;

    const fim =
        document.getElementById("progFim").value;

    if(!inicio || !fim){

        alert("Selecione o período.");

        return;

    }

    const dataInicio = parseInputDate(inicio);
    const dataFim = parseInputDate(fim);

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

    /* =========================
       LOCALIZAÇÃO ATUAL
    ========================= */

    lista.forEach(registro=>{

        registro.localizacao =
            obterLocalizacao(
                registro.container
            ) || "AGUARDANDO MAPEAMENTO";

    });


    lista.sort((a,b)=>
        a.dataAg - b.dataAg
    );


APP.listaProgramacaoBase =
    lista;


/* =========================================
   GERA AS JANELAS DO PERÍODO
========================================= */

const selectJanela =
    document.getElementById(
        "janelaProgramacao"
    );


const janelaSelecionadaAnterior =
    selectJanela.value;


const janelas = [
    ...new Set(
        lista
            .map(registro=>
                registro.janela
            )
            .filter(janela=>
                janela
            )
    )
];


janelas.sort();


selectJanela.innerHTML = `

    <option value="">
        TODAS AS JANELAS
    </option>

`;


janelas.forEach(janela=>{

    selectJanela.innerHTML += `

        <option value="${janela}">
            ${janela}
        </option>

    `;

});


if(
    janelas.includes(
        janelaSelecionadaAnterior
    )
){

    selectJanela.value =
        janelaSelecionadaAnterior;

}


filtrarProgramacaoPorJanela();

}
   
/* ==========================================================
   LOCALIZAÇÃO
========================================================== */

let LOCALIZACOES_CONTAINERS = {};


async function carregarLocalizacoesSupabase(){

    try{

        const {
            data,
            error
        } =
            await supabaseClient
                .from("portal_localizacoes")
                .select(
                    "id, container, localizacao, atualizado_por, atualizado_em"
                );

        if(error){

            console.error(
                "Erro ao carregar localizações do Supabase:",
                error
            );

            return false;

        }


        LOCALIZACOES_CONTAINERS = {};


        for(const registro of data){

            const container =
                normalizarContainer(
                    registro.container
                );

            if(!container){
                continue;
            }

            LOCALIZACOES_CONTAINERS[
                container
            ] =
                String(
                    registro.localizacao || ""
                ).trim();

        }


        console.log(
            "Localizações carregadas do Supabase:",
            LOCALIZACOES_CONTAINERS
        );

        return true;

    }
    catch(erro){

        console.error(
            "Erro inesperado ao carregar localizações:",
            erro
        );

        return false;

    }

}

function obterLocalizacao(container){

    const numero =
        normalizarContainer(container);

    return (
        LOCALIZACOES_CONTAINERS[
            numero
        ] || ""
    );

}

function movimentarContainer(container){

    const registro =
        buscarContainerNoEstoque(container);

    if(!registro){

        alert(
            "Container não localizado no estoque."
        );

        return;

    }

   if(!validarRetiradaContainer(container)){

    return;

}

    APP.containerSelecionado =
        normalizarContainer(container);

    mostrarMapa();

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

    carregarLocalizacoesSupabase();

    carregarSolicitacoesSupabase();
   
     mostrarInicio();

     atualizarNotificacaoSolicitacoes();

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

        document
            .querySelectorAll(".praca")
            .forEach(praca=>{

                praca.addEventListener(
                    "click",
                    ()=>{

                        abrirPraca(
                            praca.dataset.local
                        );

                    }
                );

            });

        DOM.voltarMapaGeral
            .addEventListener(
                "click",
                mostrarMapaGeral
            );

    }

);

document
    .querySelectorAll("#mapaLinha .nivel")
    .forEach(botao=>{

        botao.addEventListener(
            "click",
            ()=>abrirMovimentacao(botao)
        );

    });

document
    .getElementById("confirmarMovimentacao")
    .addEventListener(
        "click",
        confirmarMovimentacao
    );


document
    .getElementById("cancelarMovimentacao")
    .addEventListener(
        "click",
        fecharMovimentacao
    );

document
    .querySelectorAll(".local-solicitacao")
    .forEach(botao=>{

        botao.addEventListener(
            "click",
            ()=>{

                document
                    .querySelectorAll(".local-solicitacao")
                    .forEach(item=>{

                        item.classList.remove("selecionado");

                    });

                botao.classList.add("selecionado");

                APP.destinoEstufagemSelecionado =
                    botao.dataset.local;

            }
        );

    });

document
    .querySelectorAll(".area-especial")
    .forEach(area=>{

        area.addEventListener(
            "click",
            ()=>{

                abrirSolicitacoesArea(
                    area.dataset.local
                );

            }
        );

    });

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

window.programacaoAnterior = programacaoAnterior;
window.programacaoProximo = programacaoProximo;
window.alterarLimiteProgramacao = alterarLimiteProgramacao;

window.mostrarEstoque = mostrarEstoque;
window.buscarEstoque = buscarEstoque;

window.estoqueAnterior = estoqueAnterior;
window.estoqueProximo = estoqueProximo;
window.alterarLimiteEstoque = alterarLimiteEstoque;

window.abrirDEV = abrirDEV;
window.salvarTSV = salvarTSV;
window.restaurarTSV = restaurarTSV;
window.resetarLocalizacoes = resetarLocalizacoes;

window.mostrarMapa = mostrarMapa;
window.movimentarContainer = movimentarContainer;

window.atualizarPlanilha = atualizarPlanilha;

window.mostrarSolicitacoes = mostrarSolicitacoes;

window.abrirSolicitacaoEstufagem = abrirSolicitacaoEstufagem;

window.abrirSolicitacaoMapa = abrirSolicitacaoMapa;

window.abrirSolicitacaoFumigacao = abrirSolicitacaoFumigacao;

window.confirmarSolicitacaoEstufagem = confirmarSolicitacaoEstufagem;

window.confirmarSolicitacaoMapa = confirmarSolicitacaoMapa;

window.confirmarSolicitacaoFumigacao = confirmarSolicitacaoFumigacao;

window.fecharSolicitacoesArea = fecharSolicitacoesArea;

window.concluirSolicitacoesArea = concluirSolicitacoesArea;

window.concluirSolicitacoesSelecionadas = concluirSolicitacoesSelecionadas;

window.filtrarProgramacaoPorJanela = filtrarProgramacaoPorJanela;

window.alterarConcluidoProgramacao = alterarConcluidoProgramacao;

window.alterarObservacaoProgramacao = alterarObservacaoProgramacao;

window.testarSupabase = testarSupabase;

window.atualizarTSVGlobal = atualizarTSVGlobal;

window.registrarLog = registrarLog;

iniciarRealtimeSupabase();

/* ==========================================================
   FIM DO ARQUIVO
========================================================== */
