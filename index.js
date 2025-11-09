import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

// carrega variáveis do .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // permite receber JSON no body das requisições

// conexão com MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// testar conexão
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco:", err);
  } else {
    console.log("✅ Conectado ao MySQL com sucesso!");
  }
});

// rota teste
app.get("/", (req, res) => {
  res.send("API Turismo RN funcionando 🚀");
});

// exemplo de rota para listar pontos turísticos
app.get("/pontos", (req, res) => {
  db.query("SELECT * FROM pontos_turisticos", (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados:", err);
      res.status(500).json({ erro: "Erro no servidor" });
    } else {
      res.json(results);
    }
  });
});

// exemplo de rota de login (simples)
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: "Email e senha são obrigatórios" });
  }

  // 1️⃣ Verifica se o usuário existe
  const sqlSelect = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sqlSelect, [email], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro no servidor" });
    }

    if (results.length === 0) {
      return res.status(401).json({ sucesso: false, mensagem: "Usuário não encontrado." });
    }

    const usuario = results[0];

    // 2️⃣ Verifica se o usuário está bloqueado
    if (usuario.bloqueado) {
      return res.status(403).json({ sucesso: false, mensagem: "Conta bloqueada. Contate o administrador." });
    }

    // 3️⃣ Verifica se a senha está correta
    if (senha === usuario.senha) {
      // ✅ Login bem-sucedido → zera tentativas
      const resetSql = "UPDATE usuarios SET tentativas_erradas = 0 WHERE id = ?";
      db.query(resetSql, [usuario.id]);

      return res.json({
        sucesso: true,
        id: usuario.id,
        nome: usuario.nome,
        tipoConta: usuario.tipo_conta
      });
    } else {
      // ❌ Senha incorreta → incrementa tentativas
      const novasTentativas = usuario.tentativas_erradas + 1;

      if (novasTentativas >= 5) {
        // 🔒 Bloqueia o usuário
        const bloquearSql = "UPDATE usuarios SET tentativas_erradas = ?, bloqueado = TRUE WHERE id = ?";
        db.query(bloquearSql, [novasTentativas, usuario.id]);
        return res.status(403).json({
          sucesso: false,
          mensagem: "Conta bloqueada após 5 tentativas erradas. Contate o administrador."
        });
      } else {
        // ⛔ Só incrementa o contador
        const updateSql = "UPDATE usuarios SET tentativas_erradas = ? WHERE id = ?";
        db.query(updateSql, [novasTentativas, usuario.id]);

        return res.status(401).json({
          sucesso: false,
          mensagem: `Senha incorreta. Tentativas restantes: ${5 - novasTentativas}`
        });
      }
    }
  });
});

// inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
