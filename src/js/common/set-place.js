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
  const userPlace = localStorage.getItem("userPlace");
  if (userPlace) return userPlace;

  const placeRegions = {
    Приморский: "Владивосток", // eslint-disable-line sonarjs/no-duplicate-string
    Хабаровский: "Хабаровск",
    Амурская: "Благовещенск"
  };

  const placeCities = [
    "Владивосток",
    "Уссурийск",
    "Хабаровск",
    "Благовещенск"
  ];

  let userPlaceDetected;

  try {
    const response = await fetch(url, options);
    if (!response.ok) return;
    const place = await response.json();
    const { city, region } = place?.location?.data ?? {};


    if (placeCities.includes(city)) {
      userPlaceDetected = city;
    } else if (Object.keys(placeRegions).includes(region)) {
      userPlaceDetected = region;
    } else {
      userPlaceDetected = "Владивосток";
    }
  } catch (err) {
    console.error(err);
    userPlaceDetected = "Владивосток";
  }

  localStorage.setItem("userPlace", userPlaceDetected);

  return userPlaceDetected;
};
