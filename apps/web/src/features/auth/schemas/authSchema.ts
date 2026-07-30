import { z } from 'zod';

export const passwordRulesText =
  'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial.';

const passwordRules = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/\d/, 'A senha deve conter ao menos um número')
  .regex(/[^A-Za-z\d]/, 'A senha deve conter ao menos um caractere especial');

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema
  .extend({
    name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
    confirmPassword: z.string().min(1, 'A confirmação de senha é obrigatória'),
    password: passwordRules,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
