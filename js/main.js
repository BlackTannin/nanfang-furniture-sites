(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav = document.querySelector('.main-nav');
  var contactForm = document.getElementById('contact-form');

  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(function (el) { observer.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  if (contactForm) {
    var phoneRe = /^1[3-9]\d{9}$/;
    var nameInput = document.getElementById('name');
    var phoneInput = document.getElementById('phone');
    var nameError = document.getElementById('name-error');
    var phoneError = document.getElementById('phone-error');
    var formSuccess = document.getElementById('form-success');
    var formError = document.getElementById('form-error');
    var submitBtn = document.getElementById('submit-btn');

    function show(el, msg) {
      if (!el) return;
      el.textContent = msg || '';
      el.hidden = !msg;
    }

    function validate() {
      var ok = true;
      show(nameError, '');
      show(phoneError, '');

      if (!nameInput.value.trim()) {
        show(nameError, '请输入姓名');
        ok = false;
      }
      if (!phoneRe.test(phoneInput.value.trim())) {
        show(phoneError, '请输入正确的11位手机号');
        ok = false;
      }
      return ok;
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      show(formError, '');
      formSuccess.hidden = true;

      if (!validate()) return;

      var config = window.SITE_CONFIG || {};
      var key = config.web3formsKey;

      if (!key) {
        show(formError, '表单服务尚未配置。请在 js/config.js 中填入 Web3Forms Access Key，或直接致电 0512-8888-8888。');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中…';

      var payload = {
        access_key: key,
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        style: document.getElementById('style').value,
        message: document.getElementById('message').value.trim(),
        subject: '心中式家居 - 在线预约'
      };

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            formSuccess.hidden = false;
            contactForm.reset();
          } else {
            show(formError, '提交失败，请稍后重试或直接致电我们。');
          }
        })
        .catch(function () {
          show(formError, '网络异常，请检查连接后重试。');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = '提交预约';
        });
    });
  }
})();
