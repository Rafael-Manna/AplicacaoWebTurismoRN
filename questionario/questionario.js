// =============================
//  CARREGA PERGUNTAS
// =============================
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

            // ⭐ TEXTO
            if (p.tipo === "texto") {
                campo = document.createElement("input");
                campo.type = "text";
            }

            // ⭐ NÚMERO
            else if (p.tipo === "numero") {
                campo = document.createElement("input");
                campo.type = "number";
            }

            // ⭐ TEXTO LONGO
            else if (p.tipo === "texto_longo") {
                campo = document.createElement("textarea");
            }

            // ⭐ SELECT (com Outro)
            else if (p.tipo === "select") {

                campo = document.createElement("select");
                campo.dataset.numero = p.numero;

                const opcoes = p.opcoes.split(";");

                opcoes.forEach(op => {
                    const opt = document.createElement("option");
                    opt.value = op;
                    opt.textContent = op;
                    campo.appendChild(opt);
                });

                // OUTRO (inicia invisível)
                const outroInput = document.createElement("input");
                outroInput.type = "text";
                outroInput.placeholder = "Especifique...";
                outroInput.classList.add("outro-input");
                outroInput.dataset.numero = p.numero;
                outroInput.style.display = "none";

                campo.addEventListener("change", () => {
                    if (campo.value.includes("Outro")) {
                        outroInput.style.display = "block";
                    } else {
                        outroInput.style.display = "none";
                        outroInput.value = "";
                    }
                });

                form.appendChild(campo);
                form.appendChild(outroInput);
                return;
            }

            // ⭐ CHECKBOX (com Outro)
            else if (p.tipo === "checkbox") {

                const container = document.createElement("div");
                container.classList.add("checkbox-container");

                p.opcoes.split(";").forEach(op => {

                    const item = document.createElement("label");
                    const check = document.createElement("input");

                    check.type = "checkbox";
                    check.value = op;
                    check.dataset.numero = p.numero;

                    item.appendChild(check);
                    item.appendChild(document.createTextNode(" " + op));
                    container.appendChild(item);

                    // OUTRO
                    if (op.includes("Outro")) {

                        const outroInput = document.createElement("input");
                        outroInput.type = "text";
                        outroInput.placeholder = "Especifique...";
                        outroInput.style.display = "none";
                        outroInput.classList.add("outro-input");
                        outroInput.dataset.numero = p.numero;

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

            campo.dataset.numero = p.numero;
            form.appendChild(campo);
        });

    } catch {
        document.getElementById("status").innerText = "Erro ao carregar perguntas.";
    }
});


// =============================
//  ENVIAR RESPOSTAS
// =============================
document.getElementById("enviar-btn").addEventListener("click", async () => {

    const respostas = [];
    let faltando = []; // ← campos não preenchidos

    // Inputs simples
    document.querySelectorAll("#form-questionario [data-numero]").forEach(el => {

        if (el.classList.contains("outro-input")) return;
        if (el.tagName === "SELECT") return;
        if (el.type === "checkbox") return;

        if (el.value.trim() === "") faltando.push(el.dataset.numero);

        respostas.push({
            numero: el.dataset.numero,
            resposta: el.value
        });
    });

    // Selects + Outro
    document.querySelectorAll("select[data-numero]").forEach(select => {
        const numero = select.dataset.numero;
        const outro = document.querySelector(`input.outro-input[data-numero="${numero}"]`);

        if (outro && outro.style.display !== "none") {
            if (outro.value.trim() === "") faltando.push(numero);

            respostas.push({
                numero,
                resposta: outro.value
            });
        } else {
            if (select.value.trim() === "") faltando.push(numero);

            respostas.push({
                numero,
                resposta: select.value
            });
        }
    });

    // Checkbox
    const agrupado = {};

    document.querySelectorAll("input[type='checkbox']").forEach(c => {
        const numero = c.dataset.numero;

        if (!agrupado[numero]) agrupado[numero] = [];

        if (c.checked) agrupado[numero].push(c.value);
    });

    // Checkbox Outro
    document.querySelectorAll(".outro-input").forEach(outro => {
        if (outro.style.display !== "none" && outro.value.trim() !== "") {
            const numero = outro.dataset.numero;
            if (!agrupado[numero]) agrupado[numero] = [];
            agrupado[numero].push(outro.value);
        }
    });

    Object.keys(agrupado).forEach(numero => {
        if (agrupado[numero].length === 0) faltando.push(numero);

        respostas.push({
            numero,
            resposta: agrupado[numero].join("; ")
        });
    });


    // =============================
    //  BLOQUEIA ENVIO SE TIVER FALTANDO
    // =============================
    if (faltando.length > 0) {
        document.getElementById("status").innerHTML =
            "⚠️ Responda as perguntas: <b>" + faltando.join(", ") + "</b>";
        return;
    }


    // Enviar ao servidor
    const envio = await fetch("http://localhost:3000/questionario/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id_usuario: localStorage.getItem("id_usuario"),
            respostas
        })
    });

    const result = await envio.json();
    document.getElementById("status").textContent = result.mensagem;
});
