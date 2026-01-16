export function generateInvoice(data, options = {}) {
  options = { stamp: false, signature: false, ...options };

  const nds = data?.nds ?? 0;
  const updStatus = nds > 0 ? 1 : 2;
  const seller = data?.seller ?? {};
  const payer = data?.payer ?? {};
  const consigner = data?.consigner ?? {};
  const consignee = data?.consignee ?? {};
  const app = data?.app ?? {};
  const details = data?.details ?? [];
  const isIp = (seller.inn?.length === 12);
  const consignerStr = [consigner.name, consigner.address].filter(Boolean).join(', ');
  const consigneeStr = [consignee.name, consignee.address].filter(Boolean).join(', ');
  const positionTitle = isIp ? 'Индивидуальный предприниматель' : '';
  const amountWithoutNds = fmtMoney(data?.total_amount_without_nds ?? 0);
  const ndsAmount = fmtMoney(data?.total_nds_amount ?? 0);
  const amount = fmtMoney(data?.total_amount ?? 0);

  // Функция форматирования денег
  function fmtMoney(value, digits = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
      return '';
    }
    return value.toLocaleString('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }
  // Функция форматирования чисел
  function fmtNumber(value, digits = 3) {
    if (typeof value !== 'number' || isNaN(value)) {
      return '';
    }
    return value.toLocaleString('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).replace(/0+$/g, '').replace(/,$/g, '');
  }

  // Генерация строк таблицы позиций
  let detailsRows = '';
  if (details.length === 0) {
    detailsRows = '<tr><td colspan="6" class="doc-text-center">Нет позиций в счёте.</td></tr>';
  } else {
    details.forEach((item, index) => {
      detailsRows += `
  <tr>
    <td class="doc-text-center">${index + 1}</td>
    <td>${item?.name ?? ''}</td>
    <td class="doc-text-center">${item?.mU ?? ''}</td>
    <td class="doc-text-center">${fmtNumber(item?.qty ?? '')}</td>
    <td class="doc-money">${fmtMoney(item?.price ?? '')}</td>
    <td class="doc-money">${fmtMoney(item?.amount ?? 0)}</td>
  </tr>`;
    });
  }

  // Подписи и изображения
  const signatureSrc = seller.signature_base64 ? seller.signature_base64 : '';
  const stampSrc = seller.stamp_base64 ? seller.stamp_base64 : '';

  const html = `<style>
.doc {
  --doc-table-line-color: black;
  --doc-text-size-largest: 16pt;
  --doc-text-size-large: 14pt;
  --doc-text-size: 12pt;
  --doc-text-size-smaller: 11pt;
  --doc-text-size-small: 10pt;
  --doc-text-size-smallest: 8pt;

  --doc-table-line-width: 1px;
  --doc-table-line-bold-width: 2px;


  font-family: Arial, Helvetica, sans-serif;
  font-weight: normal;
  font-size: var(--doc-text-size);
  line-height: normal;

}

.doc [data-is-ip]:not([data-is-ip=true]) {
  display: none;
}

.doc-layout-table {
  padding: 0;
  margin: 0;
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;

  /* background-color: rgba(255, 0, 0, 0.1); */
}

:where(.doc-layout-table--real) td,
:where(.doc-layout-table--real) th {
  border: var(--doc-table-line-width) solid var(--doc-table-line-color);
  padding-left: .5mm;
  padding-right: .5mm;
}

.doc-layout-table--real td,
.doc-layout-table--real th {
  padding-left: 1mm;
  padding-right: 1mm;
  padding-top: 1mm;
  padding-bottom: 1mm;
}

.doc-layout-table--real th {
  text-align: center;
  font-weight: inherit;
}

:where(.doc-layout-table) td,
:where(.doc-layout-table) th {
  margin: 0;
  padding: 0;
}

.doc-p {
  margin: 0;
  margin-top: 0.5em;
}

.doc-h1 {
  font-size: var(--doc-text-size-largest);
  margin: 1em auto;
}

.doc-text-bold {
  font-weight: bold;
}

.doc-text-normal {
  font-size: var(--doc-text-size);
}

.doc-text-small {
  font-size: var(--doc-text-size-small);
}

.doc-text-smaller {
  font-size: var(--doc-text-size-smaller);
}

.doc-text-smallest {
  font-size: var(--doc-text-size-smallest);
}

.doc-text-center {
  text-align: center;
}

.doc-text-right {
  text-align: right;
}

.doc-padding-top {
  padding-top: 1mm;
}

.doc-padding-left {
  padding-left: 1mm;
}

.doc-padding-right {
  padding-right: 1mm;
}

.doc-border {
  border: var(--doc-table-line-width) solid var(--doc-table-line-color);
}

.doc-border-bold {
  border: var(--doc-table-line-bold-width) solid var(--doc-table-line-color);
}

.doc-border-bottom {
  border-bottom: var(--doc-table-line-width) solid var(--doc-table-line-color);
}

.doc-border-left {
  border-left: var(--doc-table-line-width) solid var(--doc-table-line-color);
}

.doc-border-left-bold {
  border-left: var(--doc-table-line-bold-width) solid var(--doc-table-line-color);
}

.doc-border-bottom-bold {
  border-bottom: var(--doc-table-line-bold-width) solid var(--doc-table-line-color);
}

.doc-valign-baseline {
  vertical-align: baseline;
}

.doc-valign-top {
  vertical-align: top;
}

.doc-valign-bottom {
  vertical-align: bottom;
}

.doc-valign-middle {
  vertical-align: middle;
}

.doc-field {
  width: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
}

.doc-field__label-word {
  display: inline-block;
  flex: 0 0 auto;
  margin-right: 0.25em;
  /* Simulates natural word spacing */
  white-space: nowrap;
}

.doc-field__value {
  flex: 1 1 auto;
  min-width: 50px;
  width: auto;
  margin-left: 0.5em;
  align-self: flex-end;
}

.doc-field__suffix {
  flex-shrink: 0;
}

.doc-money {
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;
}

.doc-image-container {
  position: relative;
}

.doc-image {
  display: block;
  position: absolute;
  pointer-events: none;
  mix-blend-mode: multiply;
}

.doc-image--stamp {
  width: 43mm;
  transform: rotate(-15grad);
}

/* Скрыть, если атрибут src пустой */
img.doc-image[src=""] {
  display: none;
}

/* Скрыть, если атрибут src вообще отсутствует */
img.doc-image:not([src]) {
  display: none;
}

</style>
<article class="doc">
  <table class="doc-layout-table doc-layout-table--real">
    <tbody>
      <tr>
        <td rowspan="2" style="border-bottom-color: transparent;" class="doc-valign-top">${seller.bank}</td>
        <td>БИК</td>
        <td>${seller.bik}</td>
      </tr>
      <tr>
        <td rowspan="2">Сч. №</td>
        <td rowspan="2" class="doc-valign-top">${seller.ks}</td>
      </tr>
      <tr>
        <td>Банк получателя</td>
      </tr>
      <tr>
        <td>ИНН ${seller.inn}</td>
        <td rowspan="3" class="doc-valign-top">Сч. №</td>
        <td rowspan="3" class="doc-valign-top">${seller.rs}</td>
      </tr>
      <tr>
        <td style="height: 2em; border-bottom-color: transparent" class="doc-valign-top">${seller.name}</td>
      </tr>
      <tr>
        <td>Получатель</td>
      </tr>
    <tbody>
  </table>

  <h1 class="doc-h1 doc-text-center doc-text-bold">Счет на оплату <span style="margin-right: 0.2ch;">№</span>${data?.nomer ?? ''} от ${data?.inv_date ?? ''}</h1>

  <p class="doc-p">Продавец: <span class="doc-text-bold">${seller.name}</span>, ИНН ${seller.inn ?? ''}, адрес ${seller.address ?? ''}.</p>
  <p class="doc-p doc-text-small">Покупатель: <span class="doc-text-bold">${payer.name}</span>, ИНН ${payer.inn ?? ''}${(payer.inn ?? '').length === 12 ? '' : `, КПП ${payer.kpp ?? ''}`}, адрес ${payer.address}.</p>
  <p class="doc-p doc-text-small">Грузоотправитель: <span class="doc-text-bold">${consigner.name}</span>, ИНН ${consigner.inn ?? ''}${(consigner.inn ?? '').length === 12 ? '' : `, КПП ${consigner.kpp ?? ''}`}, адрес ${consigner.address}.</p>
  <p class="doc-p doc-text-small">Грузополучатель: <span class="doc-text-bold">${consignee.name}</span>, ИНН ${consignee.inn ?? ''}${(consignee.inn ?? '').length === 12 ? '' : `, КПП ${consignee.kpp ?? ''}`}, адрес ${consignee.address}.</p>
  <p class="doc-p">Основание: Заявка № ${app.nomer ?? ''}${app.base_code} от ${app.date_reg ?? ''}, груз: ${app.cargo ?? ''} (${fmtNumber(app.weight ?? '')}&nbsp;кг|${fmtNumber(app.volume ?? '')}&nbsp;м³${app.count_pcs ? `|${fmtNumber(app.count_pcs)}` : ''}).</p>

  <table style="margin-top: 0.5em;" class="doc-layout-table doc-layout-table--real doc-text-smaller">
    <thead>
      <tr>
        <th style="width: 6ch; height: 10mm;">№ п/п</th>
        <th>Наименование услуги</th>
        <th style="width: 8ch;">Ед. изм.</th>
        <th style="width: 8ch;">Кол-во</th>
        <th style="width: 10ch;">Цена</th>
        <th style="width: 12ch;">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${detailsRows}
      <tr>
        <td colspan="5" style="border-left-color: transparent; border-bottom-color: transparent;" class="doc-text-right">Итого:</td>
        <td class="doc-money">${amount}</td>
      </tr>
      <tr>
        <td colspan="5" style="border-left-color: transparent; border-bottom-color: transparent;" class="doc-text-right">В том числе НДС${nds > 0 ? ` ${nds}%` : ''}:</td>
        <td class="${nds > 0 ? 'doc-money' : 'doc-text-center'}">${nds > 0 ? ndsAmount : 'без ндс'}</td>
      </tr>
      <tr>
        <td colspan="5" style="border-left-color: transparent; border-bottom-color: transparent;" class="doc-text-right doc-text-bold">Всего к оплате:</td>
        <td class="doc-money doc-text-bold">${amount}</td>
      </tr>
    </tbody>
  </table>

  <table style="margin-top: 20mm;" class="doc-layout-table">
    <tbody>
      <tr>
        <td style="width: 10mm;"> </td>
        <td style="">Индивидуальный предприниматель</td>
        <td style="width: 37mm;" class="doc-border-bottom doc-image-container">
          <img style="top: -12mm; left: 5mm; width: 27mm" src="${options.signature ? signatureSrc : ''}" alt="рукописная подпись" class="doc-image doc-image--signature">
        </td>
        <td style="width: 10mm;"> </td>
        <td style="width: 40mm;" class="doc-valign-bottom">${seller.ceo ?? ''}</td>
        <td style="width: 10mm;"> </td>
      </tr>
    </tbody>
  </table>
  <div style="margin-left: 15mm;" class="doc-image-container">
    М.П.
    <img style="left: -10mm; top: -10mm;" src="${options.stamp ? stampSrc : ''}" alt="оттиск печати" class="doc-image doc-image--stamp">
  </div>


</article>`;

  return { title: 'Счет', orientation: 'portrait', html };
}
