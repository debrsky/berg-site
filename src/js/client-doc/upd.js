export function generateUPD(data, options = {}) {
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

  // Функция форматирования денег (из исходного скрипта)
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
    detailsRows = '<tr><td colspan="16" class="upd-text-center">Нет позиций в счёте.</td></tr>';
  } else {
    details.forEach((item, index) => {
      detailsRows += `
  <tr>
    <td></td>
    <td class="upd-border-left-bold">${index + 1}</td>
    <td>${item?.name ?? ''}</td>
    <td></td>
    <td class="upd-text-center">${item?.mUcode ?? ''}</td>
    <td class="upd-text-center">${item?.mU ?? ''}</td>
    <td class="upd-text-center">${fmtNumber(item?.qty ?? '')}</td>
    <td class="upd-money">${fmtMoney(item?.price_without_nds ?? 0, 4)}</td>
    <td class="upd-money">${fmtMoney(item?.amount_without_nds ?? 0)}</td>
    <td class="upd-text-center">--</td>
    <td class="upd-text-center">${nds === 0 ? '--' : `${nds}%`}</td>
    <td class="${nds === 0 ? 'upd-text-center' : 'upd-money'}">${nds === 0 ? '--' : fmtMoney(item?.nds_amount ?? 0)}</td>
    <td class="upd-money">${fmtMoney(item?.amount ?? 0)}</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>`;
    });
  }

  // Итоговая строка
  const totalRow = `
  <tr>
    <td style="border-left-color: transparent; border-bottom-color: transparent;"></td>
    <td colspan="7" style="border-bottom-color: transparent;" class="upd-border-left-bold upd-text-right upd-padding-right">Всего к оплате (9)</td>
    <td class="upd-money upd-text-bold">${amountWithoutNds}</td>
    <td class="upd-text-center upd-valign-middle">--</td>
    <td class="upd-text-center upd-valign-middle">x</td>
    <td class="${nds === 0 ? 'upd-text-center' : 'upd-money upd-text-bold'}">${nds === 0 ? '--' : ndsAmount}</td>
    <td class="upd-money upd-text-bold">${amount}</td>
    <td colspan="3" style="border-right-color: transparent; border-bottom-color: transparent;"></td>
  </tr>`;

  // Подписи и изображения
  const signatureSrc = seller.signature_base64 ? seller.signature_base64 : '';
  const stampSrc = seller.stamp_base64 ? seller.stamp_base64 : '';

  const html = `<style>
.upd {
  --upd-table-line-color: black;
  --upd-text-size: 8pt;
  --upd-text-size-smaller: 7pt;
  --upd-text-size-small: 6pt;
  --upd-text-size-smallest: 5pt;

  --upd-table-line-width: 1px;
  --upd-table-line-bold-width: 2px;


  font-family: Arial, Helvetica, sans-serif;
  font-weight: normal;
  font-size: var(--upd-text-size);
  line-height: normal;

}

.upd [data-is-ip]:not([data-is-ip=true]) {
  display: none;
}

.upd-layout-table {
  padding: 0;
  margin: 0;
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;

  /* background-color: rgba(255, 0, 0, 0.1); */
}

:where(.upd-layout-table--real) td,
:where(.upd-layout-table--real) th {
  border: var(--upd-table-line-width) solid var(--upd-table-line-color);
  padding-left: .5mm;
  padding-right: .5mm;
}

.upd-layout-table--real td,
.upd-layout-table--real th {
  padding-left: .5mm;
  padding-right: .5mm;
}

.upd-layout-table--real th {
  text-align: center;
  font-weight: inherit;
}

:where(.upd-layout-table) td,
:where(.upd-layout-table) th {
  margin: 0;
  padding: 0;
}

.upd-text-bold {
  font-weight: bold;
}

.upd-text-normal {
  font-size: var(--upd-text-size);
}

.upd-text-small {
  font-size: var(--upd-text-size-small);
}

.upd-text-smaller {
  font-size: var(--upd-text-size-smaller);
}

.upd-text-smallest {
  font-size: var(--upd-text-size-smallest);
}

.upd-text-center {
  text-align: center;
}

.upd-text-right {
  text-align: right;
}

.upd-padding-top {
  padding-top: 1mm;
}

.upd-padding-left {
  padding-left: 1mm;
}

.upd-padding-right {
  padding-right: 1mm;
}

.upd-border {
  border: var(--upd-table-line-width) solid var(--upd-table-line-color);
}

.upd-border-bold {
  border: var(--upd-table-line-bold-width) solid var(--upd-table-line-color);
}

.upd-border-bottom {
  border-bottom: var(--upd-table-line-width) solid var(--upd-table-line-color);
}

.upd-border-left {
  border-left: var(--upd-table-line-width) solid var(--upd-table-line-color);
}

.upd-border-left-bold {
  border-left: var(--upd-table-line-bold-width) solid var(--upd-table-line-color);
}

.upd-border-bottom-bold {
  border-bottom: var(--upd-table-line-bold-width) solid var(--upd-table-line-color);
}

.upd-valign-baseline {
  vertical-align: baseline;
}

.upd-valign-top {
  vertical-align: top;
}

.upd-valign-bottom {
  vertical-align: bottom;
}

.upd-valign-middle {
  vertical-align: middle;
}

.upd-field {
  width: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
}

.upd-field__label-word {
  display: inline-block;
  flex: 0 0 auto;
  margin-right: 0.25em;
  /* Simulates natural word spacing */
  white-space: nowrap;
}

.upd-field__value {
  flex: 1 1 auto;
  min-width: 50px;
  width: auto;
  margin-left: 0.5em;
  align-self: flex-end;
}

.upd-field__suffix {
  flex-shrink: 0;
}

.upd-money {
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;
}

.upd-image-container {
  position: relative;
}

.upd-image {
  display: block;
  position: absolute;
  pointer-events: none;
  mix-blend-mode: multiply;
}

.upd-image--stamp {
  width: 43mm;
  transform: rotate(-15grad);
}

/* Скрыть, если атрибут src пустой */
img.upd-image[src=""] {
  display: none;
}

/* Скрыть, если атрибут src вообще отсутствует */
img.upd-image:not([src]) {
  display: none;
}

</style>
<article class="upd">
  <table class="upd-layout-table">
    <tbody>
      <tr>
        <td style="width: calc(24mm + var(--upd-table-line-width) / 2);" class="upd-valign-top">
          <span class="upd-text-bold">Универсальный передаточный документ</span>
          <table class="upd-layout-table" style="margin: 0 auto; width: fit-content;">
            <tbody>
              <tr>
                <td class="upd-text-bold upd-valign-middle upd-padding-right">Статус:</td>
                <td style="width: 3ch; padding: 1mm;" class="upd-text-bold upd-text-center upd-border-bold">${updStatus}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <span class="upd-text-smaller">
            1 — счет-фактура и передаточный документ (акт)<br>
            2 — передаточный документ (акт)
          </span>
        </td>
        <td class="upd-padding-left upd-border-left-bold">
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 25mm;" class="upd-text-bold">Счет-фактура №</td>
                <td style="width: 25mm;" class="upd-border-bottom upd-text-center upd-text-bold">${data?.nomer ?? ''}</td>
                <td style="width: 7mm;" class="upd-text-center">от</td>
                <td style="width: 25mm;" class="upd-border-bottom upd-text-center upd-text-bold">${data?.inv_date ?? ''}</td>
                <td style="width: 10mm;" class="upd-valign-bottom">(1)</td>
                <td rowspan="2" class="upd-text-right upd-text-smallest upd-valign-top">
                  Приложение № 1 к постановлению Правительства Российской Федерации от 26 декабря 2011 г. № 1137<br>
                  (в редакции постановления Правительства Российской Федерации от 16 августа 2024 г. № 1096)
                </td>
              </tr>
              <tr>
                <td>Исправление №</td>
                <td class="upd-border-bottom"> </td>
                <td class="upd-text-center">от</td>
                <td class="upd-border-bottom"> </td>
                <td class="upd-valign-bottom">(1а)</td>
              </tr>
            </tbody>
          </table>
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 50%;" class="upd-padding-right">
                  <table class="upd-layout-table">
                    <tbody>
                      <tr>
                        <td style="width: 30mm;" class="upd-text-bold">Продавец:</td>
                        <td class="upd-border-bottom">${seller.name ?? ''}</td>
                        <td style="width: 6mm;" class="upd-valign-bottom">(2)</td>
                      </tr>
                      <tr>
                        <td>Адрес:</td>
                        <td class="upd-border-bottom">${seller.address ?? ''}</td>
                        <td class="upd-valign-bottom">(2а)</td>
                      </tr>
                      <tr>
                        <td>ИНН/КПП продавца:</td>
                        <td class="upd-border-bottom">${seller.inn ?? ''}${seller.kpp ? '/' + seller.kpp : ''}</td>
                        <td class="upd-valign-bottom">(2б)</td>
                      </tr>
                      <tr>
                        <td>Грузоотправитель<br> и его адрес:</td>
                        <td class="upd-border-bottom">${consignerStr}</td>
                        <td class="upd-valign-bottom">(3)</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <table class="upd-layout-table">
                            <tbody>
                              <tr>
                                <td style="width: 63mm;">К платежно-расчетному документу (№ дата)</td>
                                <td class="upd-border-bottom"></td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td class="upd-valign-bottom">(5)</td>
                      </tr>
                    </tbody>
                  </table>

                </td>
                <td class="upd-padding-left">
                  <table class="upd-layout-table">
                    <tbody>
                      <tr>
                        <td style="width: 30mm;" class="upd-text-bold">Покупатель:</td>
                        <td class="upd-border-bottom">${payer.name ?? ''}</td>
                        <td style="width: 6mm;" class="upd-valign-bottom">(6)</td>
                      </tr>
                      <tr>
                        <td>Адрес:</td>
                        <td class="upd-border-bottom">${payer.address ?? ''}</td>
                        <td class="upd-valign-bottom">(6а)</td>
                      </tr>
                      <tr>
                        <td>ИНН/КПП покупателя:</td>
                        <td class="upd-border-bottom">${payer.inn ?? ''}${payer.kpp ? ' / ' + payer.kpp : ''}</td>
                        <td class="upd-valign-bottom">(6б)</td>
                      </tr>
                      <tr>
                        <td>Грузополучатель<br> и его адрес:</td>
                        <td class="upd-border-bottom">${consigneeStr}</td>
                        <td class="upd-valign-bottom">(4)</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <table class="upd-layout-table">
                            <tbody>
                              <tr>
                                <td style="width: 63mm;">Документ об отгрузке (наименование № дата)</td>
                                <td class="upd-border-bottom">УПД № ${data?.nomer ?? ''} от ${data?.inv_date ?? ''}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td class="upd-valign-bottom">(5a)</td>
                      </tr>
                    </tbody>
                  </table>

                </td>
              </tr>
            </tbody>
          </table>
          <table class="upd-layout-table" style="margin-bottom: .5em;">
            <tbody>
              <tr>
                <td class="upd-field">
                  <span class="upd-field__label-word">К</span>
                  <span class="upd-field__label-word">счету-фактуре</span>
                  <span class="upd-field__label-word">(счетам-фактурам),</span>
                  <span class="upd-field__label-word">выставленному</span>
                  <span class="upd-field__label-word">(выставленным)</span>
                  <span class="upd-field__label-word">при</span>
                  <span class="upd-field__label-word">получении</span>
                  <span class="upd-field__label-word">оплаты,</span>
                  <span class="upd-field__label-word">частичной</span>
                  <span class="upd-field__label-word">оплаты</span>
                  <span class="upd-field__label-word">или</span>
                  <span class="upd-field__label-word">иных</span>
                  <span class="upd-field__label-word">платежей</span>
                  <span class="upd-field__label-word">в</span>
                  <span class="upd-field__label-word">счет</span>
                  <span class="upd-field__label-word">предстоящих</span>
                  <span class="upd-field__label-word">поставок</span>
                  <span class="upd-field__label-word">товаров</span>
                  <span class="upd-field__label-word">(выполнения</span>
                  <span class="upd-field__label-word">работ,</span>
                  <span class="upd-field__label-word">оказания</span>
                  <span class="upd-field__label-word">услуг),</span>
                  <span class="upd-field__label-word">передачи</span>
                  <span class="upd-field__label-word">имущественных</span>
                  <span class="upd-field__label-word">прав</span>
                  <span class="upd-field__label-word">(№</span>
                  <span class="upd-field__label-word">дата,</span>
                  <span class="upd-field__label-word">исправление</span>
                  <span class="upd-field__label-word">№</span>
                  <span class="upd-field__label-word">дата)</span>
                  <span class="upd-field__value upd-border-bottom"></span>
                  <span class="upd-field__suffix" style="width: 6mm;">(5б)</span>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="upd-layout-table" style="margin-bottom: .5em;">
            <tbody>
              <tr>
                <td style="width: 40mm;">Валюта (наименование, код)</td>
                <td style="width: 35mm;" class="upd-border-bottom">Российский рубль, 643</td>
                <td style="width: 6mm;" class="upd-valign-bottom">(7)</td>
                <td style="width: 2mm;"></td>
                <td style="width: 112mm;">Идентификатор государственного контракта, договора (соглашения) (при наличии):</td>
                <td class="upd-border-bottom upd-valign-bottom"></td>
                <td style="width: 6mm;" class="upd-valign-bottom">(8)</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <table class="upd-layout-table upd-layout-table--real">
    <thead>
      <tr>
        <th rowspan="2" style="width: 24mm;">Код товара / работ, услуг</th>
        <th rowspan="2" style="width: 4mm;" class="upd-border-left-bold">№ п/п</th>
        <th rowspan="2">Наименование товара (описание выполненных работ, оказанных услуг), имущественного права</th>
        <th rowspan="2" style="width: 5mm;" class="upd-text-smallest">Код вида товара</th>
        <th colspan="2">Единица измерения</th>
        <th rowspan="2" style="width: 0;">Кол-во (объём)</th>
        <th rowspan="2" style="width: 0;">Цена (тариф) за единицу измерения</th>
        <th rowspan="2" style="width: 20mm;" class="upd-text-smaller">Стоимость товаров (работ, услуг), иму- щественных прав без налога — всего</th>
        <th rowspan="2" style="width: 0" class="upd-text-smallest">В том числе сумма акциза</th>
        <th rowspan="2" style="width: 0;">Нало- говая ставка</th>
        <th rowspan="2" style="width: 0;">Сумма налога, предъяв- ляемая покупателю</th>
        <th rowspan="2" style="width: 20mm;" class="upd-text-smaller">Стоимость товаров (работ, услуг), иму- щественных прав с налогом — всего</th>
        <th colspan="2" class="upd-text-smallest">Страна происхождения товара</th>
        <th rowspan="2" style="width: 0;" class="upd-text-smallest">Регистрационный номер декларации на товары или регистрационный номер партии товара, подлежащего прослеживаемости</th>
      </tr>
      <tr>
        <th style="width: 4ch;">Код</th>
        <th style="width: 10mm;" class="upd-text-smaller">Условное обозна- чение<span style="display: none;"> (национальное)</span></th>
        <th style="width: 0;" class="upd-text-smallest">Цифро- вой код</th>
        <th style="width: 0;" class="upd-text-smallest">Краткое наимено- вание</th>
      </tr>
      <tr>
        <th>A</th>
        <th class="upd-border-left-bold">1</th>
        <th>1а</th>
        <th>1б</th>
        <th>2</th>
        <th>2а</th>
        <th>3</th>
        <th>4</th>
        <th>5</th>
        <th>6</th>
        <th>7</th>
        <th>8</th>
        <th>9</th>
        <th>10</th>
        <th>10а</th>
        <th>11</th>
      </tr>
    </thead>
    <tbody>
${detailsRows}
${totalRow}
    </tbody>
  </table>
  <table class="upd-layout-table">
    <tbody>
      <tr>
        <td style="width: calc(24mm + var(--upd-table-line-width) / 2);" class="upd-text-smaller upd-padding-top">
          Документ<br> составлен на ___ листах
        </td>
        <td class="upd-padding-left upd-border-left-bold upd-border-bottom-bold">
          <!-- для ИП выключать (при длине ИНН 12 знаков) -->
          <table data-is-ip="${isIp ? 'true' : 'false'}" class="upd-layout-table" style="display: ${isIp ? 'none' : 'table'};">
            <tbody>
              <tr>
                <td style="width: 49%;">
                  <table class="upd-layout-table">
                    <tbody>
                      <tr>
                        <td style="width: 43mm;">Руководитель организации или иное уполномоченное лицо</td>
                        <td style="width: 27mm;" class="upd-border-bottom"></td>
                        <td style="width: 3mm;"> </td>
                        <td class="upd-border-bottom upd-valign-bottom">${seller.ceo ?? ''}</td>
                      </tr>
                      <tr>
                        <td> </td>
                        <td class="upd-text-center upd-text-small">(подпись)</td>
                        <td> </td>
                        <td class="upd-text-center upd-text-small">(ф.и.о.)</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style="width: 2%;"></td>
                <td>
                  <table class="upd-layout-table">
                    <tbody>
                      <tr>
                        <td style="width: 43mm;">Главный бухгалтер или иное уполномоченное лицо</td>
                        <td style="width: 27mm;" class="upd-border-bottom"></td>
                        <td style="width: 3mm;"> </td>
                        <td class="upd-border-bottom upd-valign-bottom">${seller.cao ?? ''}</td>
                      </tr>
                      <tr>
                        <td> </td>
                        <td class="upd-text-center upd-text-small">(подпись)</td>
                        <td> </td>
                        <td class="upd-text-center upd-text-small">(ф.и.о.)</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <table data-is-ip="${isIp ? 'true' : 'false'}" class="upd-layout-table" style="display: ${isIp ? 'table' : 'none'};">
            <tbody>
              <tr>
                <td style="width: 35ch;">Индивидуальный предприниматель<br>или иное уполномоченное лицо</td>
                <td style="width: 27mm;" class="upd-border-bottom upd-image-container">
                  <img style="top: -10mm; left: 0; width: 27mm;" src="${(options.signature && updStatus === 1) ? signatureSrc : ''}" alt="рукописная подпись" class="upd-image upd-image--signature">
                </td>
                <td style="width: 3mm;"> </td>
                <td style="width: 50mm;" class="upd-border-bottom upd-valign-bottom">${seller.ceo ?? ''}</td>
                <td style="width: 2%;"> </td>
                <td style="width: 40ch;" class="upd-border-bottom upd-valign-bottom upd-text-center">ОГРНИП ${seller.ogrn ?? ''} от ${seller.ogrn_date ?? ''}</td>
                <td></td>
              </tr>
              <tr>
                <td> </td>
                <td class="upd-text-center upd-text-small">(подпись)</td>
                <td> </td>
                <td class="upd-text-center upd-text-small"></td>
                <td> </td>
                <td class="upd-text-center upd-text-small">(ОГРНИП и дата его присвоения, в соотв. с п. 6 ст. 169 НК РФ)</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <table style="margin-top: 2mm;" class="upd-layout-table">
    <tbody>
      <tr>
        <td style="width: 70mm;">Основание передачи (сдачи) / получения (приемки)</td>
        <td class="upd-border-bottom"></td>
        <td style="width: 6mm;">[10]</td>
      </tr>
      <tr>
        <td> </td>
        <td class="upd-text-small upd-text-center">(договор, доверенность и др.)</td>
        <td> </td>
      </tr>
    </tbody>
  </table>
  <table class="upd-layout-table">
    <tbody>
      <tr>
        <td style="width: 47mm;">Данные о транспортировке и грузе</td>
        <td class="upd-border-bottom">Заявка № ${app.nomer ?? ''}${app.base_code} от ${app.date_reg ?? ''}, груз: ${app.cargo ?? ''}, масса брутто ${fmtNumber(app.weight ?? '')} кг, авто объем ${fmtNumber(app.volume ?? '')} м³, кол-во мест ${fmtNumber(app.count_pcs) ?? ''}.</td>
        <td style="width: 6mm;">[11]</td>
      </tr>
      <tr>
        <td> </td>
        <td class="upd-text-small upd-text-center">(транспортная накладная, поручение экспедитору, экспедиторская/складская расписка и др., масса нетто/брутто груза, если не приведены ссылки на транспортные документы, содержащие эти сведения)</td>
        <td> </td>
      </tr>
    </tbody>
  </table>
  <table class="upd-layout-table" style="page-break-inside: avoid;">
    <tbody>
      <tr>
        <td style="width: 50%;" class="upd-padding-right">
          Товар (груз) передал / услуги, результаты работ, права сдал
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 50mm; height: 2em;" class="upd-border-bottom upd-text-center upd-valign-bottom">${positionTitle}</td>
                <td style="width: 3mm;"> </td>
                <td style="width: 27mm" class="upd-border-bottom upd-image-container">
                  <img style="top: -10mm; left: 0; width: 27mm;" src="${(options.signature && updStatus === 2) ? signatureSrc : ''}" alt="рукописная подпись" class="upd-image upd-image--signature">
                </td>
                <td style="width: 3mm;"> </td>
                <td class="upd-border-bottom upd-valign-bottom">${seller.ceo ?? ''}</td>
                <td style="width: 6mm;" class="upd-valign-bottom">[12]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(должность)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(подпись)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(ф.и.о.)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 45mm; height: 2em;" class="upd-valign-bottom">Дата отгрузки, передачи (сдачи)</td>
                <td class="upd-border-bottom upd-valign-bottom">${data?.inv_date ?? ''}</td>
                <td style="width: 6mm;" class="upd-valign-bottom">[13]</td>
              </tr>
            </tbody>
          </table>

          Иные сведения об отгрузке, передаче
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td class="upd-border-bottom"> </td>
                <td style="width: 6mm;" class="upd-valign-bottom">[14]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(ссылки на неотъемлемые приложения, сопутствующие документы, иные документы и т.п.)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          Ответственный за правильность оформления факта хозяйственной жизни
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 50mm; height: 2em;" class="upd-border-bottom upd-text-center upd-valign-bottom">${positionTitle}</td>
                <td style="width: 3mm;"> </td>
                <td style="width: 27mm" class="upd-border-bottom"> </td>
                <td style="width: 3mm;"> </td>
                <td class="upd-border-bottom upd-valign-bottom">${seller.ceo ?? ''}</td>
                <td style="width: 6mm;" class="upd-valign-bottom">[15]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(должность)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(подпись)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(ф.и.о.)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          Наименование экономического субъекта — составителя документа (в т. ч. комиссионера / агента)
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="height: 2em;" class="upd-border-bottom upd-valign-bottom">${seller.name ?? ''}</td>
                <td style="width: 6mm;" class="upd-valign-bottom">[16]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(может не заполняться при проставлении печати в М.П., может быть указан ИНН/КПП)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-left: 15mm;" class="upd-image-container">
            М.П.
            <img style="left: -15mm; bottom: -17mm;" src="${options.stamp ? stampSrc : ''}" alt="оттиск печати" class="upd-image upd-image--stamp">
          </div>
        </td>
        <td class="upd-border-left-bold upd-padding-left">

          Товар (груз) получил / услуги, результаты работ, права принял

          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 50mm; height: 2em;" class="upd-border-bottom upd-text-center upd-valign-bottom"></td>
                <td style="width: 3mm;"> </td>
                <td style="width: 27mm" class="upd-border-bottom"> </td>
                <td style="width: 3mm;"> </td>
                <td class="upd-border-bottom upd-valign-bottom"></td>
                <td style="width: 6mm;" class="upd-valign-bottom">[17]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(должность)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(подпись)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(ф.и.о.)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 45mm; height: 2em;" class="upd-valign-bottom">Дата получения (приемки)</td>
                <td class="upd-border-bottom upd-valign-bottom">${data?.inv_date ?? ''}</td>
                <td style="width: 6mm;" class="upd-valign-bottom">[18]</td>
              </tr>
            </tbody>
          </table>

          Иные сведения о получении, приемке
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td class="upd-border-bottom"> </td>
                <td style="width: 6mm;" class="upd-valign-bottom">[19]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(информация о наличии/отсутствии претензии; ссылки на неотъемлемые приложения и другие документы и т. п.)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          Ответственный за правильность оформления факта хозяйственной жизни

          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="width: 50mm; height: 2em;" class="upd-border-bottom upd-text-center upd-valign-bottom"></td>
                <td style="width: 3mm;"> </td>
                <td style="width: 27mm" class="upd-border-bottom"> </td>
                <td style="width: 3mm;"> </td>
                <td class="upd-border-bottom upd-valign-bottom"></td>
                <td style="width: 6mm;" class="upd-valign-bottom">[20]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(должность)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(подпись)</td>
                <td> </td>
                <td class="upd-text-small upd-text-center">(ф.и.о.)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          Наименование экономического субъекта — составителя документа
          <table class="upd-layout-table">
            <tbody>
              <tr>
                <td style="height: 2em;" class="upd-border-bottom upd-valign-bottom"> </td>
                <td style="width: 6mm;" class="upd-valign-bottom">[21]</td>
              </tr>
              <tr>
                <td class="upd-text-small upd-text-center">(может не заполняться при проставлении печати в М.П., может быть указан ИНН/КПП)</td>
                <td> </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-left: 15mm;">М.П.</div>
        </td>
      </tr>
    </tbody>
  </table>


</article>`;

  return { title: 'УПД', orientation: 'landscape', html };
}
