document.addEventListener("DOMContentLoaded", async () => {
    const conteudo = document.getElementById("conteudo");

    try {
        const resp = await fetch("http://localhost:3000/relatorios");
        const dados = await resp.json();

        if (!dados || dados.length === 0) {
            conteudo.innerHTML = "<p>Nenhum dado encontrado.</p>";
            return;
        }

        const envios = {};
        const perguntasSet = new Set();

        dados.forEach(item => {
            perguntasSet.add(item.pergunta);

            if (!envios[item.id_envio]) {
                envios[item.id_envio] = {
                    usuario: item.usuario,
                    respostas: {}
                };
            }
            envios[item.id_envio].respostas[item.pergunta] = item.resposta;
        });

        const perguntas = Array.from(perguntasSet);

        let html = `
            <div class="tabela-wrapper">
            <table class="tabela-excel">
                <thead>
                    <tr>
                        <th>Usuário</th>
                        ${perguntas.map(p => `<th>${p}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
        `;

        Object.values(envios).forEach(envio => {
            html += `<tr><td>${envio.usuario}</td>`;

            perguntas.forEach(p => {
                html += `<td>${envio.respostas[p] || ""}</td>`;
            });

            html += "</tr>";
        });

        html += `
                </tbody>
            </table>
            </div>
        `;

       conteudo.innerHTML = `
    <div class="tabela-wrapper">
        ${html}
    </div>
`;


    } catch (e) {
        console.error(e);
        conteudo.innerHTML = "<p>Erro ao carregar relatório.</p>";
    }
});

// botão voltar
document.getElementById("voltar-top").addEventListener("click", () => {
    window.location.href = "../home/home.html";
});
