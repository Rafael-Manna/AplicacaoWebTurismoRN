import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =======================================
// 🔗 CONEXÃO COM BANCO
// =======================================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("❌ Erro ao conectar:", err);
  else console.log("✅ Conectado ao MySQL!");
});

// =======================================
// 🚀 ROTA TESTE
// =======================================
app.get("/", (req, res) => {
  res.send("API Turismo RN funcionando 🚀");
});

// =======================================
// 👤 LOGIN
// =======================================
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Email e senha são obrigatórios"
    });
  }

  const sqlSelect = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sqlSelect, [email], (err, results) => {
    if (err)
      return res.status(500).json({ sucesso: false, mensagem: "Erro no servidor" });

    if (results.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }

    const usuario = results[0];

    if (usuario.bloqueado) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Conta bloqueada."
      });
    }

    if (senha === usuario.senha) {
      db.query("UPDATE usuarios SET tentativas_erradas = 0 WHERE id = ?", [
        usuario.id,
      ]);

      return res.json({
        sucesso: true,
        id_usuario: usuario.id,
        nome: usuario.nome,
        tipoConta: usuario.tipo_conta,
      });
    }

    const novasTentativas = usuario.tentativas_erradas + 1;

    if (novasTentativas >= 5) {
      db.query(
        "UPDATE usuarios SET tentativas_erradas = ?, bloqueado = 1 WHERE id = ?",
        [novasTentativas, usuario.id]
      );
      return res.status(403).json({
        sucesso: false,
        mensagem: "Conta bloqueada por tentativas erradas."
      });
    }

    db.query("UPDATE usuarios SET tentativas_erradas = ? WHERE id = ?", [
      novasTentativas,
      usuario.id,
    ]);

    res.status(401).json({
      sucesso: false,
      mensagem: `Senha incorreta. Tentativas restantes: ${5 - novasTentativas}`,
    });
  });
});

// =======================================
// 🟩 CRIAR USUÁRIO
// =======================================
app.post("/criar-usuario", (req, res) => {
  const { nome, email, senha, tipo_conta } = req.body;

  if (!nome || !email || !senha || !tipo_conta) {
    return res.status(400).json({ sucesso: false, mensagem: "Dados incompletos." });
  }

  const sql =
    "INSERT INTO usuarios (nome, email, senha, tipo_conta) VALUES (?, ?, ?, ?)";
  db.query(sql, [nome, email, senha, tipo_conta], (erro) => {
    if (erro) {
      if (erro.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          sucesso: false,
          mensagem: "E-mail já cadastrado."
        });
      }
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao criar usuário."
      });
    }

    res.json({ sucesso: true, mensagem: "Usuário criado com sucesso!" });
  });
});

// =======================================
// 📋 LISTAR USUÁRIOS
// =======================================
app.get("/usuarios", (req, res) => {
  db.query(
    "SELECT id, nome, email, tipo_conta, tentativas_erradas, bloqueado FROM usuarios",
    (erro, resultado) => {
      if (erro)
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao buscar usuários."
        });

      res.json({ sucesso: true, usuarios: resultado });
    }
  );
});

// =======================================
// ❌ REMOVER USUÁRIO
// =======================================
app.delete("/usuarios/:id", (req, res) => {
  db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id], (erro) => {
    if (erro)
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao remover usuário."
      });

    res.json({ sucesso: true, mensagem: "Usuário removido com sucesso!" });
  });
});

// =======================================
// ✏ EDITAR USUÁRIO
// =======================================
app.put("/usuarios/:id", (req, res) => {
  const id = req.params.id;
  const { nome, email, senha, tipo_conta, desbloquear } = req.body;

  let campos = [];
  let valores = [];

  if (nome !== undefined) {
    campos.push("nome = ?");
    valores.push(nome);
  }
  if (email !== undefined) {
    campos.push("email = ?");
    valores.push(email);
  }
  if (senha !== undefined) {
    campos.push("senha = ?");
    valores.push(senha);
  }
  if (tipo_conta !== undefined) {
    campos.push("tipo_conta = ?");
    valores.push(tipo_conta);
  }

  if (desbloquear === true) {
    campos.push("tentativas_erradas = 0", "bloqueado = 0");
  }

  if (campos.length === 0) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Nenhum campo enviado para atualizar."
    });
  }

  const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`;
  valores.push(id);

  db.query(sql, valores, (erro) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao editar usuário."
      });
    }

    res.json({ sucesso: true, mensagem: "Usuário atualizado!" });
  });
});

// ============================================================
// 📌 LISTAR PERGUNTAS
// ============================================================
app.get("/perguntas", (req, res) => {
  db.query(
    "SELECT * FROM questionario_perguntas ORDER BY numero ASC",
    (erro, resultado) => {
      if (erro) {
        console.error("Erro ao carregar perguntas:", erro);
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao carregar perguntas"
        });
      }

      res.json(resultado);
    }
  );
});

// ============================================================
// 📌 SALVAR RESPOSTAS (CORRIGIDO DE VERDADE)
// ============================================================
app.post("/questionario/salvar", (req, res) => {
  const { id_usuario, respostas } = req.body;

  if (!id_usuario) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "ID do usuário não enviado."
    });
  }

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Nenhuma resposta enviada."
    });
  }

  // Criar envio
  const sqlEnvio = "INSERT INTO questionario_envios (id_usuario) VALUES (?)";

  db.query(sqlEnvio, [id_usuario], (erro, resultadoEnvio) => {
    if (erro) {
      console.error("Erro ao criar envio:", erro);
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao criar envio."
      });
    }

    const id_envio = resultadoEnvio.insertId;

    // SALVANDO AGORA COM id_usuario
    const sqlRespostas = `
        INSERT INTO questionario_respostas (id_envio, id_usuario, id_pergunta, resposta)
        VALUES ?
    `;

    const valores = respostas.map(r => [
      id_envio,
      id_usuario,   // ⭐ AGORA VAI JUNTO ⭐
      r.id_pergunta,
      r.resposta
    ]);

    db.query(sqlRespostas, [valores], (erro2) => {
      if (erro2) {
        console.error("Erro ao salvar respostas:", erro2);
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao salvar respostas."
        });
      }

      res.json({
        sucesso: true,
        mensagem: "Respostas enviadas com sucesso!"
      });
    });
  });
});


// ============================================================
// 📊 RELATÓRIO COMPLETO (CORRIGIDO)
// ============================================================
app.get("/relatorios", (req, res) => {
  const sql = `
      SELECT 
          e.id_envio,
          u.id AS id_usuario,
          u.nome AS usuario,
          p.pergunta,
          r.resposta
      FROM questionario_envios e
      INNER JOIN usuarios u ON u.id = e.id_usuario
      INNER JOIN questionario_respostas r ON r.id_envio = e.id_envio
      INNER JOIN questionario_perguntas p ON p.id_pergunta = r.id_pergunta
      ORDER BY e.id_envio, p.numero;
  `;

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.error("Erro no relatório:", erro);
      return res.status(500).json([]);
    }

    // Agora retorna DIRETO o array
    res.json(resultado);
  });
});


// ============================================================
// 🚀 INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
