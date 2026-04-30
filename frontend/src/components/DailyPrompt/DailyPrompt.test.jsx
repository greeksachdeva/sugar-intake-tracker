import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyPrompt from './DailyPrompt.jsx';

describe('DailyPrompt', () => {
  it('renders the question text', () => {
    render(<DailyPrompt onAnswer={vi.fn()} />);
    expect(
      screen.getByText('Did you eat sugar today?'),
    ).toBeInTheDocument();
  });

  it('renders Yes and No buttons', () => {
    render(<DailyPrompt onAnswer={vi.fn()} />);
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
  });

  it('calls onAnswer(true) when Yes is clicked', async () => {
    const onAnswer = vi.fn().mockResolvedValue(undefined);
    render(<DailyPrompt onAnswer={onAnswer} />);

    await userEvent.click(screen.getByRole('button', { name: /yes/i }));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) when No is clicked', async () => {
    const onAnswer = vi.fn().mockResolvedValue(undefined);
    render(<DailyPrompt onAnswer={onAnswer} />);

    await userEvent.click(screen.getByRole('button', { name: /no/i }));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('shows confirmation after answering Yes', async () => {
    const onAnswer = vi.fn().mockResolvedValue(undefined);
    render(<DailyPrompt onAnswer={onAnswer} />);

    await userEvent.click(screen.getByRole('button', { name: /yes/i }));

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-message')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Recorded: You consumed sugar today/),
    ).toBeInTheDocument();
  });

  it('shows confirmation after answering No', async () => {
    const onAnswer = vi.fn().mockResolvedValue(undefined);
    render(<DailyPrompt onAnswer={onAnswer} />);

    await userEvent.click(screen.getByRole('button', { name: /no/i }));

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-message')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Recorded: No sugar today/),
    ).toBeInTheDocument();
  });

  it('disables buttons during submission', async () => {
    // Create a promise we control to keep the component in submitting state
    let resolveAnswer;
    const onAnswer = vi.fn(
      () => new Promise((resolve) => { resolveAnswer = resolve; }),
    );

    render(<DailyPrompt onAnswer={onAnswer} />);

    // Click Yes — this starts the async submission
    const yesButton = screen.getByRole('button', { name: /yes/i });
    const noButton = screen.getByRole('button', { name: /no/i });

    // Start the click but don't await it fully
    const clickPromise = userEvent.click(yesButton);

    // Wait for buttons to become disabled
    await waitFor(() => {
      expect(yesButton).toBeDisabled();
      expect(noButton).toBeDisabled();
    });

    // Resolve the promise to finish submission
    resolveAnswer();
    await clickPromise;

    // After submission completes, buttons should be enabled again
    await waitFor(() => {
      expect(yesButton).not.toBeDisabled();
      expect(noButton).not.toBeDisabled();
    });
  });

  it('shows current status when todayEntry exists with sugar consumed', () => {
    const todayEntry = { date: '2025-01-15', sugarConsumed: true };
    render(<DailyPrompt onAnswer={vi.fn()} todayEntry={todayEntry} />);

    const status = screen.getByTestId('current-status');
    expect(status).toBeInTheDocument();
    expect(status.textContent).toContain('Yes');
  });

  it('shows current status when todayEntry exists with no sugar', () => {
    const todayEntry = { date: '2025-01-15', sugarConsumed: false };
    render(<DailyPrompt onAnswer={vi.fn()} todayEntry={todayEntry} />);

    const status = screen.getByTestId('current-status');
    expect(status).toBeInTheDocument();
    expect(status.textContent).toContain('No');
  });

  it('hides current status after answering', async () => {
    const todayEntry = { date: '2025-01-15', sugarConsumed: true };
    const onAnswer = vi.fn().mockResolvedValue(undefined);
    render(<DailyPrompt onAnswer={onAnswer} todayEntry={todayEntry} />);

    // Status should be visible initially
    expect(screen.getByTestId('current-status')).toBeInTheDocument();

    // Answer the prompt
    await userEvent.click(screen.getByRole('button', { name: /no/i }));

    // Current status should be hidden, confirmation should show
    await waitFor(() => {
      expect(screen.queryByTestId('current-status')).not.toBeInTheDocument();
      expect(screen.getByTestId('confirmation-message')).toBeInTheDocument();
    });
  });

  it('does not show current status when no todayEntry', () => {
    render(<DailyPrompt onAnswer={vi.fn()} />);
    expect(screen.queryByTestId('current-status')).not.toBeInTheDocument();
  });
});
