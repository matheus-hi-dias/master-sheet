import { render, screen } from '@testing-library/react-native';
import VerifyEmailScreen from '@/app/auth/verify-email';
import { api } from '@/services/api';

jest.mock('@/services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ token: 'test-token' }),
  useRouter: () => ({ replace: jest.fn() }),
}));

const mockPost = api.post as jest.Mock;

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies the token and shows the success state', async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    render(<VerifyEmailScreen />);

    expect(
      await screen.findByText(/E-mail verificado com sucesso/i),
    ).toBeTruthy();
    expect(mockPost).toHaveBeenCalledWith('/auth/verify-email', {
      token: 'test-token',
    });
  });

  it('shows the API error message when verification fails', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Token expirado' } },
    });

    render(<VerifyEmailScreen />);

    expect(await screen.findByText(/Token expirado/i)).toBeTruthy();
  });
});
