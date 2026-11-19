(() => {
  const prices = {R13:1700,R14:1700,R15:1800,R16:1900,R17:2200,R18:2400,R19:2700,R20:3000,R21:3300};
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const {normalizePhone, formatPhone} = globalThis.MayakContact;
  const status = document.querySelector('#form-status');
  const submit = document.querySelector('#submit-request');
  const config = window.MAYAK_DEMO;
  const {buildMessage, buildWhatsAppUrl} = globalThis.MayakRequest;
  const money = amount => new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  const contactHints = {
    Telegram:'Для Telegram укажите номер, по которому вас можно найти в приложении. Если поиск по номеру закрыт, выберите другой способ связи.',
    WhatsApp:'Укажите номер, на котором у вас зарегистрирован WhatsApp.',
    SMS:'Мастер сможет ответить обычным SMS на указанный номер.',
    'Звонок':'Вы выбираете обратный звонок. Если неудобно говорить, выберите сообщение в мессенджере или SMS.'
  };
  function updateSummary() {
    const service = form.elements.service.value;
    const question = service === 'Вопрос мастеру';
    for (const key of ['size','wheels','wheelSet','date','time']) form.elements[key].closest('.field').hidden = question;
    form.elements.car.required = !question;
    form.elements.date.required = !question;
    form.elements.comment.required = question;
    form.elements.car.closest('.field').firstChild.textContent = question ? 'Автомобиль (необязательно)' : 'Автомобиль';
    document.querySelector('#summary-service').textContent = service + (question ? '' : ' · ' + form.elements.size.value);
    document.querySelector('#summary-details').textContent = question ? 'Опишите вопрос и выберите, как получить ответ.' : form.elements.wheels.value + ' колёс · ' + form.elements.wheelSet.value;
    const price = prices[form.elements.size.value];
    document.querySelector('#summary-price').textContent = service === 'Сезонная смена шин' && price ? 'В прайсе ' + form.elements.size.value + ' — ' + money(price) + '. Объём и итоговую стоимость подтвердит мастер.' : question ? 'На вопросы отвечает мастер. Визит не бронируется автоматически.' : 'Стоимость и возможность ремонта определяются после осмотра.';
    document.querySelector('#contact-hint').textContent = contactHints[form.elements.contactMethod.value];
  }
  function selectSize(size) {
    document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
    document.querySelectorAll('[data-price-row]').forEach(r => r.classList.toggle('selected', r.dataset.priceRow === size));
    document.querySelector('#selected-price').textContent = money(prices[size]);
    document.querySelector('#selected-size').textContent = 'Легковой шиномонтаж · ' + size;
    document.querySelector('#book-selected').textContent = 'Оставить заявку на ' + size;
    form.elements.size.value = size;
    updateSummary();
  }
  document.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => selectSize(b.dataset.size)));
  document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {form.elements.service.value = a.dataset.service; updateSummary();}));
  document.querySelector('#book-selected').addEventListener('click', () => {form.elements.service.value = 'Сезонная смена шин';updateSummary();});
  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);
  form.elements.phone.addEventListener('input', () => form.elements.phone.setCustomValidity(''));
  form.elements.phone.addEventListener('blur', () => {form.elements.phone.value = formatPhone(form.elements.phone.value);});
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  form.elements.date.min = today;
  updateSummary();
  function formData() {
    const d = Object.fromEntries(new FormData(form));
    Object.keys(d).forEach(k => {d[k] = String(d[k]).trim();});
    d.phone = normalizePhone(d.phone);
    return d;
  }
  function showPreview(d) {
    document.querySelector('#request-text').textContent = buildMessage(d, config);
    document.querySelector('#request-preview').hidden = false;
  }
  document.querySelector('#preview-request').addEventListener('click', () => {
    showPreview(formData());
    status.textContent = 'Проверьте текст. Ничего не отправлено.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    form.elements.phone.setCustomValidity(normalizePhone(form.elements.phone.value) ? '' : 'Введите номер: +7 и 10 цифр, либо номер начиная с 8.');
    if (!form.reportValidity()) return;
    const d = formData();
    if (d.website) return;
    const question = d.service === 'Вопрос мастеру';
    if (!d.name || (!question && !d.car) || (question && !d.comment)) {status.textContent = 'Заполните обязательные поля без пробелов вместо текста.';return;}
    if (!question && d.date < today) {status.textContent = 'Выберите сегодняшнюю или будущую дату.';return;}
    showPreview(d);
    try {
      const destination = buildWhatsAppUrl(d, config);
      status.textContent = 'Открываем WhatsApp с готовым текстом. Чтобы отправить заявку, нажмите «Отправить» в чате. Время визита ещё не подтверждено.';
      window.location.assign(destination);
    } catch (error) {status.textContent = error.message;}
  });
  document.querySelector('#copy-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.querySelector('#request-text').textContent);
      status.textContent = 'Текст скопирован. Автоматической отправки не было.';
    } catch {
      const range = document.createRange(); range.selectNodeContents(document.querySelector('#request-text'));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      status.textContent = 'Текст выделен: нажмите Ctrl+C, чтобы скопировать.';
    }
  });
  const mobileBar = document.querySelector('.mobile-call');
  const bookingSection = document.querySelector('#booking');
  if (mobileBar && bookingSection && 'IntersectionObserver' in window) {
    const setMobileBarHidden = hidden => {
      mobileBar.classList.toggle('mobile-call--hidden', hidden);
      mobileBar.inert = hidden;
      mobileBar.setAttribute('aria-hidden', String(hidden));
    };
    const syncMobileBar = () => {
      const bounds = bookingSection.getBoundingClientRect();
      setMobileBarHidden(bounds.top < window.innerHeight && bounds.bottom > 0);
    };
    syncMobileBar();
    const bookingObserver = new IntersectionObserver(entries => {
      setMobileBarHidden(entries[0].isIntersecting);
    });
    bookingObserver.observe(bookingSection);
  }
  let scrollFrame = 0;
  const cancelSectionScroll = () => { cancelAnimationFrame(scrollFrame); scrollFrame = 0; };
  window.addEventListener('wheel', cancelSectionScroll, {passive:true});
  window.addEventListener('touchstart', cancelSectionScroll, {passive:true});
  window.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Escape'].includes(event.key)) cancelSectionScroll();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = link.hash ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : document.documentElement;
    if (!target) return;
    event.preventDefault();
    cancelSectionScroll();
    const start = window.scrollY;
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const finish = Math.min(maximum, Math.max(0, start + target.getBoundingClientRect().top - offset));
    if (location.hash !== link.hash) history.pushState(null, '', link.hash || location.pathname + location.search);
    const focusTarget = () => {
      if (target !== document.documentElement) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
      }
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(finish-start) < 2) {
      window.scrollTo({top:finish,behavior:'instant'}); focusTarget(); return;
    }
    const duration = Math.min(700, Math.max(300, Math.abs(finish-start)*0.08));
    const began = performance.now();
    const step = now => {
      const progress = Math.min(1, (now-began)/duration);
      const eased = progress < 0.5 ? 4*progress*progress*progress : 1-Math.pow(-2*progress+2,3)/2;
      window.scrollTo({top:start+(finish-start)*eased,behavior:'instant'});
      if (progress < 1) scrollFrame = requestAnimationFrame(step);
      else { scrollFrame=0; focusTarget(); }
    };
    scrollFrame = requestAnimationFrame(step);
  });
})();
