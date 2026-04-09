import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { GemLogo } from '../../../components/ui/GemLogo';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from '../schemas/authSchema';

export function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const loginFn = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(tab === 'login' ? loginSchema : registerSchema),
  });

  const onSubmit = (data: LoginFormData | RegisterFormData) => {
    console.log('Form data to dispatch:', data);
    if (tab === 'login') {
      toast.success('Bem-vindo de volta, Herói!');
      loginFn('mocked-jwt-token');
      navigate('/dashboard');
    } else {
      toast.success('Conta criada com sucesso! Redirecionando...');
      loginFn('mocked-jwt-token');
      navigate('/dashboard');
    }
  };

  const handleTabChange = (t: 'login' | 'register') => {
    setTab(t);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app relative overflow-hidden">
      {/* Background glassmorphism effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 bg-bg-card border border-border border-t-[3px] border-t-gold rounded-xl px-9 py-10 shadow-card animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <GemLogo size={40} />
          <h1 className="font-display font-black text-2xl text-gold tracking-[0.08em] mt-3 leading-none">
            Master-Sheet
          </h1>
          <p className="text-[11px] text-text-muted tracking-[0.2em] uppercase mt-1.5">
            Sua plataforma de fichas de RPG
          </p>
        </div>

        <div className="flex rounded-card overflow-hidden border border-border border-t-[3px] border-t-gold mb-7">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={
                'flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] cursor-pointer border-none transition-all duration-200 ' +
                (tab === t
                  ? 'bg-gold text-text-main'
                  : 'bg-transparent text-text-muted hover:text-text-main')
              }
            >
              {t === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {tab === 'register' && (
            <Input
              label="Nome"
              type="text"
              placeholder="Seu nome de aventureiro"
              {...register('name')}
              error={(errors as FieldErrors<RegisterFormData>).name?.message}
            />
          )}

          <Input
            label="E-mail"
            type="email"
            placeholder="joao@email.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            key={`pwd-input-${tab}`}
            label="Senha"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          {tab === 'register' && (
            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={
                (errors as FieldErrors<RegisterFormData>).confirmPassword
                  ?.message
              }
            />
          )}

          <Button
            variant="gold"
            size="lg"
            className="w-full mt-2"
            type="submit"
          >
            {tab === 'login' ? '⚔️ Entrar na Plataforma' : '📜 Criar Conta'}
          </Button>
        </form>

        <p className="text-center text-[11px] text-text-muted mt-5">
          Ao entrar, você concorda com os Termos de Aventura ✦
        </p>
      </div>
    </div>
  );
}
