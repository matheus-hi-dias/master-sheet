import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { Button } from '../../../components/ui/Button';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export function EmailVerify() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [localToken, setLocalToken] = useState(token);

  useEffect(() => {
    if (token) {
      // attempt POST fallback automatically
      handleVerify(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(t: string) {
    setLoading(true);
    try {
      const res = await api.auth.verifyEmail({ token: t });
      // If API returns status, map it; otherwise assume success
      const status = (res && (res as any).status) || 'success';
      navigate(`/email-verified?status=${status}`);
    } catch (err: any) {
      const msg = err?.message || 'invalid';
      if (msg.toLowerCase().includes('expired')) {
        navigate('/email-verified?status=expired');
      } else {
        navigate(
          '/email-verified?status=invalid&message=' + encodeURIComponent(msg),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app">
      <div className="max-w-md w-full bg-bg-card border border-border rounded-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Verificar e-mail</h2>
        <p className="text-sm text-text-muted mb-4">
          Você pode abrir este link diretamente do e-mail ou colar o token
          abaixo e enviar.
        </p>
        <input
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 mb-4"
          type="text"
          placeholder="Cole aqui o token"
          value={localToken}
          onChange={e => setLocalToken(e.target.value)}
        />
        <div className="flex justify-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => handleVerify(localToken)}
            disabled={loading || !localToken}
          >
            {loading ? 'Verificando...' : 'Verificar e-mail'}
          </button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/login')}
          >
            Ir para login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerify;
