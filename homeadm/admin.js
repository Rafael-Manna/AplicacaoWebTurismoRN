// BLOQUEIO SEM LOGIN
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
if (!usuario) window.location.href = "../login/login.html";

document.getElementById("nome-usuario").textContent = usuario.nome;

document.getElementById("btn-sair").addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "../login/login.html";
});

// ELEMENTOS
const tbody = document.querySelector("#tabelaUsuarios tbody");
const modal = document.getElementById("modal");

const editId = document.getElementById("edit-id");
const editNome = document.getElementById("edit-nome");
const editEmail = document.getElementById("edit-email");
const editSenha = document.getElementById("edit-senha");
const editTipo = document.getElementById("edit-tipo");
const editDesbloquear = document.getElementById("edit-desbloquear");

// LISTAR USUÁRIOS
async function carregarUsuarios() {
    const resp = await fetch("http://localhost:3000/admin/usuarios");
    const dados = await resp.json();

    tbody.innerHTML = "";

    dados.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>${u.tipo_conta}</td>
                <td>${u.bloqueado ? "Sim" : "Não"}</td>
                <td>
                    <button class="btn-editar" data-id="${u.id}">Editar</button>
                    <button class="btn-excluir" data-id="${u.id}">Excluir</button>
                </td>
            </tr>
        `;
    });

    document.querySelectorAll(".btn-editar").forEach(btn =>
        btn.addEventListener("click", () => abrirEdicao(btn.dataset.id))
    );

    document.querySelectorAll(".btn-excluir").forEach(btn =>
        btn.addEventListener("click", () => deletarUsuario(btn.dataset.id))
    );
}

carregarUsuarios();

// DELETE
async function deletarUsuario(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    await fetch(`http://localhost:3000/admin/usuarios/${id}`, {
        method: "DELETE"
    });

    carregarUsuarios();
}

// ABRIR MODAL EDITAR
async function abrirEdicao(id) {
    const resp = await fetch("http://localhost:3000/admin/usuarios");
    const lista = await resp.json();
    const user = lista.find(u => u.id == id);

    document.getElementById("modal-titulo").textContent = "Editar Usuário";

    editId.value = user.id;
    editNome.value = user.nome;
    editEmail.value = user.email;
    editSenha.value = "";
    editTipo.value = user.tipo_conta;
    editDesbloquear.checked = user.bloqueado === 1;

    modal.style.display = "flex";
}

// ABRIR MODAL CRIAR
document.getElementById("btn-criar").addEventListener("click", () => {
    document.getElementById("modal-titulo").textContent = "Criar Usuário";

    editId.value = "";
    editNome.value = "";
    editEmail.value = "";
    editSenha.value = "";
    editTipo.value = "usuario";
    editDesbloquear.checked = false;

    modal.style.display = "flex";
});

// CANCELAR
document.getElementById("btn-cancelar").addEventListener("click", () => {
    modal.style.display = "none";
});

// SALVAR
document.getElementById("btn-salvar").addEventListener("click", async () => {

    const id = editId.value;

    const body = {
        nome: editNome.value,
        email: editEmail.value,
        tipo_conta: editTipo.value,
        desbloquear: editDesbloquear.checked ? 1 : 0
    };

    if (editSenha.value.trim() !== "") {
        body.senha = editSenha.value;
    }

    if (id) {
        await fetch(`http://localhost:3000/admin/usuarios/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    } else {
        await fetch(`http://localhost:3000/admin/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    }

    modal.style.display = "none";
    carregarUsuarios();
});
