//--------------------------------------------------
//  BLOQUEAR SE NÃO ESTIVER LOGADO
//--------------------------------------------------
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

if (!usuario) {
    window.location.href = "../login/login.html";
}

//--------------------------------------------------
//  CARREGAR PERGUNTAS
//--------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("form-questionario");

    try {
        const resposta = await fetch("http://localhost:3000/perguntas");
        const perguntas = await resposta.json();

        perguntas.forEach(p => {

            // LABEL
            const label = document.createElement("label");
            label.classList.add("pergunta-label");
            label.textContent = `${p.numero}. ${p.pergunta}`;
            form.appendChild(label);

            let campo;

            // ======================
            //  TEXTO
            // ======================
            if (p.tipo === "texto") {
                campo = document.createElement("input");
                campo.type = "text";
                campo.dataset.id_pergunta = p.id_pergunta;
                form.appendChild(campo);
                return;
            }

            // ======================
            //  NUMERO
            // ======================
            if (p.tipo === "numero") {
                campo = document.createElement("input");
                campo.type = "number";
                campo.dataset.id_pergunta = p.id_pergunta;
                form.appendChild(campo);
                return;
            }

            // ======================
            //  TEXTO LONGO
            // ======================
            if (p.tipo === "texto_longo") {
                campo = document.createElement("textarea");
                campo.dataset.id_pergunta = p.id_pergunta;
                form.appendChild(campo);
                return;
            }

            // ======================
            //  SELECT (com outro)
            // ======================
            if (p.tipo === "select") {
                campo = document.createElement("select");
                campo.dataset.id_pergunta = p.id_pergunta;

                const opcoes = p.opcoes.split(";");

                opcoes.forEach(op => {
                    const opt = document.createElement("option");
                    opt.value = op;
                    opt.textContent = op;
                    campo.appendChild(opt);
                });

                const outroInput = document.createElement("input");
                outroInput.type = "text";
                outroInput.placeholder = "Especifique...";
                outroInput.classList.add("outro-input");
                outroInput.style.display = "none";
                outroInput.dataset.id_pergunta = p.id_pergunta;

                campo.addEventListener("change", () => {
                    outroInput.style.display =
                        campo.value.includes("Outro") ? "block" : "none";

                    if (outroInput.style.display === "none") outroInput.value = "";
                });

                form.appendChild(campo);
                form.appendChild(outroInput);
                return;
            }

            // ======================
            //  CHECKBOX (com outro)
            // ======================
            if (p.tipo === "checkbox") {
                const container = document.createElement("div");
                container.classList.add("checkbox-container");

                p.opcoes.split(";").forEach(op => {
                    const item = document.createElement("label");
                    const check = document.createElement("input");

                    check.type = "checkbox";
                    check.value = op;
                    check.dataset.id_pergunta = p.id_pergunta;

                    item.appendChild(check);
                    item.appendChild(document.createTextNode(" " + op));
                    container.appendChild(item);

                    // OUTRO
                    if (op.includes("Outro")) {
                        const outroInput = document.createElement("input");
                        outroInput.type = "text";
                        outroInput.placeholder = "Especifique...";
                        outroInput.classList.add("outro-input");
                        outroInput.style.display = "none";
                        outroInput.dataset.id_pergunta = p.id_pergunta;

                        check.addEventListener("change", () => {
                            outroInput.style.display = check.checked ? "block" : "none";

                            if (!check.checked) outroInput.value = "";
                        });

                        container.appendChild(outroInput);
                    }
                });

                form.appendChild(container);
                return;
            }
        });

    } catch {
        document.getElementById("status").innerText = "Erro ao carregar perguntas.";
    }
});

//--------------------------------------------------
//  ENVIAR RESPOSTAS
//--------------------------------------------------
document.getElementById("enviar-btn").addEventListener("click", async () => {

    const respostas = [];
    let faltando = [];

    //------------------------------------------------------
    // Inputs simples
    //------------------------------------------------------
    document.querySelectorAll("#form-questionario [data-id_pergunta]").forEach(el => {

        if (el.classList.contains("outro-input")) return;
        if (el.tagName === "SELECT") return;
        if (el.type === "checkbox") return;

        if (el.value.trim() === "") faltando.push(el.dataset.id_pergunta);

        respostas.push({
            id_pergunta: el.dataset.id_pergunta,
            resposta: el.value
        });
    });

    //------------------------------------------------------
    // SELECT
    //------------------------------------------------------
    document.querySelectorAll("select[data-id_pergunta]").forEach(select => {
        const id = select.dataset.id_pergunta;
        const outro = document.querySelector(`input.outro-input[data-id_pergunta="${id}"]`);

        if (outro && outro.style.display !== "none") {
            if (outro.value.trim() === "") faltando.push(id);

            respostas.push({
                id_pergunta: id,
                resposta: outro.value
            });
        } else {
            if (select.value.trim() === "") faltando.push(id);

            respostas.push({
                id_pergunta: id,
                resposta: select.value
            });
        }
    });

    //------------------------------------------------------
    // CHECKBOXES
    //------------------------------------------------------
    const agrupado = {};

    document.querySelectorAll("input[type='checkbox']").forEach(c => {
        const id = c.dataset.id_pergunta;

        if (!agrupado[id]) agrupado[id] = [];
        if (c.checked) agrupado[id].push(c.value);
    });

    document.querySelectorAll(".outro-input").forEach(outro => {
        const id = outro.dataset.id_pergunta;

        if (outro.style.display !== "none" && outro.value.trim() !== "") {
            if (!agrupado[id]) agrupado[id] = [];
            agrupado[id].push(outro.value);
        }
    });

    Object.keys(agrupado).forEach(id => {
        if (agrupado[id].length === 0) faltando.push(id);

        respostas.push({
            id_pergunta: id,
            resposta: agrupado[id].join("; ")
        });
    });

    //------------------------------------------------------
    // BLOQUEAR SE FALTA
    //------------------------------------------------------
    if (faltando.length > 0) {
        document.getElementById("status").innerHTML =
            "⚠️ Complete as perguntas: <b>" + faltando.join(", ") + "</b>";
        return;
    }

    //------------------------------------------------------
    // ENVIO AO SERVIDOR
    //------------------------------------------------------
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    const envio = await fetch("http://localhost:3000/questionario/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id_usuario: usuario.id,
            respostas
        })
    });

    const result = await envio.json();
    document.getElementById("status").innerText = result.mensagem;
});


//--------------------------------------------------
// BOTÃO SAIR
//--------------------------------------------------
document.getElementById("btn-sair").addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "../login/login.html";
});

//--------------------------------------------------
// BOTÃO VOLTAR
//--------------------------------------------------
document.getElementById("btn-voltar").addEventListener("click", () => {
    window.location.href = "../home/home.html";
});
