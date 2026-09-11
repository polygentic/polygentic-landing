document.addEventListener('DOMContentLoaded', () => {
  // Page-load timestamp; the backend rejects submissions made too quickly.
  const loadedAt = Date.now();

  // Copyright year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Form elements
  const form = document.getElementById('contact-form');
  const confirmationEl = document.getElementById('confirmation');
  const errorEl = document.getElementById('form-error');

  if (!form) return;

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzBCV_N0njWkj0tCw98frXm1TnaY9GI1OVFkwY4QMMB3gvjnKN0Z4cUl-t76-aSVEQsKA/exec';

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
      _gotcha: form.elements._gotcha.value,
      _elapsed: Date.now() - loadedAt
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
        throw new Error(data.message || 'submission_failed');
      }
    } catch (err) {
      const text = errorEl.querySelector('.error-text');
      if (text) {
        text.textContent = err && err.message === 'rate_limited'
          ? 'Too many messages right now. Please try again in a little while.'
          : 'Something went wrong. Please try again.';
      }
      errorEl.hidden = false;
      form.classList.remove('form-loading');
      form.querySelector('button').disabled = false;
    }
  });
});
