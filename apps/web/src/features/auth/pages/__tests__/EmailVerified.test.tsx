import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../../../../services/api', () => ({
  api: {
    auth: {
      resendVerification: jest.fn().mockResolvedValue({ message: 'ok' }),
    },
  },
}));

import { api } from '../../../../services/api';
import EmailVerified from '../EmailVerified';

describe('EmailVerified', () => {
  it('renders success UI and navigation buttons', async () => {
    render(
      <MemoryRouter initialEntries={["/email-verified?status=success"]}>
        <Routes>
          <Route path="/email-verified" element={<EmailVerified />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Seu e-mail foi verificado com sucesso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fazer login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Usar verificação manual|Verificar com token|Abrir fallback/i })).toBeInTheDocument();
  });

  it('calls resendVerification when email provided', async () => {
    render(
      <MemoryRouter initialEntries={["/email-verified?status=invalid"]}>
        <Routes>
          <Route path="/email-verified" element={<EmailVerified />} />
        </Routes>
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Seu e-mail/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  test@example.com  ' } });

    const resend = screen.getByRole('button', { name: /Reenviar link/i });
    fireEvent.click(resend);

    expect(api.auth.resendVerification).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
