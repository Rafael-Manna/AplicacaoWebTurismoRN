// Impedir acesso sem login
document.addEventListener("DOMContentLoaded", () => {
    const nome = localStorage.getItem("nome_usuario");
    const id = localStorage.getItem("id_usuario");
    const titulo = document.getElementById("titulo");

    if (!id) {
        alert("Você precisa estar logado!");
        window.location.href = "../login/login.html";
        return;
    }

    if (nome) {
        titulo.textContent = `Bem-vindo(a), ${nome}!`;
    }
});

// Botão para responder questionário
document.getElementById("btn-responder").addEventListener("click", () => {
    window.location.href = "../questionario/questionario.html";
});

// Botão para sair
document.getElementById("btn-sair").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../login/login.html";
});
