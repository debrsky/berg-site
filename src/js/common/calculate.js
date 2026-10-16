const isNumber = (value) => typeof value === "number" && isFinite(value);

// Shared by the existing calculator and build-time landing examples.
export function calculateCargo(tariffs, input) {
  const {
    heavyCargoPrices,
    lightCargoPrices,
    minPrices,
    icenginePrices,
    fridgePrices,
    oversizedRaisingFactor
  } = tariffs;
  const calcLightPrice = ({volume, origin, destination}) => {
    if (!isNumber(volume)) return {title: null, tariff: null, amount: null};

    let idx = 0;
    while (volume >= lightCargoPrices[idx].limit) {
      idx++;
      if (!lightCargoPrices[idx]) throw Error();
    }
    const tariff = lightCargoPrices[idx].price?.[origin]?.[destination] ?? null;
    if (tariff === null && lightCargoPrices[idx].limit !== Infinity)
      return {title: null, tariff: null, amount: 0};

    const amount = tariff * volume;
    const title = "легкий груз " + lightCargoPrices[idx].title;
    const limit = lightCargoPrices[idx].limit;

    return {title, tariff, amount, limit};
  };

  const calcHeavyPrice = ({weight, origin, destination}) => {
    if (!isNumber(weight)) return {title: null, tariff: null, amount: null};

    let idx = 0;
    while (weight >= heavyCargoPrices[idx].limit) {
      idx++;
      if (!heavyCargoPrices[idx]) throw Error();
    }
    const tariff = heavyCargoPrices[idx].price?.[origin]?.[destination] ?? null;
    const amount = tariff * weight;
    const title = "тяжелый груз " + heavyCargoPrices[idx].title;
    const limit = heavyCargoPrices[idx].limit;

    return {title, tariff, amount, limit};
  };

  const calcICEnginePrice = ({params, origin, destination}) => {
    const isICEngine = params?.includes("ic-engine") ?? false;
    if (!isICEngine) return null;

    const amount = icenginePrices.price?.[origin]?.[destination] ?? 0;
    const title = icenginePrices.title;
    return {title, amount};
  };

  const calcMinPrice = ({weight, volume, params, origin, destination}) => {
    let priceFound = null;

    for (let idx = 0; idx < minPrices.length; ++idx) {
      const needWeightChecking = isNumber(minPrices[idx].limitHeavy);
      const weightChecked =
        needWeightChecking && weight < minPrices[idx].limitHeavy;
      const needVolumeChecking = isNumber(minPrices[idx].limitLight);
      const volumeChecked =
        needVolumeChecking && volume < minPrices[idx].limitLight;

      if (
        (!needWeightChecking || weightChecked) &&
        (!needVolumeChecking || volumeChecked)
      ) {
        priceFound = minPrices[idx];
        break;
      }
    }

    if (!priceFound) {
      return null;
    }

    const amount = priceFound.price?.[origin]?.[destination] ?? 0;
    const title =
      "минимально за мелкий груз " + priceFound.title?.replaceAll("<br>", " ");

    return {title, amount};
  };

  const processCalc = ({weight, volume, params, origin, destination}) => {
    if (!isNumber(weight) || weight <= 0 || !isNumber(volume) || volume <= 0)
      return null;

    let price;

    const minPrice = calcMinPrice({
      weight,
      volume,
      params,
      origin,
      destination
    });

    if (minPrice) {
      price = minPrice;
    } else {
      price =
        (volume * 1000) / weight > 5
          ? calcLightPrice({weight, volume, params, origin, destination})
          : calcHeavyPrice({weight, volume, params, origin, destination});
    }

    const isFridge = params?.includes("fridge") ?? false;
    const isOversized =
      (params?.includes("ic-engine") || params?.includes("oversized")) ?? false;

    const fridgeAmount = isFridge
      ? fridgePrices.price?.[origin]?.[destination] ?? 0
      : null;

    if (isOversized) {
      price.amount = oversizedRaisingFactor * price.amount;
    }

    const ICEnginePrice = calcICEnginePrice({
      weight,
      volume,
      params,
      origin,
      destination
    });

    if (ICEnginePrice && ICEnginePrice.amount > price.amount) {
      price = {
        ...price,
        title: ICEnginePrice.title,
        amount: ICEnginePrice.amount
      };
    }

    if (fridgeAmount > 0) {
      price.amount += fridgeAmount;
    }

    price.isOversized = isOversized;
    return price;
  };

  return processCalc(input);
}
