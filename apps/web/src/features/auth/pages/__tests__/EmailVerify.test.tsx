import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../../../../services/api', () => ({
  api: {
    auth: {
      verifyEmail: jest.fn().mockResolvedValue({ status: 'success' }),
    },
  },
}));

import { api } from '../../../../services/api';
import EmailVerify from '../EmailVerify';

describe('EmailVerify', () => {
  it('auto-posts token and navigates to email-verified', async () => {
    render(
      <MemoryRouter initialEntries={["/email-verify?token=abc123"]}>
        <Routes>
          <Route path="/email-verify" element={<EmailVerify />} />
          <Route path="/email-verified" element={<div>VERIFIED-STUB</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(api.auth.verifyEmail).toHaveBeenCalledWith({ token: 'abc123' }));
    expect(await screen.findByText('VERIFIED-STUB')).toBeInTheDocument();
  });

  it('allows manual token submit', async () => {
    render(
      <MemoryRouter initialEntries={["/email-verify"]}>
        <Routes>
          <Route path="/email-verify" element={<EmailVerify />} />
          <Route path="/email-verified" element={<div>VERIFIED-STUB</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Cole aqui o token/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /Verificar e-mail/i });

    fireEvent.change(input, { target: { value: 'manual-token' } });
    fireEvent.click(button);

    await waitFor(() => expect(api.auth.verifyEmail).toHaveBeenCalledWith({ token: 'manual-token' }));
    expect(await screen.findByText('VERIFIED-STUB')).toBeInTheDocument();
  });
});
