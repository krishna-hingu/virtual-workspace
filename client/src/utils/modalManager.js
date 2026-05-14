class ModalManager {
  constructor() {
    this.activeModals = new Set();
    this.modalStack = [];
    this.escHandler = null;
    this.init();
  }

  init() {
    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.modalStack.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        this.closeTopModal();
      }
    };
    document.addEventListener('keydown', this.escHandler, true);
  }

  registerModal(modalId, onClose) {
    // Only register if not already active
    if (!this.activeModals.has(modalId)) {
      this.activeModals.add(modalId);
      this.modalStack.push({ id: modalId, onClose });
      console.log(`Modal registered: ${modalId}`, this.modalStack);
    }
  }

  unregisterModal(modalId) {
    // Only unregister if actually active
    if (this.activeModals.has(modalId)) {
      this.activeModals.delete(modalId);
      this.modalStack = this.modalStack.filter(modal => modal.id !== modalId);
      console.log(`Modal unregistered: ${modalId}`, this.modalStack);
    }
  }

  closeTopModal() {
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack[this.modalStack.length - 1];
      console.log(`Closing modal via ESC: ${topModal.id}`);
      topModal.onClose?.();
      this.unregisterModal(topModal.id);
    }
  }

  closeModal(modalId) {
    const modal = this.modalStack.find(m => m.id === modalId);
    if (modal) {
      modal.onClose?.();
      this.unregisterModal(modalId);
    }
  }

  closeAllModals() {
    while (this.modalStack.length > 0) {
      this.closeTopModal();
    }
  }

  getActiveModals() {
    return Array.from(this.activeModals);
  }

  hasActiveModal(modalId) {
    return this.activeModals.has(modalId);
  }

  getModalCount() {
    return this.modalStack.length;
  }

  destroy() {
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler, true);
      this.escHandler = null;
    }
    this.activeModals.clear();
    this.modalStack = [];
  }
}

// Singleton instance
const modalManager = new ModalManager();

export default modalManager;
