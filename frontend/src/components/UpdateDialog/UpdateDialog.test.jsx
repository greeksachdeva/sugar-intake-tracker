import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdateDialog from './UpdateDialog.jsx';

const TEST_DATE = new Date(2025, 0, 15); // January 15, 2025

const defaultProps = {
  date: TEST_DATE,
  currentEntry: null,
  onUpdate: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

function renderDialog(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<UpdateDialog {...props} />);
}

describe('UpdateDialog', () => {
  describe('rendering', () => {
    it('renders the dialog with title', () => {
      renderDialog();
      expect(screen.getByText('Update Sugar Status')).toBeInTheDocument();
    });

    it('displays the formatted date', () => {
      renderDialog();
      const dateEl = screen.getByTestId('dialog-date');
      expect(dateEl).toBeInTheDocument();
      // Should contain the month, day, and year
      expect(dateEl.textContent).toContain('January');
      expect(dateEl.textContent).toContain('15');
      expect(dateEl.textContent).toContain('2025');
    });

    it('renders Yes and No buttons', () => {
      renderDialog();
      expect(
        screen.getByRole('button', { name: /yes/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /no/i }),
      ).toBeInTheDocument();
    });

    it('renders a Cancel button', () => {
      renderDialog();
      expect(
        screen.getByRole('button', { name: /close dialog/i }),
      ).toBeInTheDocument();
    });

    it('has correct ARIA attributes for accessibility', () => {
      renderDialog();
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toHaveAttribute('role', 'dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('current status display', () => {
    it('shows current status when entry exists with sugar consumed', () => {
      renderDialog({
        currentEntry: { date: '2025-01-15', sugarConsumed: true },
      });
      const status = screen.getByTestId('dialog-current-status');
      expect(status).toBeInTheDocument();
      expect(status.textContent).toContain('Sugar consumed');
    });

    it('shows current status when entry exists with no sugar', () => {
      renderDialog({
        currentEntry: { date: '2025-01-15', sugarConsumed: false },
      });
      const status = screen.getByTestId('dialog-current-status');
      expect(status).toBeInTheDocument();
      expect(status.textContent).toContain('No sugar');
    });

    it('does not show current status when no entry exists', () => {
      renderDialog({ currentEntry: null });
      expect(
        screen.queryByTestId('dialog-current-status'),
      ).not.toBeInTheDocument();
    });
  });

  describe('update submission', () => {
    it('calls onUpdate(true) when Yes is clicked', async () => {
      const onUpdate = vi.fn().mockResolvedValue(undefined);
      renderDialog({ onUpdate });

      await userEvent.click(screen.getByRole('button', { name: /yes/i }));

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(true);
    });

    it('calls onUpdate(false) when No is clicked', async () => {
      const onUpdate = vi.fn().mockResolvedValue(undefined);
      renderDialog({ onUpdate });

      await userEvent.click(screen.getByRole('button', { name: /no/i }));

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(false);
    });
  });

  describe('loading state', () => {
    it('disables all buttons during submission', async () => {
      let resolveUpdate;
      const onUpdate = vi.fn(
        () => new Promise((resolve) => { resolveUpdate = resolve; }),
      );

      renderDialog({ onUpdate });

      const yesButton = screen.getByRole('button', { name: /yes/i });
      const noButton = screen.getByRole('button', { name: /no/i });
      const cancelButton = screen.getByRole('button', {
        name: /close dialog/i,
      });

      const clickPromise = userEvent.click(yesButton);

      await waitFor(() => {
        expect(yesButton).toBeDisabled();
        expect(noButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });

      resolveUpdate();
      await clickPromise;

      await waitFor(() => {
        expect(yesButton).not.toBeDisabled();
        expect(noButton).not.toBeDisabled();
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it('shows saving text on buttons during submission', async () => {
      let resolveUpdate;
      const onUpdate = vi.fn(
        () => new Promise((resolve) => { resolveUpdate = resolve; }),
      );

      renderDialog({ onUpdate });

      const yesButton = screen.getByRole('button', { name: /yes/i });

      const clickPromise = userEvent.click(yesButton);

      await waitFor(() => {
        expect(yesButton.textContent).toContain('Saving');
      });

      resolveUpdate();
      await clickPromise;
    });
  });

  describe('closing dialog', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const onClose = vi.fn();
      renderDialog({ onClose });

      await userEvent.click(
        screen.getByRole('button', { name: /close dialog/i }),
      );

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', async () => {
      const onClose = vi.fn();
      renderDialog({ onClose });

      const overlay = screen.getByTestId('dialog-overlay');
      await userEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when dialog content is clicked', async () => {
      const onClose = vi.fn();
      renderDialog({ onClose });

      const dialog = screen.getByTestId('update-dialog');
      await userEvent.click(dialog);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
