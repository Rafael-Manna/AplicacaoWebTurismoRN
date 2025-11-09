// login.js
const btnEntrar = document.getElementById("btn-entrar"); // ajuste o id se o botão tiver outro
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

    // tenta ler o body (se tiver)
    let corpo;
    try { corpo = await resposta.json(); } catch (e) { corpo = null; }

    // Caso código 403 -> usuário bloqueado (ou outro motivo proibido)
    if (resposta.status === 403) {
      // Se o servidor retornou mensagem sensata, usa ela; senão, mensagem padrão:
      const msg = (corpo && corpo.mensagem) ? corpo.mensagem : "Acesso proibido.";
      // Mostra mensagem e bloqueia inputs
      mostrarContaBloqueada(msg);
      return;
    }

    // 401 -> credenciais inválidas
    if (resposta.status === 401) {
      const msg = (corpo && corpo.mensagem) ? corpo.mensagem : "Email ou senha inválidos.";
      mensagemErro.innerText = msg;
      return;
    }

    if (!resposta.ok) {
      // outros erros
      mensagemErro.innerText = (corpo && corpo.mensagem) ? corpo.mensagem : "Erro ao conectar com o servidor.";
      return;
    }

    // login ok
    const dados = corpo; // já parseado acima
    if (dados && dados.tipoConta === "admin") {
      window.location.href = "../admin/admin.html";
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

// função que bloqueia inputs e mostra mensagem explícita
function mostrarContaBloqueada(texto) {
  mensagemErro.innerText = texto;
  mensagemErro.classList.add("bloqueado"); // estilo opcional
  // desabilita campos e botão
  inputEmail.disabled = true;
  inputSenha.disabled = true;
  if (btnEntrar) btnEntrar.disabled = true;
  // opcional: adicionar texto explicativo
  const aviso = document.getElementById("aviso-bloqueio");
  if (aviso) aviso.innerText = "Conta bloqueada. Apenas um administrador pode desbloquear.";
}

// (opcional) função que o admin pode chamar para re-habilitar via front (só se quiser)
// function habilitarLocalmente() {
//   inputEmail.disabled = false;
//   inputSenha.disabled = false;
//   if (btnEntrar) btnEntrar.disabled = false;
//   mensagemErro.innerText = "";
//   mensagemErro.classList.remove("bloqueado");
// }
