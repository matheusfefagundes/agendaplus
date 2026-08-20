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
