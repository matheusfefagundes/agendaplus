import { z } from "zod";

export const registerSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo.").max(150),
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(150),
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(150),
    senha: z.string().min(1, "Informe sua senha.").max(72),
  })
  .strict();

export const servicoSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome do serviço.").max(150),
    descricao: z.string().trim().max(2000).nullable().optional(),
    duracaoMinutos: z.number().int().positive("A duração precisa ser maior que zero."),
    valor: z.number().nonnegative("O valor não pode ser negativo."),
  })
  .strict();

export const servicoUpdateSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome do serviço.").max(150).optional(),
    descricao: z.string().trim().max(2000).nullable().optional(),
    duracaoMinutos: z.number().int().positive("A duração precisa ser maior que zero.").optional(),
    valor: z.number().nonnegative("O valor não pode ser negativo.").optional(),
    ativo: z.boolean().optional(),
  })
  .strict();

export const clienteUpdateSchema = z
  .object({
    telefone: z.string().trim().max(20).nullable().optional(),
    observacoesClinicas: z.string().trim().max(4000).nullable().optional(),
    ativo: z.boolean().optional(),
  })
  .strict();

export const perfilSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo.").max(150),
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(150),
  })
  .strict();

export const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(72),
  })
  .strict();

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const horarioSchema = z
  .object({
    diaSemana: z.number().int().min(0, "Selecione um dia da semana.").max(6),
    horaInicio: z.string().regex(HORA_REGEX, "Informe um horário válido (HH:MM)."),
    horaFim: z.string().regex(HORA_REGEX, "Informe um horário válido (HH:MM)."),
    intervaloMinutos: z.number().int().min(0).max(240),
  })
  .strict()
  .refine((data) => data.horaFim > data.horaInicio, {
    message: "O horário final precisa ser depois do inicial.",
    path: ["horaFim"],
  });

export const horarioUpdateSchema = z
  .object({
    horaInicio: z.string().regex(HORA_REGEX, "Informe um horário válido (HH:MM).").optional(),
    horaFim: z.string().regex(HORA_REGEX, "Informe um horário válido (HH:MM).").optional(),
    intervaloMinutos: z.number().int().min(0).max(240).optional(),
    ativo: z.boolean().optional(),
  })
  .strict();

export const agendamentoStatusSchema = z
  .object({
    status: z.enum(["pendente", "confirmado", "cancelado", "concluido"]),
  })
  .strict();
