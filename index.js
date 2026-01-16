import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// 🔗 CONEXÃO MYSQL
// ============================================================
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

// ============================================================
// 🔥 PROCESSADOR COMPLETO (VERSÃO 2.0)
// Gera 1 ESTABELECIMENTO COMPLETO a partir de 1 questionário
// ============================================================
async function processarQuestionario(id_envio, id_usuario) {
    return new Promise((resolve, reject) => {

        const sql = `
            SELECT p.numero, r.resposta
            FROM questionario_respostas r
            JOIN questionario_perguntas p ON p.id_pergunta = r.id_pergunta
            WHERE r.id_envio = ?
            ORDER BY p.numero
        `;

        db.query(sql, [id_envio], async (err, respostas) => {
            if (err) return reject(err);

            // Mapeamento simples
            const r = {};
            respostas.forEach(item => { r[item.numero] = item.resposta || ""; });

            // ============================================================
            // 1) ESTABELECIMENTO
            // ============================================================
            const est = {
                tipo: r[1],
                razao_social: r[2],
                nome_fantasia: r[3],
                codigo_cnae: r[4],
                cnpj: r[5],
                atividade_economica: r[6],
                nome_rede: r[7],
                inscricao_municipal: r[8],
                natureza: r[9],
                natureza_juridica: r[10],
                tipo_organizacao: r[18],
                inicio_atividade: r[19] || null
            };

            const insertEst = "INSERT INTO Estabelecimento SET ?";
            const estId = await new Promise((resolve2, reject2) => {
                db.query(insertEst, est, (err2, result) => {
                    if (err2) reject2(err2);
                    else resolve2(result.insertId);
                });
            });

            // ============================================================
            // 2) PROPRIETÁRIO
            // ============================================================
            const proprietario = {
                id_estabelecimento: estId,
                genero: r[11],
                etnia: r[12],
                faixa_etaria: r[13],
                estado_civil: r[14],
                escolaridade: r[15],
                reside_no_municipio: r[16],
                municipio_residencia: r[17],
            };
            db.query("INSERT INTO Proprietario SET ?", proprietario);

            // ============================================================
            // 3) RECURSOS HUMANOS
            // ============================================================
            const rh = {
                id_estabelecimento: estId,
                funcionarios_permanentes: r[20] || 0,
                funcionarios_temporarios: r[21] || 0,
                funcionarios_deficiencia: r[22] || 0,
                terceirizados: r[23] || 0
            };
            db.query("INSERT INTO Recursos_Humanos SET ?", rh);

            // ============================================================
            // 4) LOCALIZAÇÃO
            // ============================================================
            let lat = null, lon = null;
            if (r[25] && r[25].includes(",")) {
                const partes = r[25].split(",");
                lat = parseFloat(partes[0].trim());
                lon = parseFloat(partes[1].trim());
            }

            const local = {
                id_estabelecimento: estId,
                zona: r[24],
                endereco: r[26],
                bairro: r[27],
                distrito: r[28],
                cep: r[29],
                latitude: lat,
                longitude: lon,
                possui_sinalizacao_acesso: r[35],
                possui_sinalizacao_turistica: r[36]
            };
            db.query("INSERT INTO Localizacao SET ?", local);

            // ============================================================
            // 5) CONTATO
            // ============================================================
            const contato = {
                id_estabelecimento: estId,
                telefone: r[30],
                email: r[31],
                whatsapp: r[32],
                rede_social: r[33],
                website: r[34]
            };
            db.query("INSERT INTO Contato SET ?", contato);

            // ============================================================
            // 6) FUNCIONAMENTO
            // ============================================================
            const func = {
                id_estabelecimento: estId,
                formas_pagamento: r[37],
                vendas_reservas: r[38],
                atendimento_lingua_estrangeira: r[39],
                informativos_impresso: r[40],
                periodo_funcionamento: r[41],
                dias_trabalho: r[42],
                funcionamento_24h: r[43],
                funcionamento_feriados: r[44],
                restricoes: r[45],
                outras_regras: r[46]
            };
            db.query("INSERT INTO Funcionamento SET ?", func);

            // ============================================================
            // 7) CAPACIDADE
            // ============================================================
            const capacidade = {
                id_estabelecimento: estId,
                capacidade_dia: r[47],
                pessoas_sentadas: r[48],
                capacidade_simultanea: r[49],
                pessoas_sentadas_simultaneamente: r[50],
            };
            db.query("INSERT INTO Capacidade SET ?", capacidade);

            // ============================================================
            // 8) INSTALAÇÕES
            // ============================================================
            const instalacoes = {
                id_estabelecimento: estId,
                possui_estacionamento: r[51],
                capacidade_veiculos: r[52],
                automoveis: r[53],
                onibus: r[54],
            };
            db.query("INSERT INTO Instalacoes SET ?", instalacoes);

            // ============================================================
            // 9) SERVIÇOS
            // ============================================================
            const servicos = {
                id_estabelecimento: estId,
                servicos_equipamentos: r[55],
                culinaria_regiao: r[56],
                especializacao: r[57],
                tipo_servico: r[58],
            };
            db.query("INSERT INTO Servicos SET ?", servicos);

            // ============================================================
            // 10) QUALIFICAÇÃO
            // ============================================================
            const qual = {
                id_estabelecimento: estId,
                certificacao_premiacao: r[59],
                estado_conservacao: null
            };
            db.query("INSERT INTO Qualificacao SET ?", qual);

            // ============================================================
            // 11) ACESSIBILIDADE
            // ============================================================
            const ac = {
                id_estabelecimento: estId,
                facilidade_pcd: r[35],
                pessoal_capacitado_pcd: "",
                rota_externa_acessivel: "",
                simbolo_acesso: "",
                embarque_desembarque: "",
                circulacao_cadeira_rodas: r[39] || "",
                escada: "",
                rampa: "",
                piso: "",
                elevador: "",
                equipamento_motorizado: "",
                sinalizacao_visual: "",
                sinalizacao_tatil: "",
                alarme_emergencia: "",
                comunicacao: "",
                balcao_atendimento: "",
                mobiliario: "",
                sanitario: "",
                telefone_acessivel: "",
                sinalizacao_preferencial: ""
            };
            db.query("INSERT INTO Acessibilidade SET ?", ac);

            // FINALIZA
            resolve(true);
        });
    });
}


// ============================================================
// ROTAS BÁSICAS
// ============================================================
app.get("/", (req, res) => {
  res.send("API Turismo RN - Conectado ao novo banco 🚀");
});

// ============================================================
// 👤 LOGIN 
// ============================================================
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Email e senha são obrigatórios",
    });
  }

  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], (err, rows) => {
    if (err) return res.status(500).json({ mensagem: "Erro no servidor" });
    if (rows.length === 0)
      return res.status(401).json({ mensagem: "Usuário não encontrado." });

    const user = rows[0];

    if (user.bloqueado)
      return res.status(403).json({ mensagem: "Conta bloqueada." });

    if (user.senha === senha) {
      // Zera tentativas
      db.query("UPDATE usuarios SET tentativas_erradas = 0 WHERE id = ?", [
        user.id,
      ]);

      // ⭐⭐ CORREÇÃO MAIS IMPORTANTE DO PROJETO ⭐⭐
      return res.json({
        sucesso: true,
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo_conta: user.tipo_conta, 
      });
    }

    const novas = user.tentativas_erradas + 1;

    if (novas >= 5) {
      db.query(
        "UPDATE usuarios SET tentativas_erradas = ?, bloqueado = 1 WHERE id = ?",
        [novas, user.id]
      );
      return res
        .status(403)
        .json({ mensagem: "Conta bloqueada por tentativas." });
    }

    db.query("UPDATE usuarios SET tentativas_erradas = ? WHERE id = ?", [
      novas,
      user.id,
    ]);

    res.status(401).json({
      mensagem: `Senha incorreta. Tentativas restantes: ${5 - novas}`,
    });
  });
});

// ============================================================
// ROTAS DO ADMIN (PADRONIZADAS)
// ============================================================

// 1. LISTAR USUÁRIOS
app.get("/admin/usuarios", (req, res) => {
    const sql = "SELECT id, nome, email, tipo_conta, bloqueado FROM usuarios";
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao buscar usuários" });
        res.json(rows);
    });
});

// 2. CRIAR USUÁRIO
app.post("/admin/usuarios", (req, res) => {
    const { nome, email, senha, tipo_conta } = req.body;

    if (!nome || !email || !senha || !tipo_conta) {
        return res.status(400).json({ mensagem: "Campos incompletos" });
    }

    const sql = `
        INSERT INTO usuarios (nome, email, senha, tipo_conta, tentativas_erradas, bloqueado)
        VALUES (?, ?, ?, ?, 0, 0)
    `;

    db.query(sql, [nome, email, senha, tipo_conta], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ mensagem: "Email já cadastrado." });
            }
            return res.status(500).json({ mensagem: "Erro ao criar usuário" });
        }
        res.json({ mensagem: "Usuário criado com sucesso!" });
    });
});

// 3. EDITAR USUÁRIO
app.put("/admin/usuarios/:id", (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, tipo_conta, desbloquear } = req.body;

    let campos = [];
    let valores = [];

    if (nome) { campos.push("nome=?"); valores.push(nome); }
    if (email) { campos.push("email=?"); valores.push(email); }
    if (senha) { campos.push("senha=?"); valores.push(senha); }
    if (tipo_conta) { campos.push("tipo_conta=?"); valores.push(tipo_conta); }

    if (desbloquear == 1) {
        campos.push("bloqueado=0", "tentativas_erradas=0");
    }

    valores.push(id);

    const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE id=?`;

    db.query(sql, valores, (err) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao atualizar usuário" });
        res.json({ mensagem: "Usuário atualizado!" });
    });
});

// 4. EXCLUIR USUÁRIO
app.delete("/admin/usuarios/:id", (req, res) => {
    db.query("DELETE FROM usuarios WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao deletar usuário" });
        res.json({ mensagem: "Usuário removido!" });
    });
});

// 5. DESBLOQUEAR USUÁRIO (rota opcional)
app.put("/admin/usuarios/desbloquear/:id", (req, res) => {
    db.query(
        "UPDATE usuarios SET bloqueado = 0, tentativas_erradas = 0 WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensagem: "Erro ao desbloquear usuário" });
            res.json({ mensagem: "Usuário desbloqueado!" });
        }
    );
});

// ============================================================
// 👤 CRUD DE USUÁRIOS 
// ============================================================
app.post("/criar-usuario", (req, res) => {
  const { nome, email, senha, tipo_conta } = req.body;

  db.query(
    "INSERT INTO usuarios (nome, email, senha, tipo_conta) VALUES (?, ?, ?, ?)",
    [nome, email, senha, tipo_conta],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ mensagem: "Email já cadastrado." });
        return res.status(500).json({ mensagem: "Erro ao criar usuário." });
      }
      res.json({ mensagem: "Usuário criado!" });
    }
  );
});

app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, rows) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao buscar usuários." });

    res.json({ usuarios: rows });
  });
});
app.put("/usuarios/:id", (req, res) => {
  const id = req.params.id;
  const { nome, email, senha, tipo_conta, desbloquear } = req.body;

  let campos = [];
  let valores = [];

  if (nome) {
    campos.push("nome=?");
    valores.push(nome);
  }
  if (email) {
    campos.push("email=?");
    valores.push(email);
  }
  if (senha) {
    campos.push("senha=?");
    valores.push(senha);
  }
  if (tipo_conta) {
    campos.push("tipo_conta=?");
    valores.push(tipo_conta);
  }
  if (desbloquear) {
    campos.push("bloqueado=0", "tentativas_erradas=0");
  }

  valores.push(id);

  const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE id=?`;

  db.query(sql, valores, (err) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao editar usuário." });

    res.json({ mensagem: "Usuário atualizado!" });
  });
});

app.delete("/usuarios/:id", (req, res) => {
  db.query("DELETE FROM usuarios WHERE id=?", [req.params.id], (err) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao remover usuário." });

    res.json({ mensagem: "Usuário removido!" });
  });
});

// ============================================================
// 📋 QUESTIONÁRIO (FUNCIONANDO COM O NOVO BANCO)
// ============================================================
app.get("/perguntas", (req, res) => {
  db.query(
    "SELECT * FROM questionario_perguntas ORDER BY numero ASC",
    (err, rows) => {
      if (err)
        return res.status(500).json({ mensagem: "Erro ao carregar perguntas" });
      res.json(rows);
    }
  );
});

app.post("/questionario/salvar", (req, res) => {
  const { id_usuario, respostas } = req.body;

  if (!id_usuario)
    return res.status(400).json({ mensagem: "ID do usuário não enviado" });

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({ mensagem: "Nenhuma resposta enviada" });
  }

  const sqlEnvio = "INSERT INTO questionario_envios (id_usuario) VALUES (?)";

  db.query(sqlEnvio, [id_usuario], (err, resultEnvio) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao criar envio" });

    const id_envio = resultEnvio.insertId;

    const sqlRespostas = `
      INSERT INTO questionario_respostas (id_envio, id_usuario, id_pergunta, resposta)
      VALUES ?
    `;

    const valores = respostas.map((r) => [
      id_envio,
      id_usuario,
      r.id_pergunta,
      r.resposta,
    ]);

    db.query(sqlRespostas, [valores], (err2) => {
      if (err2)
        return res
          .status(500)
          .json({ mensagem: "Erro ao salvar respostas" });
      // Processar automaticamente
      processarQuestionario(id_envio, id_usuario);
      res.json({ sucesso: true, mensagem: "Enviado com sucesso!" });
    });
  });
});

// ============================================================
// 📊 RELATÓRIO BÁSICO
// ============================================================
app.get("/relatorios", (req, res) => {
    const sql = `
        SELECT 
            e.id_envio,
            u.nome AS usuario,
            p.numero AS numero_pergunta,
            p.pergunta,
            r.resposta
        FROM questionario_envios e
        JOIN questionario_respostas r ON r.id_envio = e.id_envio
        JOIN questionario_perguntas p ON p.id_pergunta = r.id_pergunta
        JOIN usuarios u ON u.id = e.id_usuario
        ORDER BY e.id_envio, p.numero;
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ erro: err });

        // AGRUPAR POR ENVIO
        const agrupado = {};

        rows.forEach(row => {
            if (!agrupado[row.id_envio]) {
                // Agora NÃO enviamos id_envio nem id_usuario
                agrupado[row.id_envio] = {
                    Usuário: row.usuario   // título bonitinho
                };
            }

            // Coluna com o texto da pergunta
            agrupado[row.id_envio][row.pergunta] = row.resposta;
        });

        // Converter para array final
        const resultado = Object.values(agrupado);

        res.json(resultado);
    });
});

// ============================================================
// 1. CONSULTAS DE GESTÃO OPERACIONAL
// ============================================================

// 1.1 Pesquisas em andamento
app.get("/relatorios/pesquisas-em-andamento", (req, res) => {
  const sql = `
    SELECT 
      p.id_pesquisa,
      p.titulo,
      p.data_inicio,
      p.data_fim,
      u.nome AS responsavel,
      (SELECT COUNT(*) FROM Equipe e WHERE e.id_pesquisa = p.id_pesquisa) AS total_equipes
    FROM Pesquisa p
    JOIN usuarios u ON u.id = p.responsavel
    WHERE CURDATE() BETWEEN p.data_inicio AND p.data_fim;
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});

// 1.2 Membros das Equipes por Pesquisa
app.get("/relatorios/membros-equipe", (req, res) => {
  const sql = `
    SELECT 
      p.titulo AS pesquisa,
      e.nome_equipe,
      u.nome AS membro,
      ue.funcao_na_equipe,
      u.tipo_conta AS permissao
    FROM Equipe e
    JOIN Pesquisa p ON e.id_pesquisa = p.id_pesquisa
    JOIN Usuario_Equipe ue ON e.id_equipe = ue.id_equipe
    JOIN usuarios u ON ue.id_usuario = u.id
    ORDER BY p.titulo, e.nome_equipe;
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});


// ============================================================
// 2. CONSULTAS DE MONITORAMENTO DE ATIVIDADES
// ============================================================

// 2.1 Tarefas Pendentes por Equipe
app.get("/relatorios/tarefas-pendentes", (req, res) => {
  const sql = `
    SELECT 
      e.nome_equipe,
      t.titulo AS tarefa,
      t.zona_ou_area,
      t.data_atribuicao,
      t.prazo_execucao,
      t.status,
      DATEDIFF(t.prazo_execucao, CURDATE()) AS dias_para_vencer
    FROM Tarefa t
    JOIN Equipe e ON t.id_equipe = e.id_equipe
    WHERE t.status IN ('Pendente','Em andamento')
    ORDER BY t.prazo_execucao;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});

// 2.2 Produtividade dos Pesquisadores
app.get("/relatorios/produtividade", (req, res) => {
  const sql = `
    SELECT 
      u.id AS id_usuario,
      u.nome AS pesquisador,
      COUNT(l.id_levantamento) AS total_levantamentos,
      SUM(CASE WHEN l.status = 'Concluído' THEN 1 ELSE 0 END) AS concluidos,
      SUM(CASE WHEN l.status = 'Validado' THEN 1 ELSE 0 END) AS validados,
      MIN(l.data_levantamento) AS primeiro_levantamento,
      MAX(l.data_levantamento) AS ultimo_levantamento
    FROM Levantamento l
    JOIN usuarios u ON l.id_usuario = u.id
    GROUP BY u.id, u.nome
    ORDER BY total_levantamentos DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});


// ============================================================
// 3. CONSULTAS DE ANÁLISE TERRITORIAL
// ============================================================

// 3.1 Estabelecimentos por Tipo e Localização
app.get("/relatorios/estabelecimentos-localizacao", (req, res) => {
  const sql = `
    SELECT 
      e.tipo,
      l.zona,
      l.bairro,
      COUNT(*) AS quantidade,
      AVG(
        COALESCE(rh.funcionarios_permanentes, 0) +
        COALESCE(rh.funcionarios_temporarios, 0)
      ) AS media_funcionarios
    FROM Estabelecimento e
    JOIN Localizacao l ON e.id_estabelecimento = l.id_estabelecimento
    JOIN Recursos_Humanos rh ON e.id_estabelecimento = rh.id_estabelecimento
    GROUP BY e.tipo, l.zona, l.bairro
    ORDER BY quantidade DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});

// 3.2 Estabelecimentos com Contato Completo
app.get("/relatorios/contato-completo", (req, res) => {
  const sql = `
    SELECT 
      e.nome_fantasia,
      e.tipo,
      c.telefone,
      c.email,
      c.whatsapp,
      l.endereco,
      l.bairro
    FROM Estabelecimento e
    JOIN Contato c ON e.id_estabelecimento = c.id_estabelecimento
    JOIN Localizacao l ON e.id_estabelecimento = l.id_estabelecimento
    WHERE c.telefone IS NOT NULL 
       OR c.email IS NOT NULL
       OR c.whatsapp IS NOT NULL;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});


// ============================================================
// 4. CONSULTAS DE INFRAESTRUTURA / ACESSIBILIDADE
// ============================================================

// 4.1 Estabelecimentos com Acessibilidade PCD
app.get("/relatorios/pcd", (req, res) => {
  const sql = `
    SELECT 
      e.nome_fantasia,
      e.tipo,
      a.facilidade_pcd,
      a.pessoal_capacitado_pcd,
      a.circulacao_cadeira_rodas,
      a.rampa,
      a.elevador,
      a.sanitario,
      l.possui_sinalizacao_acesso
    FROM Estabelecimento e
    JOIN Acessibilidade a ON e.id_estabelecimento = a.id_estabelecimento
    JOIN Localizacao l ON e.id_estabelecimento = l.id_estabelecimento
    WHERE a.facilidade_pcd = 'Sim'
    ORDER BY e.tipo, e.nome_fantasia;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});


// ============================================================
// 5. CONSULTAS SOCIOECONÔMICAS
// ============================================================

// 5.1 Perfil dos Proprietários
app.get("/relatorios/perfil-proprietarios", (req, res) => {
  const sql = `
    SELECT 
      e.tipo,
      p.genero,
      p.faixa_etaria,
      p.escolaridade,
      p.etnia,
      p.reside_no_municipio,
      COUNT(*) AS quantidade
    FROM Proprietario p
    JOIN Estabelecimento e ON p.id_estabelecimento = e.id_estabelecimento
    GROUP BY 
      e.tipo,
      p.genero,
      p.faixa_etaria,
      p.escolaridade,
      p.etnia,
      p.reside_no_municipio
    ORDER BY quantidade DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});

// 5.2 Emprego gerado por tipo
app.get("/relatorios/empregos-tipo", (req, res) => {
  const sql = `
    SELECT 
      e.tipo,
      COUNT(*) AS total_estabelecimentos,
      SUM(COALESCE(rh.funcionarios_permanentes, 0)) AS total_permanentes,
      SUM(COALESCE(rh.funcionarios_temporarios, 0)) AS total_temporarios,
      SUM(COALESCE(rh.terceirizados, 0)) AS total_terceirizados,
      SUM(
        COALESCE(rh.funcionarios_permanentes, 0) +
        COALESCE(rh.funcionarios_temporarios, 0) +
        COALESCE(rh.terceirizados, 0)
      ) AS total_empregos
    FROM Estabelecimento e
    JOIN Recursos_Humanos rh ON e.id_estabelecimento = rh.id_estabelecimento
    GROUP BY e.tipo
    ORDER BY total_empregos DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ erro: err });
    res.json(rows);
  });
});


// ============================================================
// 6. QUALIDADE DE DADOS
// ============================================================

// 6.1 Levantamentos que precisam de revisão
app.get("/relatorios/levantamentos-revisao", (req, res) => {
  const sql = `
    SELECT 
      l.id_levantamento,
      e.nome_fantasia,
      u.nome AS pesquisador,
      l.data_levantamento,
      l.status,
      r.status AS status_revisao,
      r.comentario
    FROM Levantamento l
    JOIN Estabelecimento e ON l.id_estabelecimento = e.id_estabelecimento
    JOIN usuarios u ON l.id_usuario = u.id
    JOIN Revisao_Levantamento r ON l.id_levantamento = r.id_levantamento
    WHERE 
      l.status = 'Revisão'
      OR r.status = 'Em revisão'
      OR r.status = 'Rejeitado'
    ORDER BY l.data_levantamento DESC;
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 6.2 Estabelecimentos com dados incompletos
app.get("/relatorios/estabelecimentos-incompletos", (req, res) => {
  const sql = `
    SELECT 
      e.id_estabelecimento,
      e.nome_fantasia,
      e.tipo,
      CASE WHEN c.telefone IS NULL THEN 'Sem telefone' ELSE '' END AS falta_telefone,
      CASE WHEN l.latitude IS NULL OR l.longitude IS NULL THEN 'Sem coordenadas' ELSE '' END AS falta_geolocalizacao,
      CASE WHEN p.genero IS NULL THEN 'Sem dados proprietário' ELSE '' END AS falta_proprietario
    FROM Estabelecimento e
    JOIN Contato c ON e.id_estabelecimento = c.id_estabelecimento
    JOIN Localizacao l ON e.id_estabelecimento = l.id_estabelecimento
    JOIN Proprietario p ON e.id_estabelecimento = p.id_estabelecimento
    WHERE 
      c.telefone IS NULL
      OR l.latitude IS NULL
      OR l.longitude IS NULL
      OR p.genero IS NULL;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});


// ============================================================
// 7. RELATÓRIOS ESTRATÉGICOS
// ============================================================

// 7.1 Relatório completo por estabelecimento
app.get("/relatorios/completo-estabelecimento", (req, res) => {
  const sql = `
    SELECT 
      e.id_estabelecimento,
      e.nome_fantasia,
      e.tipo,
      e.atividade_economica,
      l.endereco,
      l.bairro,
      l.zona,
      c.telefone,
      c.email,
      p.genero AS genero_proprietario,
      p.faixa_etaria AS faixa_etaria_proprietario,
      rh.funcionarios_permanentes,
      rh.funcionarios_temporarios,
      cap.capacidade_dia,
      a.facilidade_pcd,
      q.estado_conservacao,
      f.formas_pagamento,
      f.atendimento_lingua_estrangeira
    FROM Estabelecimento e
    JOIN Localizacao l ON e.id_estabelecimento = l.id_estabelecimento
    JOIN Contato c ON e.id_estabelecimento = c.id_estabelecimento
    JOIN Proprietario p ON e.id_estabelecimento = p.id_estabelecimento
    JOIN Recursos_Humanos rh ON e.id_estabelecimento = rh.id_estabelecimento
    JOIN Capacidade cap ON e.id_estabelecimento = cap.id_estabelecimento
    JOIN Acessibilidade a ON e.id_estabelecimento = a.id_estabelecimento
    JOIN Qualificacao q ON e.id_estabelecimento = q.id_estabelecimento
    JOIN Funcionamento f ON e.id_estabelecimento = f.id_estabelecimento
    ORDER BY e.tipo, e.nome_fantasia;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 7.2 Estatísticas gerais do sistema
app.get("/relatorios/estatisticas-uso", (req, res) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
      (SELECT COUNT(*) FROM Pesquisa) AS total_pesquisas,
      (SELECT COUNT(*) FROM Estabelecimento) AS total_estabelecimentos,
      (SELECT COUNT(*) FROM Levantamento) AS total_levantamentos,
      (SELECT COUNT(*) FROM Levantamento WHERE status = 'Concluído') AS levantamentos_concluidos,
      (SELECT COUNT(*) FROM Levantamento WHERE status = 'Validado') AS levantamentos_validados;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows[0]);
  });
});


// ============================================================
// 8. OPERAÇÕES AVANÇADAS
// ============================================================

// 8.1 Estabelecimentos por período de funcionamento
app.get("/relatorios/periodo-funcionamento", (req, res) => {
  const sql = `
    SELECT 
      e.tipo,
      f.periodo_funcionamento,
      f.funcionamento_24h,
      f.funcionamento_feriados,
      COUNT(*) AS quantidade
    FROM Estabelecimento e
    JOIN Funcionamento f ON e.id_estabelecimento = f.id_estabelecimento
    GROUP BY 
      e.tipo,
      f.periodo_funcionamento,
      f.funcionamento_24h,
      f.funcionamento_feriados
    ORDER BY quantidade DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 8.2 Capacidade média por tipo
app.get("/relatorios/capacidade-media", (req, res) => {
  const sql = `
    SELECT 
      e.tipo,
      AVG(CAST(REPLACE(cap.capacidade_dia, ',', '.') AS DECIMAL(10,2))) AS capacidade_media_dia,
      AVG(CAST(REPLACE(cap.pessoas_sentadas, ',', '.') AS DECIMAL(10,2))) AS lugares_sentados_media,
      COUNT(*) AS amostra
    FROM Estabelecimento e
    JOIN Capacidade cap ON e.id_estabelecimento = cap.id_estabelecimento
    WHERE cap.capacidade_dia IS NOT NULL
    GROUP BY e.tipo;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 8.3 Estabelecimentos com certificações
app.get("/relatorios/certificados", (req, res) => {
  const sql = `
    SELECT 
      e.tipo,
      e.nome_fantasia,
      q.certificacao_premiacao,
      q.estado_conservacao
    FROM Estabelecimento e
    JOIN Qualificacao q ON e.id_estabelecimento = q.id_estabelecimento
    WHERE q.certificacao_premiacao IS NOT NULL
      AND q.certificacao_premiacao <> '';
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 8.4 Sinalização turística
app.get("/relatorios/sinalizacao-turistica", (req, res) => {
  const sql = `
    SELECT 
      l.zona,
      l.bairro,
      COUNT(*) AS total_estabelecimentos,
      SUM(CASE WHEN l.possui_sinalizacao_turistica = 'Sim' THEN 1 ELSE 0 END) AS com_sinalizacao,
      ROUND(
        SUM(CASE WHEN l.possui_sinalizacao_turistica = 'Sim' THEN 1 ELSE 0 END) 
        * 100 / COUNT(*),
        2
      ) AS percentual_sinalizado
    FROM Estabelecimento e
    JOIN Localizacao l ON e.id_estabelecimento = l.id_estabelecimento
    GROUP BY l.zona, l.bairro
    ORDER BY percentual_sinalizado DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// ============================================================
// 🚀 INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);
