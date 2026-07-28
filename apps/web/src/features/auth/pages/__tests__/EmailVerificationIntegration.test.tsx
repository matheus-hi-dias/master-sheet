import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EmailVerified from '../EmailVerified';

// Mock the API service
jest.mock('../../../../services/api', () => ({
  api: {
    auth: {
      resendVerification: jest.fn().mockResolvedValue({ message: 'ok' }),
    },
  },
}));

import { api } from '../../../../services/api';

describe('Email Verification Web Integration', () => {
  const renderWithStatus = (status: string, message?: string) => {
    const search = `?status=${status}${message ? `&message=${encodeURIComponent(message)}` : ''}`;
    return render(
      <MemoryRouter initialEntries={[`/email-verified${search}`]}>
        <Routes>
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/email-verify" element={<div>Manual Verify Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows success UI when API redirects with status=success', async () => {
    renderWithStatus('success');

    expect(await screen.findByText(/Seu e-mail foi verificado com sucesso/i)).toBeInTheDocument();
    
    // Test navigation to login
    const loginBtn = screen.getByRole('button', { name: /Fazer login/i });
    fireEvent.click(loginBtn);
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it('shows expired UI and allows resending email', async () => {
    renderWithStatus('expired', 'Token expirado');

    expect(await screen.findByText(/Status: expired/i)).toBeInTheDocument();
    expect(screen.getByText(/Token expirado/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/Seu e-mail/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const resendBtn = screen.getByRole('button', { name: /Reenviar link/i });
    fireEvent.click(resendBtn);

    expect(api.auth.resendVerification).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('shows invalid UI and allows navigating to manual verification', async () => {
    renderWithStatus('invalid', 'Token inválido');

    expect(await screen.findByText(/Status: invalid/i)).toBeInTheDocument();
    
    const manualBtn = screen.getByRole('button', { name: /Verificar com token/i });
    fireEvent.click(manualBtn);
    
    expect(screen.getByText(/Manual Verify Page/i)).toBeInTheDocument();
  });
});
