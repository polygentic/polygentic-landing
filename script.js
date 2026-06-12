document.addEventListener('DOMContentLoaded', () => {
  // Copyright year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Form elements
  const form = document.getElementById('contact-form');
  const confirmationEl = document.getElementById('confirmation');
  const errorEl = document.getElementById('form-error');

  if (!form) return;

  // TODO: Replace with your deployed Google Apps Script URL
  const APPS_SCRIPT_URL = '';

  // Validation rules
  const rules = {
    name: {
      test: v => v.trim().length > 0,
      message: 'Please enter your name.'
    },
    email: {
      test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Please enter a valid email address.'
    },
    message: {
      test: v => v.trim().length > 0,
      message: 'Please enter a message.'
    }
  };

  // Validate a single field, return true if valid
  function validateField(name) {
    const field = form.elements[name];
    const rule = rules[name];
    const errorSpan = field.closest('.form-field').querySelector('.form-error');
    const valid = rule.test(field.value);

    field.classList.toggle('input-error', !valid);
    errorSpan.textContent = valid ? '' : rule.message;
    return valid;
  }

  // Validate all fields, return true if all valid
  function validateAll() {
    let valid = true;
    Object.keys(rules).forEach(name => {
      if (!validateField(name)) valid = false;
    });
    return valid;
  }

  // Clear errors on input
  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    field.addEventListener('input', () => {
      field.classList.remove('input-error');
      field.closest('.form-field').querySelector('.form-error').textContent = '';
    });
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    if (!validateAll()) return;

    form.classList.add('form-loading');
    form.querySelector('button').disabled = true;

    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      _gotcha: form.elements._gotcha.value
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.result === 'success') {
        form.hidden = true;
        confirmationEl.hidden = false;
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch {
      errorEl.hidden = false;
      form.classList.remove('form-loading');
      form.querySelector('button').disabled = false;
    }
  });
});
