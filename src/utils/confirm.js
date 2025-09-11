let confirmCounter = 0;

export const confirmAction = ({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
} = {}) => {
  return new Promise((resolve) => {
    const id = `confirm_${Date.now()}_${confirmCounter++}`;
    const onAnswer = (e) => {
      if (e?.detail?.id !== id) return;
      window.removeEventListener('oox:confirm:answered', onAnswer);
      resolve(!!e.detail.result);
    };
    window.addEventListener('oox:confirm:answered', onAnswer, { once: true });
    try {
      window.dispatchEvent(new CustomEvent('oox:confirm:open', {
        detail: { id, title, message, confirmText, cancelText, variant }
      }));
    } catch {
      resolve(window.confirm(message));
    }
  });
};

export const confirmDelete = (message = 'Are you sure you want to delete this item?') =>
  confirmAction({ title: 'Confirm Delete', message, confirmText: 'Delete', cancelText: 'Cancel', variant: 'danger' });

export const confirmLogout = (message = 'Are you sure you want to log out?') =>
  confirmAction({ title: 'Log Out', message, confirmText: 'Log out', cancelText: 'Stay', variant: 'warning' });

