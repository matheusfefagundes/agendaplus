import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { Pool, type PoolClient } from "pg";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SENHA_DEMO = process.env.SEED_PASSWORD ?? "Agenda123!";

type UsuarioDemo = {
  nome: string;
  email: string;
  tipo: "admin" | "cliente";
  telefone?: string;
  nascimento?: string;
  observacoes?: string;
};

const USUARIOS: UsuarioDemo[] = [
  { nome: "Administrador Agenda+", email: "admin@agendaplus.local", tipo: "admin" },
  {
    nome: "Ana Souza",
    email: "ana@agendaplus.local",
    tipo: "cliente",
    telefone: "(47) 99911-2233",
    nascimento: "1992-04-18",
    observacoes: "Prefere pressão moderada.",
  },
  {
    nome: "Carla Mendes",
    email: "carla@agendaplus.local",
    tipo: "cliente",
    telefone: "(47) 99822-3344",
    nascimento: "1987-09-02",
    observacoes: "Sensibilidade na região cervical.",
  },
  {
    nome: "Mariana Lima",
    email: "mariana@agendaplus.local",
    tipo: "cliente",
    telefone: "(47) 99733-4455",
    nascimento: "1998-12-11",
  },
];

const SERVICOS = [
  { nome: "Massagem Relaxante", descricao: "Técnica suave para aliviar tensão e estresse.", duracao: 60, valor: 120 },
  { nome: "Massagem Terapêutica", descricao: "Atendimento focado em dores e tensões musculares.", duracao: 60, valor: 150 },
  { nome: "Drenagem Linfática", descricao: "Massagem que estimula o sistema linfático.", duracao: 50, valor: 130 },
  { nome: "Limpeza de Pele", descricao: "Higienização profunda e cuidado facial.", duracao: 75, valor: 160 },
];

const HORARIOS = [
  ...[1, 2, 3, 4, 5].flatMap((diaSemana) => [
    { diaSemana, inicio: "09:00", fim: "12:00", intervalo: 15 },
    { diaSemana, inicio: "13:30", fim: "18:30", intervalo: 15 },
  ]),
  { diaSemana: 6, inicio: "09:00", fim: "13:00", intervalo: 15 },
];

function dataUtil(deslocamento: number): string {
  const data = new Date();
  data.setHours(12, 0, 0, 0);
  const passo = deslocamento >= 0 ? 1 : -1;
  let restantes = Math.abs(deslocamento);
  while (restantes > 0) {
    data.setDate(data.getDate() + passo);
    const dia = data.getDay();
    if (dia !== 0 && dia !== 6) restantes -= 1;
  }
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

async function criarUsuario(client: PoolClient, usuario: UsuarioDemo, senhaHash: string) {
  const existente = await client.query<{ id: string }>(
    "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)",
    [usuario.email],
  );
  let usuarioId = existente.rows[0]?.id;
  if (!usuarioId) {
    const resultado = await client.query<{ id: string }>(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [usuario.nome, usuario.email, senhaHash, usuario.tipo],
    );
    usuarioId = resultado.rows[0].id;
  }

  if (usuario.tipo === "cliente") {
    const cliente = await client.query<{ id: string }>(
      "SELECT id FROM clientes WHERE usuario_id = $1",
      [usuarioId],
    );
    if (!cliente.rows[0]) {
      await client.query(
        `INSERT INTO clientes (usuario_id, telefone, data_nascimento, observacoes_clinicas)
         VALUES ($1, $2, $3, $4)`,
        [usuarioId, usuario.telefone ?? null, usuario.nascimento ?? null, usuario.observacoes ?? null],
      );
    }
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const senhaHash = await bcrypt.hash(SENHA_DEMO, 12);

    for (const usuario of USUARIOS) {
      await criarUsuario(client, usuario, senhaHash);
    }

    for (const servico of SERVICOS) {
      const existente = await client.query("SELECT 1 FROM servicos WHERE nome = $1", [servico.nome]);
      if (!existente.rows[0]) {
        await client.query(
          `INSERT INTO servicos (nome, descricao, duracao_minutos, valor)
           VALUES ($1, $2, $3, $4)`,
          [servico.nome, servico.descricao, servico.duracao, servico.valor],
        );
      }
    }

    for (const horario of HORARIOS) {
      const existente = await client.query(
        `SELECT 1 FROM horarios_disponibilidade
         WHERE dia_semana = $1 AND hora_inicio = $2 AND hora_fim = $3`,
        [horario.diaSemana, horario.inicio, horario.fim],
      );
      if (!existente.rows[0]) {
        await client.query(
          `INSERT INTO horarios_disponibilidade
             (dia_semana, hora_inicio, hora_fim, intervalo_minutos)
           VALUES ($1, $2, $3, $4)`,
          [horario.diaSemana, horario.inicio, horario.fim, horario.intervalo],
        );
      }
    }

    const clientes = await client.query<{ id: string; email: string }>(
      `SELECT c.id, u.email FROM clientes c JOIN usuarios u ON u.id = c.usuario_id
       WHERE u.email = ANY($1::text[])`,
      [USUARIOS.filter((u) => u.tipo === "cliente").map((u) => u.email)],
    );
    const servicos = await client.query<{ id: string; nome: string; duracao_minutos: number }>(
      "SELECT id, nome, duracao_minutos FROM servicos WHERE nome = ANY($1::text[])",
      [SERVICOS.map((s) => s.nome)],
    );
    const clientePorEmail = new Map(clientes.rows.map((c) => [c.email, c.id]));
    const servicoPorNome = new Map(servicos.rows.map((s) => [s.nome, s]));
    const agendamentos = [
      { cliente: "ana@agendaplus.local", servico: "Massagem Relaxante", data: dataUtil(1), hora: "09:00", status: "confirmado", marcador: "seed:demo:ana-futuro" },
      { cliente: "carla@agendaplus.local", servico: "Drenagem Linfática", data: dataUtil(2), hora: "14:00", status: "pendente", marcador: "seed:demo:carla-futuro" },
      { cliente: "mariana@agendaplus.local", servico: "Limpeza de Pele", data: dataUtil(3), hora: "16:00", status: "confirmado", marcador: "seed:demo:mariana-futuro" },
      { cliente: "ana@agendaplus.local", servico: "Massagem Terapêutica", data: dataUtil(-2), hora: "10:00", status: "concluido", marcador: "seed:demo:ana-historico" },
    ];

    for (const agendamento of agendamentos) {
      const existente = await client.query("SELECT 1 FROM agendamentos WHERE observacoes = $1", [agendamento.marcador]);
      if (existente.rows[0]) continue;
      const servico = servicoPorNome.get(agendamento.servico);
      const clienteId = clientePorEmail.get(agendamento.cliente);
      if (!servico || !clienteId) throw new Error("Dados de demonstração incompletos.");
      const inicio = new Date(`${agendamento.data}T${agendamento.hora}:00-03:00`);
      const fim = new Date(inicio.getTime() + servico.duracao_minutos * 60_000);
      await client.query(
        `INSERT INTO agendamentos
           (cliente_id, servico_id, data_hora_inicio, data_hora_fim, status, observacoes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [clienteId, servico.id, inicio, fim, agendamento.status, agendamento.marcador],
      );
    }

    await client.query("COMMIT");
    console.log("Banco populado com dados de demonstração.");
    console.log("Admin: admin@agendaplus.local");
    console.log("Cliente: ana@agendaplus.local");
    console.log(`Senha das contas de demonstração: ${SENHA_DEMO}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main().catch((error) => {
  console.error("Falha ao popular o banco:", error);
  process.exitCode = 1;
});
