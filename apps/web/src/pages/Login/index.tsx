import { useState } from 'react';
import { GemLogo } from '../../components/GemLogo';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

function Login({ onLogin }: { onLogin: () => void }) {
  const [tab, setTab] = useState('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)] relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] border-t-[3px] border-t-[var(--color-gold)] rounded-xl px-9 py-10 shadow-[var(--shadow-card)] animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <GemLogo size={40} />
          <h1 className="font-[var(--font-display)] font-black text-2xl text-[var(--color-gold)] tracking-[0.08em] mt-3 leading-none">
            Master-Sheet
          </h1>
          <p className="text-[11px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase mt-1.5">
            Sua plataforma de fichas de RPG
          </p>
        </div>

        <div className="flex rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] mb-7">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] cursor-pointer border-none transition-all duration-200 ' +
                (tab === t
                  ? 'bg-[var(--color-gold)] text-[#121212]'
                  : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]')
              }
            >
              {t === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {tab === 'register' && (
            <Input
              label="Nome"
              type="text"
              placeholder="Seu nome de aventureiro"
            />
          )}
          <Input label="E-mail" type="email" placeholder="joao@email.com" />
          <Input label="Senha" type="password" placeholder="••••••••" />
          {tab === 'register' && (
            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="••••••••"
            />
          )}
        </div>

        <Button
          variant="gold"
          size="lg"
          className="w-full justify-center mt-6"
          onClick={onLogin}
        >
          {tab === 'login' ? '⚔️ Entrar na Plataforma' : '📜 Criar Conta'}
        </Button>

        <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-5">
          Ao entrar, você concorda com os Termos de Aventura ✦
        </p>
      </div>
    </div>
  );
}

export default Login;
