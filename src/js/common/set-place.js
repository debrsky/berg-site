import {suggestionToken} from "../config";

const url =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/iplocate/address";

const options = {
  method: "GET",
  mode: "cors",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: "Token " + suggestionToken
  }
};

export const setPlace = async () => {
  const fallbackCity = "Владивосток"; // eslint-disable-line sonarjs/no-duplicate-string
  const placeCities = ["Владивосток", "Уссурийск", "Хабаровск", "Благовещенск"];

  const userPlace = localStorage.getItem("userPlace");
  if (placeCities.includes(userPlace)) return userPlace;

  const placeRegions = {
    Приморский: "Владивосток", // eslint-disable-line sonarjs/no-duplicate-string
    Хабаровский: "Хабаровск",
    Амурская: "Благовещенск"
  };

  let userPlaceDetected;

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      userPlaceDetected = fallbackCity;
      return userPlaceDetected;
    }
    const place = await response.json();
    const {city, region} = place?.location?.data ?? {};

    if (placeCities.includes(city)) {
      userPlaceDetected = city;
    } else if (Object.keys(placeRegions).includes(region)) {
      userPlaceDetected = placeRegions[region];
    } else {
      userPlaceDetected = fallbackCity;
    }
  } catch (err) {
    console.error(err);
    userPlaceDetected = fallbackCity;
  }

  localStorage.setItem("userPlace", userPlaceDetected);

  return userPlaceDetected;
};
