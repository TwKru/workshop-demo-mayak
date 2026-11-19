(function (root) {
  function buildMessage(d, config) {
    const question = d.service === 'Вопрос мастеру';
    return [(config.isDemo ? 'ТЕСТОВАЯ ЗАЯВКА — демонстрация сайта' : 'Заявка с сайта «' + config.businessName + '»'),
      'Имя: ' + (d.name || 'Не указано'), 'Телефон: ' + (d.phone || 'Не указан'), 'Способ ответа: ' + (d.contactMethod || 'WhatsApp'),
      'Услуга: ' + d.service, 'Автомобиль: ' + (d.car || 'Не указан'),
      ...(question ? [] : ['Размер: ' + d.size, 'Колёс: ' + d.wheels, 'Комплект: ' + d.wheelSet, 'Желаемая дата: ' + (d.date ? d.date.split('-').reverse().join('.') : 'Не выбрана'), 'Время: ' + d.time]),
      'Комментарий: ' + (d.comment || '—'),
      config.isDemo ? 'Это тест, не запись в действующую мастерскую.' : 'Прошу подтвердить время и стоимость.'].join('\n');
  }
  function buildWhatsAppUrl(d, config) {
    if (!/^7[0-9]{10}$/.test(config.whatsappNumber)) throw new Error('Не настроен номер получателя.');
    const url = new URL('https://wa.me/' + config.whatsappNumber);
    url.searchParams.set('text', buildMessage(d, config));
    return url.href;
  }
  root.MayakRequest = {buildMessage, buildWhatsAppUrl};
})(globalThis);
