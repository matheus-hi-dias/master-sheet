import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { api } from '../../../services/api';
import { Button } from '../../../components/ui/Button';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function EmailVerified() {
  const query = useQuery();
  const navigate = useNavigate();
  const status = query.get('status') || 'invalid';
  const message = query.get('message') || '';
  const [email, setEmail] = useState('');

  // analytics event (placeholder)
  console.log('analytics:event', 'email_verification.clicked', { status });

  const handleLogin = () => navigate('/login');
  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Informe o e-mail para reenviar o link');
      return;
    }

    try {
      await api.auth.resendVerification({ email: email.trim() });
      toast.success('Link de verificação reenviado!');
    } catch {
      toast.error('Erro ao reenviar o link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app">
      <div className="max-w-lg w-full bg-bg-card border border-border rounded-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Verificação de E-mail</h2>
        {status === 'success' ? (
          <>
            <p className="mb-4">Seu e-mail foi verificado com sucesso.</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="md" onClick={handleLogin}>
                Fazer login
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() =>
                  navigate(`/email-verify${window.location.search}`)
                }
              >
                Usar verificação manual
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4">Status: {status}</p>
            {message && <p className="mb-4 text-sm text-muted">{message}</p>}
            <input
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 mb-4"
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
            <div className="flex justify-center gap-2">
              <Button variant="gold" size="md" onClick={handleResend}>
                Reenviar link
              </Button>
              <Button variant="outline" size="md" onClick={handleLogin}>
                Ir para login
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() =>
                  navigate(`/email-verify${window.location.search}`)
                }
              >
                Verificar com token
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailVerified;
