import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const GlobalConfirm = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({ id: null, title: 'Confirm', message: 'Are you sure?', confirmText: 'Confirm', cancelText: 'Cancel', variant: 'danger' });

  useEffect(() => {
    const onOpen = (e) => {
      const detail = e.detail || {};
      setConfig({
        id: detail.id,
        title: detail.title || 'Confirm',
        message: detail.message || 'Are you sure?',
        confirmText: detail.confirmText || 'Confirm',
        cancelText: detail.cancelText || 'Cancel',
        variant: detail.variant || 'danger',
      });
      setOpen(true);
    };
    window.addEventListener('oox:confirm:open', onOpen);
    return () => window.removeEventListener('oox:confirm:open', onOpen);
  }, []);

  const answer = (result) => {
    setOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('oox:confirm:answered', { detail: { id: config.id, result } }));
    } catch {}
  };

  return (
    <Modal show={open} onHide={() => answer(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{config.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {config.message}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => answer(false)}>
          {config.cancelText}
        </Button>
        <Button variant={config.variant} onClick={() => answer(true)}>
          {config.confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GlobalConfirm;

