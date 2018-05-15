import spinnerHtmlString from './spinner';

class Modal {
  constructor () {
    // Elements
    this.modalElement = document.getElementsByClassName('modal')[0];
    this.modalElementHeadlines = document.getElementsByClassName('modal__headlines')[0];
    this.modalElementContent = document.getElementsByClassName('modal__content')[0];
    this.modalElementCloseBtn = document.getElementsByClassName('modal__close-btn')[0];
    this.formLoadingScreen = document.getElementsByClassName('form__load-screen')[0];

    // Variables
    this.isInitialModal = true;

    // General Initialization
    // Inject spinner html into Modal load screen
    this.formLoadingScreen.insertAdjacentHTML('beforeend', spinnerHtmlString);
    // Delay & Animate initial modal appearance
    setTimeout(this.launchFirstModal.bind(this), 350);

    // Initialize event handlers
    this.events();
  }

  events () {
    // Key push event listener
    document.addEventListener('keyup', this.keyPressHandler.bind(this));
  }

  launchFirstModal () {
    this.modalElementContent.classList.remove('modal__content--hidden');
    this.modalElementHeadlines.classList.add('modal__headlines--visible-background');
  }

  openFormLoadingMode () {
    this.formLoadingScreen.classList.add('form__load-screen--visible');
  }

  openModal () {
    // Make modal close button visible if first time modal is manually opened
    if (this.isInitialModal === true) {
      this.isInitialModal = false;
      this.modalElementCloseBtn.classList.remove('modal__close-btn--hidden');
    }
    this.modalElement.classList.remove('modal--hidden');
  }

  closeModal (thisModal) {
    // Hide entire modal
    thisModal.modalElement.classList.add('modal--hidden');
    // Hide load screen within modal
    thisModal.formLoadingScreen.classList.remove('form__load-screen--visible');
  }

  keyPressHandler (event) {
    // Allow closing of modal with ESC key
    if (event.keyCode === 27 && this.isInitialModal === false) {
      this.closeModal(this);
    }
  }
}

export default new Modal();
