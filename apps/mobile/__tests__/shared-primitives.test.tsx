import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@master-sheet/ui/button';
import { DotTracker } from '@master-sheet/ui/dot-tracker';
import { GemLogo } from '@master-sheet/ui/gem-logo';
import { Tag } from '@master-sheet/ui/tag';

describe('shared native Button', () => {
  it('renders its label and forwards presses', () => {
    const onPress = jest.fn();

    render(<Button onPress={onPress}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });

    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the disabled state', () => {
    render(<Button disabled>Save</Button>);

    expect(
      screen.getByRole('button', { name: 'Save' }).props.accessibilityState,
    ).toEqual({ disabled: true });
  });
});

describe('shared native Tag', () => {
  it('marks the active filter chip as selected', () => {
    const onPress = jest.fn();

    render(
      <Tag active onPress={onPress}>
        D&amp;D
      </Tag>,
    );

    const tag = screen.getByRole('button', { name: 'D&D' });

    expect(tag.props.accessibilityState).toEqual({ selected: true });

    fireEvent.press(tag);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the display variant without a selected state', () => {
    render(<Tag variant="display">official</Tag>);

    expect(screen.getByText('official')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'official' })).toBeNull();
  });
});

describe('shared native GemLogo', () => {
  it('is hidden from accessibility by default', () => {
    render(<GemLogo testID="gem" />);

    expect(screen.getByTestId('gem').props.accessible).toBe(false);
    expect(screen.getByTestId('gem').props.accessibilityLabel).toBeUndefined();
  });

  it('exposes an accessible name when requested', () => {
    render(<GemLogo accessibilityLabel="Master-Sheet" testID="gem" />);

    const logo = screen.getByLabelText('Master-Sheet');

    expect(logo.props.accessibilityRole).toBe('image');
    expect(logo.props.accessible).toBe(true);
  });
});

describe('shared native DotTracker', () => {
  it('renders the controlled value and reports toggles', () => {
    const onChange = jest.fn();

    render(<DotTracker value={2} maxDots={5} onChange={onChange} />);

    expect(screen.getByText('2/5')).toBeTruthy();
    expect(
      screen.getByLabelText('Dot 1 of 5').props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      screen.getByLabelText('Dot 3 of 5').props.accessibilityState,
    ).toEqual({ selected: false });

    fireEvent.press(screen.getByLabelText('Dot 4 of 5'));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('clears the last filled dot when it is pressed again', () => {
    const onChange = jest.fn();

    render(<DotTracker value={3} maxDots={5} onChange={onChange} />);

    fireEvent.press(screen.getByLabelText('Dot 3 of 5'));

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
