import spinnerHtmlString from './spinner';

class Modal {
  constructor () {
    // Elements
    this.modalElement = document.getElementsByClassName('modal')[0];
    this.modalElementContent = document.getElementsByClassName('modal__content')[0];
    this.modalElementCloseBtn = document.getElementsByClassName('modal__close-btn')[0];
    this.loadingFormElement = document.getElementsByClassName('form__load-screen')[0];

    // Variables
    this.isInitialModal = true;

    // General Initialization
    // Inject spinner html into Modal load screen
    this.loadingFormElement.insertAdjacentHTML('beforeend', spinnerHtmlString);
    // Delay & Animate initial modal appearance
    setTimeout(this.launchFirstModal.bind(this), 400);

    // Initialize event handlers
    this.events();
  }

  events () {
    // Clicking the x close modal buttons
    // this.closeModalButton.click(this.closeModal.bind(this));
    // Key push event listener
    document.addEventListener('keyup', this.keyPressHandler.bind(this));
  }

  isModalHidden () {
    const modalState = this.modalElement.classList.contains('modal--hidden');
    return modalState;
  }

  launchFirstModal () {
    this.modalElementContent.classList.remove('modal__content--hidden');
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
    thisModal.loadingFormElement.classList.remove('form__load-screen--visible');
  }

  keyPressHandler (event) {
    if (event.keyCode === 27 && this.isInitialModal === false) {
      this.closeModal(this);
    }
  }

  openFormLoadScreen () {
    this.loadingFormElement.classList.add('form__load-screen--visible');
  }
}

export default new Modal();
