const seller = {
  name: "ООО Тест",
  address: "г Владивосток, ул Тестовая, д 1",
  inn: "2536000000",
  kpp: "253601001",
  ceo: "Иванов И.И.",
  cao: "Петров П.П.",
  signature_base64: "data:image/png;base64,SIGNATURE",
  stamp_base64: "data:image/png;base64,STAMP"
};

const app = {
  nomer: "12",
  base_code: "-ВЛ",
  date_reg: "02.03.2026",
  cargo: "Коробки",
  weight: 125.5,
  volume: 2.35,
  count_pcs: 3
};

const base = {
  nomer: "42",
  inv_date: "03.03.2026",
  seller,
  payer: {
    name: "ООО Покупатель",
    address: "г Хабаровск",
    inn: "2721000000",
    kpp: "272101001"
  },
  consigner: {name: "Склад", address: "г Владивосток"},
  consignee: {name: "Получатель", address: "г Хабаровск"},
  app
};

export const cases = [
  {
    name: "organization with vat and multiple items",
    data: {
      ...base,
      nds: 20,
      total_amount_without_nds: 1250.5,
      total_nds_amount: 250.1,
      total_amount: 1500.6,
      details: [
        {
          name: "Доставка",
          mUcode: "796",
          mU: "шт",
          qty: 2,
          price_without_nds: 625.25,
          amount_without_nds: 1250.5,
          nds: 20,
          nds_amount: 250.1,
          amount: 1500.6
        },
        {name: "Дополнительная услуга", qty: 1, price_without_nds: 0, nds: 0}
      ]
    },
    options: {signature: true, stamp: true}
  },
  {
    name: "sole proprietor without vat or optional images",
    data: {
      ...base,
      nds: 0,
      seller: {
        ...seller,
        name: "ИП Иванов",
        inn: "253600000000",
        kpp: "",
        ogrn: "123456789012345",
        ogrn_date: "01.01.2020"
      },
      payer: {name: "Физическое лицо"},
      details: [
        {
          name: "Перевозка",
          qty: 1,
          price_without_nds: 100,
          amount_without_nds: 100,
          nds: 0,
          amount: 100
        }
      ],
      total_amount_without_nds: 100,
      total_nds_amount: 0,
      total_amount: 100
    },
    options: {signature: false, stamp: false}
  },
  {
    name: "empty item list and missing optional values",
    data: {seller: {inn: "2536000000"}, details: []},
    options: {}
  },
  {
    name: "sole proprietor with vat, signature and stamp",
    data: {
      ...base,
      nds: 5,
      seller: {...seller, inn: "253600000000", ogrn: "123456789012345"},
      details: [
        {
          name: "Услуга",
          qty: 1.25,
          price_without_nds: 12.345678,
          amount_without_nds: 15.43,
          nds: 5,
          nds_amount: 0.77,
          amount: 16.2
        }
      ],
      total_amount_without_nds: 15.43,
      total_nds_amount: 0.77,
      total_amount: 16.2
    },
    options: {signature: true, stamp: true}
  }
];
