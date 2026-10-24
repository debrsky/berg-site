import {suggestionToken} from "../config";
import {hasAdditionalConsent} from "./privacy-consent.js";

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

  try {
    const userPlace = localStorage.getItem("userPlace");
    if (placeCities.includes(userPlace)) return userPlace;
  } catch (_) {
    // Manual city selection remains available without browser storage.
  }
  if (!hasAdditionalConsent()) return fallbackCity;

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
    if (!hasAdditionalConsent()) return fallbackCity;
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

  try {
    // A manual selection made while the request was pending takes precedence.
    const currentPlace = localStorage.getItem("userPlace");
    if (placeCities.includes(currentPlace)) return currentPlace;
    localStorage.setItem("userPlace", userPlaceDetected);
  } catch (_) {
    // The detected city can still be used on this page.
  }

  return userPlaceDetected;
};
