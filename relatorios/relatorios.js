//--------------------------------------------------
//  BLOQUEAR SE NÃO ESTIVER LOGADO
//--------------------------------------------------
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
if (!usuario) window.location.href = "../login/login.html";

const conteudo = document.getElementById("conteudo");
const btnCarregar = document.getElementById("btnCarregar");
const select = document.getElementById("tipoRelatorio");
let graficoAtual = null;

//--------------------------------------------------
// MAPA DE ROTAS DOS RELATÓRIOS
//--------------------------------------------------
const rotas = {
    "questionario": "/relatorios",

    "pesquisas-em-andamento": "/relatorios/pesquisas-em-andamento",
    "membros-equipe": "/relatorios/membros-equipe",

    "tarefas-pendentes": "/relatorios/tarefas-pendentes",
    "produtividade": "/relatorios/produtividade",

    "estabelecimentos-localizacao": "/relatorios/estabelecimentos-localizacao",
    "contato-completo": "/relatorios/contato-completo",

    "pcd": "/relatorios/pcd",

    "perfil-proprietarios": "/relatorios/perfil-proprietarios",
    "empregos-tipo": "/relatorios/empregos-tipo",

    "levantamentos-revisao": "/relatorios/levantamentos-revisao",
    "estabelecimentos-incompletos": "/relatorios/estabelecimentos-incompletos",

    "completo-estabelecimento": "/relatorios/completo-estabelecimento",
    "estatisticas-uso": "/relatorios/estatisticas-uso",

    "periodo-funcionamento": "/relatorios/periodo-funcionamento",
    "capacidade-media": "/relatorios/capacidade-media",
    "certificados": "/relatorios/certificados",
    "sinalizacao-turistica": "/relatorios/sinalizacao-turistica"
};

//--------------------------------------------------
// BOTÃO CARREGAR
//--------------------------------------------------
btnCarregar.addEventListener("click", () => {
    const tipo = select.value;
    if (!tipo) {
        conteudo.innerHTML = "<p>Selecione um relatório.</p>";
        return;
    }
    carregarRelatorio(tipo);
});

//--------------------------------------------------
// LÓGICA PRINCIPAL
//--------------------------------------------------
async function carregarRelatorio(tipo) {
    conteudo.innerHTML = "<p>Carregando relatório...</p>";

    if (graficoAtual) graficoAtual.destroy();

    // RELATÓRIO PRINCIPAL
    if (tipo === "questionario") {
        const resp = await fetch("http://localhost:3000/relatorios");
        const dados = await resp.json();
        gerarTabelaEstiloExcel(dados);
        return;
    }

    // RELATÓRIOS NOVOS
    const resp = await fetch(`http://localhost:3000${rotas[tipo]}`);
    let dados = await resp.json();

    if (!Array.isArray(dados)) dados = [dados];
    if (!dados.length) {
        conteudo.innerHTML = "<p>Nenhum dado encontrado.</p>";
        return;
    }

    gerarTabela(dados);
    criarCanvas();
    gerarGrafico(tipo, dados);
}

//--------------------------------------------------
// CRIA O CANVAS ABAIXO DA TABELA (SEM APAGAR)
//--------------------------------------------------
function criarCanvas() {
    const graficoDiv = document.createElement("div");
    graficoDiv.className = "grafico-container";
    graficoDiv.innerHTML = "<canvas id='grafico'></canvas>";
    conteudo.appendChild(graficoDiv);
}

//--------------------------------------------------
// TABELA ANTIGA (EXCEL)
//--------------------------------------------------
function gerarTabelaEstiloExcel(dados) {
if (!dados || !Array.isArray(dados) || dados.length === 0 || !dados[0]) {
    conteudo.innerHTML = "<p>Nenhum dado encontrado ou erro no servidor.</p>";
    return;
}

let cols = Object.keys(dados[0]);
    let html = `
    <div class="tabela-wrapper">
        <table class="tabela-excel">
            <thead><tr>`;
    cols.forEach(c => html += `<th>${c}</th>`);
    html += `</tr></thead><tbody>`;
    dados.forEach(linha => {
        html += `<tr>`;
        cols.forEach(c => html += `<td>${linha[c] ?? ""}</td>`);
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    conteudo.innerHTML = html;
}

//--------------------------------------------------
// TABELA PADRÃO (NOVOS RELATÓRIOS)
//--------------------------------------------------
function gerarTabela(dados) {
if (!dados || !Array.isArray(dados) || dados.length === 0 || !dados[0]) {
    conteudo.innerHTML = "<p>Nenhum dado encontrado ou erro no servidor.</p>";
    return;
}

let cols = Object.keys(dados[0]);
    let html = `
    <div class="tabela-wrapper">
        <table class="tabela-excel">
            <thead><tr>`;
    cols.forEach(c => html += `<th>${c}</th>`);
    html += `</tr></thead><tbody>`;
    dados.forEach(l => {
        html += `<tr>`;
        cols.forEach(c => html += `<td>${l[c] ?? ""}</td>`);
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    conteudo.innerHTML = html;
}

//--------------------------------------------------
// GRÁFICOS
//--------------------------------------------------
function gerarGrafico(tipo, dados) {
    const ctx = document.getElementById("grafico");

    // TIPOS QUE TÊM GRÁFICO
    const graficos = {
        "pesquisas-em-andamento": () => ({
            labels: dados.map(d => d.titulo),
            datasets: [ { label: "Total de equipes", data: dados.map(d => d.total_equipes) } ]
        }),
        "produtividade": () => ({
            labels: dados.map(d => d.pesquisador),
            datasets: [
                { label: "Concluídos", data: dados.map(d => d.concluidos) },
                { label: "Validados", data: dados.map(d => d.validados) }
            ]
        }),
        "estabelecimentos-localizacao": () => ({
            labels: dados.map(d => `${d.tipo} - ${d.bairro}`),
            datasets: [ { label: "Quantidade", data: dados.map(d => d.quantidade) } ]
        }),
        "empregos-tipo": () => ({
            labels: dados.map(d => d.tipo),
            datasets: [ { label: "Empregos", data: dados.map(d => d.total_empregos) } ]
        }),
        "sinalizacao-turistica": () => ({
            labels: dados.map(d => `${d.zona} - ${d.bairro}`),
            datasets: [ { label: "% sinalizado", data: dados.map(d => d.percentual_sinalizado) } ]
        }),
        "pcd": () => ({
            labels: dados.map(d => d.nome_fantasia),
            datasets: [ { data: dados.map(d => d.circulacao_cadeira_rodas === "Sim" ? 1 : 0) } ]
        })
    };

    if (!graficos[tipo]) {
        ctx.style.display = "none";
        return;
    }

    graficoAtual = new Chart(ctx, {
        type: tipo === "pcd" ? "pie" : "bar",
        data: graficos[tipo](),
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
