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
    const syncMobileBar = () => {
      const bounds = bookingSection.getBoundingClientRect();
      mobileBar.hidden = bounds.top < window.innerHeight && bounds.bottom > 0;
    };
    syncMobileBar();
    const bookingObserver = new IntersectionObserver(entries => {
      mobileBar.hidden = entries[0].isIntersecting;
    });
    bookingObserver.observe(bookingSection);
  }
})();
