console.log("calculator.js");

const places = {
  vvo: "Владивосток",
  uss: "Уссурийск",
  khb: "Хабаровск",
  blg: "Благовещенск",
  kms: "Комсомольск-на-Амуре"
};

const heavyCargoPrices = [
  {
    title: "до 1000 кг",
    limit: 1000,
    price: {
      vvo: {khb: 5.0, kms: 8.0, blg: 9.0},
      uss: {khb: 5.0, kms: 7.0, blg: 8.5},
      khb: {vvo: 3.7, uss: 3.5, blg: 5.5, kms: 4.5},
      blg: {khb: 5.5, kms: 8.0, vvo: 8.0},
      kms: {vvo: 6.5, khb: 2.5}
    }
  },
  {
    title: "от 1000 кг до 5000 кг",
    limit: 5000,
    price: {
      vvo: {khb: 4.8, kms: 7.0, blg: 8.5},
      uss: {khb: 4.0, kms: 6.0, blg: 8.0},
      khb: {vvo: 3.0, uss: 2.7, blg: 5.0, kms: 4.0},
      blg: {khb: 5.0, kms: 7.0, vvo: 7.0},
      kms: {vvo: 5.5, khb: 2.0}
    }
  },
  {
    title: "от 5000 кг до 10000 кг",
    limit: 10000,
    price: {
      vvo: {khb: 4.0, kms: 6.0, blg: 8.0},
      uss: {khb: 3.5, kms: 5.0, blg: 7.5},
      khb: {vvo: 2.5, uss: 2.2, blg: 4.5, kms: 3.5},
      blg: {khb: 4.0, kms: 6.0, vvo: 6.0},
      kms: {vvo: 5.0, khb: 1.9}
    }
  },
  {
    title: "от 10000 кг до 15000 кг",
    limit: 15000,
    price: {
      vvo: {khb: 3.8, kms: 5.5, blg: 7.5},
      uss: {khb: 3.2, kms: 4.5, blg: 7.0},
      khb: {vvo: 2.1, uss: 2.0, blg: 4.0, kms: 3.2},
      blg: {khb: 3.0, kms: 5.0, vvo: 5.0},
      kms: {vvo: 4.5, khb: 1.7}
    }
  },
  {
    title: "более 15000 кг",
    limit: Infinity,
    price: {
      vvo: {khb: 3.3, kms: 5.0, blg: 6.5},
      uss: {khb: 3.0, kms: 4.0, blg: 6.0},
      khb: {vvo: 2.0, uss: 1.9, blg: 3.7, kms: 3.0},
      blg: {khb: 2.0, kms: 4.0, vvo: 4.0},
      kms: {vvo: 3.5, khb: 1.5}
    }
  }
];

const lightCargoPrices = {
  5: {},
  25: {},
  50: {},
  75: {},
  Infinity: {}
};
