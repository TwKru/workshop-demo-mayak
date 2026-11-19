(function (root) {
  function normalizePhone(value) {
    if (typeof value !== 'string' || !/^[+\d\s()\-]+$/.test(value) || /\+/.test(value.trim().slice(1))) return '';
    let digits = value.replace(/\D/g, '');
    if (digits.length === 10) digits = '7' + digits;
    if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
    return /^7[0-9]{10}$/.test(digits) ? '+' + digits : '';
  }
  function formatPhone(value) {
    const phone = normalizePhone(value);
    return phone ? phone.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 ($1) $2-$3-$4') : value;
  }
  root.MayakContact = {normalizePhone, formatPhone};
})(globalThis);
