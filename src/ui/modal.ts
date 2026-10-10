import gsap from 'gsap';
import { D, EASE } from '../anim/easings';
import { $ } from './dom';

interface ModalOpts {
  canOpen: () => boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Modal próprio de "Encerrar partida" (nada de confirm()). */
export function initModal({ canOpen, onOpenChange, onConfirm }: ModalOpts) {
  const layer = $('#modal');
  const card = $('.modal', layer);
  const cancel = $('#modal-cancel');
  const confirm = $('#modal-confirm');
  let open = false;
  let returnFocus: HTMLElement | null = null;

  const setOpen = (v: boolean) => {
    open = v;
    onOpenChange(v);
  };

  function show() {
    if (open || !canOpen()) return;
    setOpen(true);
    returnFocus = document.activeElement as HTMLElement | null;
    gsap.timeline()
      .set(layer, { autoAlpha: 1 })
      .fromTo(layer, { backgroundColor: 'rgba(0,0,0,0)' }, { backgroundColor: 'rgba(0,0,0,0.62)', duration: D(0.25) }, 0)
      .fromTo(card, { scale: 0.85, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: D(0.35), ease: EASE.bounce }, 0);
    cancel.focus({ preventScroll: true });
  }

  function close(then?: () => void) {
    if (!open) return;
    gsap.timeline({
      onComplete: () => {
        setOpen(false);
        returnFocus?.focus?.({ preventScroll: true });
        then?.();
      },
    })
      .to(card, { scale: 0.9, opacity: 0, duration: D(0.18), ease: EASE.in }, 0)
      .to(layer, { autoAlpha: 0, duration: D(0.2) }, 0);
  }

  cancel.addEventListener('click', () => close());
  confirm.addEventListener('click', () => close(onConfirm));
  layer.addEventListener('click', (e) => {
    if (e.target === layer) close();
  });
  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') close();
    // Mantém o foco dentro do modal
    if (e.key === 'Tab') {
      e.preventDefault();
      (document.activeElement === cancel ? confirm : cancel).focus();
    }
  });

  return { show };
}
