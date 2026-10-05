const form = document.getElementById("prayer-form");
const cityInput = document.getElementById("city-input");
const countryInput = document.getElementById("country-input");

const locationDisplay = document.getElementById("location-display");
const dateDisplay = document.getElementById("date-display");

const nextPrayerName = document.getElementById("next-prayer-name");
const nextPrayerTime = document.getElementById("next-prayer-time");

const prayerElements = {
  Fajr: document.getElementById("fajr-time"),
  Sunrise: document.getElementById("sunrise-time"),
  Dhuhr: document.getElementById("dhuhr-time"),
  Asr: document.getElementById("asr-time"),
  Maghrib: document.getElementById("maghrib-time"),
  Isha: document.getElementById("isha-time"),
};

let countdownInterval = null;

async function fetchPrayerTimes(city, country) {
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
    const result = await response.json();

    if (result.code === 200) {
      updateUI(result.data, city, country);
    } else {
      alert("City or country not found. Please try again.");
    }
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    alert("Check your connection.");
  }
}

function updateUI(data, city, country) {
  const timings = data.timings;
  const readableDate = data.date.readable;

  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);
  locationDisplay.textContent = `${formattedCity}, ${formattedCountry}`;

  dateDisplay.textContent = readableDate;

  for (const prayer in prayerElements) {
    if (timings[prayer]) {
      prayerElements[prayer].textContent = timings[prayer];
    }
  }

  startCountdown(timings, city, country);
}

function startCountdown(timings, city, country) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

  function updateTimer() {
    const now = new Date();
    let targetPrayer = null;
    let targetDate = null;

    for (const prayer of prayerOrder) {
      const timeStr = timings[prayer]; 
      const [hours, minutes] = timeStr.split(" ")[0].split(":").map(Number);

      const prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0, 0);

      if (prayerDate > now) {
        targetPrayer = prayer;
        targetDate = prayerDate;
        break;
      }
    }

    if (!targetDate) {
      targetPrayer = "Fajr";
      const [hours, minutes] = timings["Fajr"]
        .split(" ")[0]
        .split(":")
        .map(Number);
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(hours, minutes, 0, 0);
    }

    nextPrayerName.textContent = targetPrayer;

    const diffMs = targetDate - now;

    if (diffMs <= 0) {
      fetchPrayerTimes(city, country);
      return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const secs = String(totalSeconds % 60).padStart(2, "0");

    nextPrayerTime.textContent = `${hrs}:${mins}:${secs}`;
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  const country = countryInput.value.trim();

  if (city && country) {
    fetchPrayerTimes(city, country);
  }
});

fetchPrayerTimes("Madrid", "Spain");
