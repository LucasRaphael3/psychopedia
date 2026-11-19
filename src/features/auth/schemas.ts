import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Use de 3 a 24 caracteres: letras, números ou _."),
  email: z.string().trim().toLowerCase().max(254, "E-mail muito longo.").pipe(z.email("E-mail inválido.")),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(72, "Senha muito longa."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido.")),
  password: z.string().min(1, "Informe sua senha.").max(72),
});

export type FormState =
  | { errors?: Partial<Record<string, string[]>>; message?: string; values?: Record<string, string> }
  | undefined;
