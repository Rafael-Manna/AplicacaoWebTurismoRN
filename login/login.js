document.getElementById("btnEntrar").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erro = document.getElementById("mensagem-erro");

    if (!email || !senha) {
        erro.innerText = "Preencha todos os campos.";
        return;
    }

    try {
        const resp = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await resp.json();

        if (!resp.ok) {
            erro.innerText = data.mensagem || "Erro no login.";
            return;
        }

        // ⬇️ SALVA TUDO NO PADRÃO CORRETO
        const usuarioLogado = {
            id: data.id,
            nome: data.nome,
            email: data.email,
            tipo_conta: data.tipo_conta
        };

        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));

        // REDIRECIONAMENTO CORRETO
        if (data.tipo_conta === "adm") {
            window.location.href = "../homeadm/admin.html";
        } else {
            window.location.href = "../home/home.html";
        }

    } catch (e) {
        erro.innerText = "Falha ao conectar ao servidor.";
    }
});
