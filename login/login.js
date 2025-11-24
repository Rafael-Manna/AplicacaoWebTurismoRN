// login.js
const btnEntrar = document.getElementById("btn-entrar");
const inputEmail = document.getElementById("email");
const inputSenha = document.getElementById("senha");
const mensagemErro = document.getElementById("mensagem-erro");

async function botaoClick() {
  mensagemErro.innerText = "";
  const email = inputEmail.value.trim();
  const senha = inputSenha.value.trim();

  if (!email || !senha) {
    mensagemErro.innerText = "Preencha email e senha.";
    return;
  }

  try {
    const resposta = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    let corpo;
    try { corpo = await resposta.json(); } catch (e) { corpo = null; }

    if (resposta.status === 403) {
      const msg = (corpo && corpo.mensagem) ? corpo.mensagem : "Acesso proibido.";
      mostrarContaBloqueada(msg);
      return;
    }

    if (resposta.status === 401) {
      const msg = (corpo && corpo.mensagem) ? corpo.mensagem : "Email ou senha inválidos.";
      mensagemErro.innerText = msg;
      return;
    }

    if (!resposta.ok) {
      mensagemErro.innerText = (corpo && corpo.mensagem) ? corpo.mensagem : "Erro ao conectar com o servidor.";
      return;
    }

    const dados = corpo;

    // ⭐⭐⭐ SALVA ID E NOME NO LOCALSTORAGE ⭐⭐⭐
    if (dados && dados.id_usuario) {
      localStorage.setItem("id_usuario", dados.id_usuario);
      localStorage.setItem("nome_usuario", dados.nome);   // ⭐ ADICIONADO ⭐
    } else {
      console.warn("⚠ Login retornou sem id_usuario");
    }

    // Redirecionamento por tipo de conta
    if (dados && dados.tipoConta === "admin") {
      window.location.href = "../homeadm/admin.html";
    } else if (dados && dados.tipoConta === "usuario") {
      window.location.href = "../home/home.html";
    } else {
      mensagemErro.innerText = "Tipo de conta desconhecido.";
    }

  } catch (e) {
    console.error(e);
    mensagemErro.innerText = "Erro de conexão com o servidor.";
  }
}

function mostrarContaBloqueada(texto) {
  mensagemErro.innerText = texto;
  mensagemErro.classList.add("bloqueado");
  inputEmail.disabled = true;
  inputSenha.disabled = true;
  if (btnEntrar) btnEntrar.disabled = true;

  const aviso = document.getElementById("aviso-bloqueio");
  if (aviso) aviso.innerText = "Conta bloqueada. Apenas um administrador pode desbloquear.";
}
