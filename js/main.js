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
        mainNav.querySelectorAll('.nav-item--dropdown').forEach(function (item) {
          item.classList.remove('is-open');
          var trigger = item.querySelector('.nav-dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  var dropdownItems = document.querySelectorAll('.nav-item--dropdown');
  dropdownItems.forEach(function (item) {
    var trigger = item.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    var closeTimer;

    function openDropdown() {
      clearTimeout(closeTimer);
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      closeTimer = setTimeout(function () {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 120);
    }

    item.addEventListener('mouseenter', openDropdown);
    item.addEventListener('mouseleave', closeDropdown);

    trigger.addEventListener('click', function (e) {
      if (window.innerWidth > 768) return;
      e.preventDefault();
      var isOpen = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      dropdownItems.forEach(function (other) {
        if (other !== item) {
          other.classList.remove('is-open');
          var otherTrigger = other.querySelector('.nav-dropdown-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

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
    var formNote = contactForm.querySelector('.form-note');
    if (formNote && contactForm.querySelector('[disabled]')) {
      return;
    }
    var phoneRe = /^1[3-9]\d{9}$/;
    var nameInput = document.getElementById('name');
    var phoneInput = document.getElementById('phone');
    var nameError = document.getElementById('name-error');
    var phoneError = document.getElementById('phone-error');
    var formSuccess = document.getElementById('form-success');
    var formError = document.getElementById('form-error');
    var submitBtn = document.getElementById('submit-btn');
    var brand = (window.SITE_CONFIG && window.SITE_CONFIG.brand) || '南方全屋定制';

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
        show(formError, '表单服务尚未配置。请在 js/config.js 中填入 Web3Forms Access Key，或直接来厂咨询。');
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
        subject: brand + ' - 在线预约'
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
            show(formError, '提交失败，请稍后重试或直接来厂咨询。');
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
