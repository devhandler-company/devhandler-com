const updateStepCounter = (form, stepNumber) => {
  const stepCount = form.querySelectorAll('.step').length;
  form.querySelector('.step-counter').innerText = `Step ${stepNumber}/${stepCount}`;
};

const nextButtonListener = (form, nextButton, backButton, submitButton) => {
  nextButton.addEventListener('click', () => {
    const currentStep = parseInt(form.dataset.currentStep, 10);

    let isStepValid = true;

    form.querySelectorAll(`.step[data-step-number="${currentStep}"] input`).forEach((input) => {
      isStepValid = isStepValid && input.reportValidity();
    });

    if (!isStepValid) {
      return;
    }

    const nextStep = parseInt(form.dataset.currentStep, 10) + 1;
    form.dataset.currentStep = nextStep;

    updateStepCounter(form, nextStep);

    form.querySelector(`.step[data-step-number="${currentStep}"]`).classList.add('hidden');
    form.querySelector(`.step[data-step-number="${nextStep}"]`).classList.remove('hidden');

    if (form.dataset.currentStep === form.dataset.totalSteps) {
      submitButton.classList.remove('hidden');
      nextButton.classList.add('hidden');
      backButton.classList.remove('hidden');
    }
  });
};

const backButtonListener = (form, nextButton, backButton, submitButton) => {
  backButton.addEventListener('click', () => {
    const currentStep = parseInt(form.dataset.currentStep, 10);
    const prevStep = parseInt(form.dataset.currentStep, 10) - 1;

    updateStepCounter(form, prevStep);

    form.querySelector(`.step[data-step-number="${currentStep}"]`).classList.add('hidden');
    form.querySelector(`.step[data-step-number="${prevStep}"]`).classList.remove('hidden');

    form.dataset.currentStep = prevStep;
    if (form.dataset.currentStep === '1') {
      submitButton.classList.add('hidden');
      backButton.classList.add('hidden');
      nextButton.classList.remove('hidden');
    }
  });
};

const processManySteps = (form, navigation, stepCount) => {
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.classList.add('hidden');

  form.dataset.totalSteps = stepCount;
  form.dataset.currentStep = 1;

  updateStepCounter(form, 1);

  const nextButton = document.createElement('button');
  nextButton.classList.add('button');
  nextButton.innerText = 'Next';
  nextButton.tabIndex = 0;

  const backButton = document.createElement('button');
  backButton.classList.add('button');
  backButton.classList.add('color-gray');
  backButton.classList.add('hidden');
  backButton.innerText = 'Back';
  backButton.tabIndex = 0;

  navigation.append(nextButton);
  navigation.append(backButton);
  navigation.append(form.querySelector('[type="submit"]'));

  nextButtonListener(form, nextButton, backButton, submitButton);
  backButtonListener(form, nextButton, backButton, submitButton);
};

// eslint-disable-next-line import/prefer-default-export
export const adjustFormToMultistep = (form) => {
  const stepCounterContainer = document.createElement('div');
  stepCounterContainer.classList.add('step-counter-container');

  const stepCounter = document.createElement('span');
  stepCounter.classList.add('step-counter');
  stepCounterContainer.append(stepCounter);

  const steps = document.createElement('div');
  steps.classList.add('steps');

  const navigation = document.createElement('div');
  navigation.classList.add('steps-navigation');

  form.append(stepCounterContainer);
  form.append(steps);
  form.append(navigation);

  const stepCount = form.querySelectorAll('[data-step-number]').length;

  form.querySelectorAll('[data-step-number]').forEach((stepContainer, index) => {
    const currentStepNumber = stepContainer.dataset.stepNumber;
    form.querySelectorAll(`[data-step="${currentStepNumber}"]`).forEach((stepElement) => {
      stepContainer.append(stepElement);
    });
    if (index !== 0) {
      stepContainer.classList.add('hidden');
    }
    steps.append(stepContainer);
  });

  if (stepCount > 1) {
    processManySteps(form, navigation, stepCount);
  }
};
