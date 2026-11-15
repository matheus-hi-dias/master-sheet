import { fireEvent, render, screen } from '@testing-library/react';

import { Button } from '@master-sheet/ui/button';
import { DotTracker } from '@master-sheet/ui/dot-tracker';
import { GemLogo } from '@master-sheet/ui/gem-logo';
import { Tag } from '@master-sheet/ui/tag';

describe('shared Button', () => {
  it('renders its label and forwards clicks', () => {
    const onClick = jest.fn();

    render(
      <Button variant="gold" size="sm" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toBeEnabled();
  });

  it('exposes the disabled state', () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

describe('shared Tag', () => {
  it('marks the active filter chip as pressed', () => {
    const onClick = jest.fn();

    render(
      <Tag active onClick={onClick}>
        D&amp;D
      </Tag>,
    );

    const tag = screen.getByRole('button', { name: 'D&D' });

    expect(tag).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(tag);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the display variant without a pressed state', () => {
    render(<Tag variant="display">official</Tag>);

    expect(
      screen.getByRole('button', { name: 'official' }),
    ).not.toHaveAttribute('aria-pressed');
  });
});

describe('shared GemLogo', () => {
  it('is decorative by default', () => {
    const { container } = render(<GemLogo size={24} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('exposes an accessible name when requested', () => {
    render(<GemLogo accessibilityLabel="Master-Sheet" />);

    expect(
      screen.getByRole('img', { name: 'Master-Sheet' }),
    ).toBeInTheDocument();
  });
});

describe('shared DotTracker', () => {
  it('renders the controlled value and reports toggles', () => {
    const onChange = jest.fn();

    render(<DotTracker value={2} maxDots={5} onChange={onChange} />);

    expect(screen.getByText('2/5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dot 1 of 5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Dot 3 of 5' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dot 4 of 5' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('clears the last filled dot when it is pressed again', () => {
    const onChange = jest.fn();

    render(<DotTracker value={3} maxDots={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dot 3 of 5' }));

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
