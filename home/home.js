//--------------------------------------------------
// BLOQUEAR QUEM NÃO ESTÁ LOGADO OU ADM NA HOME NORMAL
//--------------------------------------------------
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

if (!usuario) {
    window.location.href = "../login/login.html";
} 
else if (usuario.tipo_conta === "adm") {
    window.location.href = "../homeadm/admin.html";
}

//--------------------------------------------------
// MOSTRAR NOME DO USUÁRIO
//--------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const campoNome = document.getElementById("nome-usuario");

    if (campoNome && usuario) {
        campoNome.textContent = usuario.nome;
    }
});

//--------------------------------------------------
// BOTÕES
//--------------------------------------------------
document.getElementById("btn-questionario")?.addEventListener("click", () => {
    window.location.href = "../questionario/questionario.html";
});

document.getElementById("btn-relatorios")?.addEventListener("click", () => {
    window.location.href = "../relatorios/relatorios.html";
});

//--------------------------------------------------
// BOTÃO SAIR
//--------------------------------------------------
document.getElementById("btn-sair")?.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "../login/login.html";
});
