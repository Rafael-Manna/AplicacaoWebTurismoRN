
function botaoClick(){ 
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  
  // Exemplo de validação simples, substituir depois 
  const emailCorreto = "usuario@exemplo.com";
  const senhaCorreta = "12345";

  if(email === emailCorreto && senha === senhaCorreta){
        window.location.href = "../home/home.html";
    } else {
        document.getElementById('mensagem-erro').innerHTML = ("Email ou senha incorretos");        
}
};