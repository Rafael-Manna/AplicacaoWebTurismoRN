// ELEMENTOS DO MODAL
const modalBg = document.getElementById("modal-bg");
const modalCriar = document.getElementById("modal-criar");
const modalEditar = document.getElementById("modal-editar");
const confirmPopup = document.getElementById("confirm-popup");

modalBg.onclick = closeAll;

// ===== FUNÇÕES =====
function openModal(modal) {
    modalBg.style.display = "block";
    modal.style.display = "block";
}

function closeAll() {
    modalBg.style.display = "none";
    modalCriar.style.display = "none";
    modalEditar.style.display = "none";
    confirmPopup.style.display = "none";
}

// ===== CARREGAR USUÁRIOS =====
async function carregarUsuarios() {
    try {
        const res = await fetch("http://localhost:3000/usuarios");
        const data = await res.json();

        const lista = document.getElementById("lista-usuarios");
        lista.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.textContent = "Selecione um usuário";
        placeholder.disabled = true;
        placeholder.selected = true;
        lista.appendChild(placeholder);

        data.usuarios.forEach(u => {
            const option = document.createElement("option");
            option.value = u.id;
            option.textContent = `${u.nome} — ${u.email}`;
            lista.appendChild(option);
        });

    } catch (erro) {
        alert("Erro ao carregar usuários.");
    }
}

carregarUsuarios();

// ===== CRIAR =====
document.getElementById("add-user-button").onclick = () => {
    openModal(modalCriar);
};

document.getElementById("confirmar-criar").onclick = async () => {
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const tipo_conta = document.getElementById("tipo_conta").value;

    const res = await fetch("http://localhost:3000/criar-usuario", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({nome, email, senha, tipo_conta})
    });

    alert((await res.json()).mensagem);
    closeAll();
    carregarUsuarios();
};

// ===== FLAGS “NÃO ALTERAR” =====
let alterarNome = true;
let alterarEmail = true;
let alterarSenha = true;
let alterarTipo = true;

// ===== BOTÕES “NÃO ALTERAR” =====
document.getElementById("no-edit-nome").onclick = () => {
    const campo = document.getElementById("edit-nome");
    alterarNome = !alterarNome;
    campo.classList.toggle("input-disabled", !alterarNome);
};

document.getElementById("no-edit-email").onclick = () => {
    const campo = document.getElementById("edit-email");
    alterarEmail = !alterarEmail;
    campo.classList.toggle("input-disabled", !alterarEmail);
};

document.getElementById("no-edit-senha").onclick = () => {
    const campo = document.getElementById("edit-senha");
    alterarSenha = !alterarSenha;
    campo.classList.toggle("input-disabled", !alterarSenha);
};

document.getElementById("no-edit-tipo").onclick = () => {
    const campo = document.getElementById("edit-tipo");
    alterarTipo = !alterarTipo;
    campo.classList.toggle("input-disabled", !alterarTipo);
};

// ===== EDITAR =====
document.getElementById("edit-user-button").onclick = () => {
    openModal(modalEditar);
};

document.getElementById("salvar-edicao").onclick = async () => {
    const id = document.getElementById("lista-usuarios").value;

    const usuarioAtualizado = {};

    if (alterarNome) usuarioAtualizado.nome = document.getElementById("edit-nome").value;
    if (alterarEmail) usuarioAtualizado.email = document.getElementById("edit-email").value;

    if (alterarSenha) {
        const novaSenha = document.getElementById("edit-senha").value.trim();
        if (novaSenha !== "") usuarioAtualizado.senha = novaSenha;
    }

    if (alterarTipo) usuarioAtualizado.tipo_conta = document.getElementById("edit-tipo").value;

    usuarioAtualizado.desbloquear = document.getElementById("edit-desbloquear").checked;

    const res = await fetch(`http://localhost:3000/usuarios/${id}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(usuarioAtualizado)
    });

    alert((await res.json()).mensagem);
    closeAll();
    carregarUsuarios();

    alterarNome = alterarEmail = alterarSenha = alterarTipo = true;

    document.getElementById("edit-nome").classList.remove("input-disabled");
    document.getElementById("edit-email").classList.remove("input-disabled");
    document.getElementById("edit-senha").classList.remove("input-disabled");
    document.getElementById("edit-tipo").classList.remove("input-disabled");
};

// ===== REMOVER =====
document.getElementById("remove-user-button").onclick = () => {
    openModal(confirmPopup);

    document.getElementById("confirm-sim").onclick = async () => {
        const id = document.getElementById("lista-usuarios").value;

        const res = await fetch(`http://localhost:3000/usuarios/${id}`, {
            method: "DELETE"
        });

        alert((await res.json()).mensagem);
        closeAll();
        carregarUsuarios();
    };

    document.getElementById("confirm-nao").onclick = closeAll;
};
