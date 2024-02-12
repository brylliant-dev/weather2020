$(document).ready(function () {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoid2VhdGhlcjIwMjBsbGMiLCJhIjoiY2xuOTNuMmtxMDI3cTJqbWdmM2h6d2theSJ9.sLvJwJQsMxtNl-dH0tew7A";
  
    let defaultLat = 38.984764;
    let defaultLon = -94.677658;
  
    let latitude = defaultLat;
    let longitude = defaultLon;
  
    let clickedLat = null;
    let clickedLong = null;
  
    let openPopup = null;
    let clickedLocationMarkerAdded = false;
    let isToggled;
  
    var map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [defaultLon, defaultLat],
      zoom: 6,
    });
  
    map.on("style.load", () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          clickedLong = longitude;
          clickedLat = latitude;
          // Show preloader
          $(".preloader").fadeIn("fast");
          fetchData(
            clickedLat,
            clickedLong,
            "tmax",
            temperatureUnit,
            dateStart,
            dateEnd,
          );
          map.addSource("user-location", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              properties: {
                locationName: "User Location",
              },
            },
          });
  
          map.addLayer({
            id: "user-location-marker",
            type: "circle",
            source: "user-location",
            paint: {
              "circle-radius": 8,
              "circle-stroke-width": 1,
              "circle-color": "#138eff",
              "circle-opacity": 1,
              "circle-stroke-color": "white",
            },
          });
  
          map.setCenter([longitude, latitude]);
  
          const geocoderUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`;
  
          fetch(geocoderUrl)
            .then((response) => response.json())
            .then((data) => {
              const features = data.features;
              if (features.length > 0) {
                const locationName = features[0].place_name;
                map.getSource("user-location").setData({
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                  },
                  properties: {
                    locationName: locationName,
                  },
                });
              }
            })
            .catch((error) =>
              console.error("Error getting location name:", error),
            );
        },
        (error) => {
          console.error("Error getting location:", error.message);
          clickedLat = defaultLat;
          clickedLong = defaultLon;
          // Show preloader
          $(".preloader").fadeIn("fast");
          fetchData(
            defaultLat,
            defaultLon,
            "tmax",
            temperatureUnit,
            dateStart,
            dateEnd,
          );
  
          map.addSource("default-location", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [defaultLon, defaultLat],
              },
              properties: {
                locationName: "12758 Bond Street Overland Park, KS 66213",
              },
            },
          });
  
          map.addLayer({
            id: "default-location-marker",
            type: "circle",
            source: "default-location",
            paint: {
              "circle-radius": 8,
              "circle-stroke-width": 1,
              "circle-color": "#FFC700",
              "circle-opacity": 1,
              "circle-stroke-color": "white",
            },
          });
  
          map.on("mouseleave", "default-location-marker", function () {
            map.getCanvas().style.cursor = "";
            if (openPopup) {
              openPopup.remove();
              openPopup = null;
            }
          });
  
          map.on("mouseenter", "default-location-marker", function (e) {
            map.getCanvas().style.cursor = "pointer";
  
            const coordinates = e.features[0].geometry.coordinates.slice();
            const locationName = e.features[0].properties.locationName;
  
            if (openPopup) {
              openPopup.remove();
              openPopup = null;
            }
  
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
            })
              .setLngLat(coordinates)
              .setHTML(`<p>${locationName}</p>`)
              .addTo(map);
  
            openPopup = popup;
          });
  
          map.on("click", "default-location-marker", function (e) {
            clickedLat = defaultLat;
            clickedLong = defaultLon;
            $(".preloader").fadeIn("fast");
            fetchData(
              defaultLat,
              defaultLon,
              "tmax",
              temperatureUnit,
              dateStart,
              dateEnd,
            );
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    });
  
    map.on("mouseenter", "user-location-marker", function (e) {
      map.getCanvas().style.cursor = "pointer";
  
      const coordinates = e.features[0].geometry.coordinates.slice();
      const locationName = e.features[0].properties.locationName;
  
      clickedLat = coordinates[1];
      clickedLong = coordinates[0];
      if (openPopup) {
        openPopup.remove();
        openPopup = null;
      }
  
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      })
        .setLngLat(coordinates)
        .setHTML(`<p>${locationName}</p>`)
        .addTo(map);
  
      openPopup = popup;
    });
  
    map.on("mouseleave", "user-location-marker", function () {
      map.getCanvas().style.cursor = "";
      if (openPopup) {
        openPopup.remove();
        openPopup = null;
      }
    });
  
    map.on("click", "user-location-marker", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      fetchData(
        clickedLat,
        clickedLong,
        "tmax",
        temperatureUnit,
        dateStart,
        dateEnd,
      );
    });
  
    map.on("click", function (e) {
      if (!openPopup) {
        const coordinates = e.lngLat.toArray();
  
        if (map.getSource("clicked-location")) {
          map.removeLayer("clicked-location-marker");
          map.removeSource("clicked-location");
        }
  
        clickedLat = coordinates[1];
        clickedLong = coordinates[0];
  
        // Center the map on the coordinates of the current location
        // map.flyTo({
        //   center: [clickedLong, clickedLat],
        //   speed: 1.5,
        //   curve: 1,
        //   easing: (t) => t,
        // });
  
        $(".preloader").fadeIn("fast");
        fetchData(
          clickedLat,
          clickedLong,
          "tmax",
          temperatureUnit,
          dateStart,
          dateEnd,
        );
        map.addSource("clicked-location", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            properties: {
              locationName: "Clicked Location",
            },
          },
        });
  
        map.addLayer({
          id: "clicked-location-marker",
          type: "circle",
          source: "clicked-location",
          paint: {
            "circle-radius": 8,
            "circle-stroke-width": 1,
            "circle-color": "#FFC700",
            "circle-opacity": 1,
            "circle-stroke-color": "white",
          },
        });
  
        const clickedGeocoderUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`;
  
        fetch(clickedGeocoderUrl)
          .then((response) => response.json())
          .then((data) => {
            const features = data.features;
            if (features.length > 0) {
              const locationName = features[0].place_name;
              console.log(features);
              map.getSource("clicked-location").setData({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: coordinates,
                },
                properties: {
                  locationName: locationName,
                },
              });
  
              const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
              })
                .setLngLat(coordinates)
                .setHTML(`<p>${locationName}</p>`)
                .addTo(map);
  
              openPopup = popup;
            }
          })
          .catch((error) =>
            console.error("Error getting clicked location name:", error),
          );
  
        clickedLocationMarkerAdded = true;
      } else {
        // Reset the flag to allow adding a new marker
        openPopup.remove();
        openPopup = null;
        clickedLocationMarkerAdded = false;
      }
    });
  
    map.on("mouseenter", "clicked-location-marker", function (e) {
      map.getCanvas().style.cursor = "pointer";
  
      const coordinates = e.features[0].geometry.coordinates.slice();
      const locationName = e.features[0].properties.locationName;
  
      if (openPopup) {
        openPopup.remove();
        openPopup = null;
      }
  
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      })
        .setLngLat(coordinates)
        .setHTML(`<p>${locationName}</p>`)
        .addTo(map);
  
      openPopup = popup;
    });
  
    map.on("mouseleave", "clicked-location-marker", function () {
      map.getCanvas().style.cursor = "";
      if (openPopup) {
        openPopup.remove();
        openPopup = null;
      }
    });
  
    map.on("click", "clicked-location-marker", function (e) {
      const coordinates = e.features[0].geometry.coordinates.slice();
      clickedLat = coordinates[1];
      clickedLong = coordinates[0];
  
      // Show preloader
      $(".preloader").fadeIn("fast");
      fetchData(
        clickedLat,
        clickedLong,
        "tmax",
        temperatureUnit,
        dateStart,
        dateEnd,
      );
    });
  
    // ========================================================= //
  
    let dateStart = "";
    let dateEnd = "";
  
    let targetMonth = "";
    let yearForTargetMonth = "";
  
    const apiKey = "4a104dda79281ab49bc8dd46a25674e5";
    const svgLinks = {
      tmax: "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/6548a55e7c01e0d4ecce25dd_arrow_outward.svg",
      tmin: "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/6548b7f1267ff6e0910d0cdc_arrow_downward2.svg",
      snow: "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/654b48fd58d06fc04317d43f_ac_unit.svg",
      prcp: "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/655ecbeeba9dcaecec6bbc7f_icon-precipitation-light-blue.svg",
    };
  
    const formatDate = (date) => {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = date.getUTCDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    
    var currentDate = new Date();
    var currentMonth = currentDate.getUTCMonth() + 1; // Use getUTCMonth() to get the UTC month
    
    // Display the next 6 months starting from the current month plus 1 month
    for (var i = 1; i <= 6; i++) {
        var nextMonth = (currentMonth + i) % 12 || 12; // Calculate the next month, handling overflow
    
        // Get the month name in 3 letters
        var monthName = new Date(
            Date.UTC(currentDate.getUTCFullYear(), nextMonth - 1, 1) // Use Date.UTC() for UTC-based Date object
        ).toLocaleString("default", { month: "short" });
    
        // Get the year for each month separately
        var year =
            currentMonth + i > 12
            ? currentDate.getUTCFullYear() + 1 // Use getUTCFullYear() to get the UTC year
            : currentDate.getUTCFullYear();
    
        // Create a new button for each month
        var monthButton = $('<button class="btntab">');
    
        // Add data to the button
        monthButton.data("month", monthName);
        monthButton.data("year", year);
    
        // Append the result with classes to the button
        monthButton.append(
            '<span class="month">' +
            monthName +
            '</span> <span class="year">' +
            year +
            "</span>"
        );
    
        // Append the button to the months container
        $("#months-container").append(monthButton);
    }
  
    // Log the startDate and endDate of the first month on page load
    var firstMonth = $("#months-container button:first-child");
    var firstMonthName = firstMonth.data("month");
    var firstMonthYear = firstMonth.data("year");
    var firstMonthIndex = monthIndex(firstMonthName);
    
    targetMonth = firstMonthIndex + 1;
    yearForTargetMonth = firstMonthYear;
    // Get the start date of the first month
    var startDate = new Date(Date.UTC(firstMonthYear, monthIndex(firstMonthName), 1)); // Use Date.UTC() for UTC-based Date object
    var formattedStartDate = formatDate(startDate);
    
    // Get the end date (last day of the first month plus one day)
    var lastDay = new Date(Date.UTC(firstMonthYear, monthIndex(firstMonthName) + 1, 0)); // Use Date.UTC() for UTC-based Date object
    lastDay.setDate(lastDay.getDate() + 1);
    var formattedEndDate = formatDate(lastDay);
    
    // Display the result
    dateStart = formattedStartDate;
    dateEnd = formattedEndDate;
    $("#months-container button:first").addClass("active");
    
    // Add click event for monthButton
    $("#months-container").on("click", "button", function () {
        var clickedMonth = $(this).data("month");
        var clickedYear = $(this).data("year");
        // Remove the "active" class from all buttons
        $("#months-container button").removeClass("active");
    
        // Add the "active" class to the currently clicked button
        $(this).addClass("active");
        // Get the numerical index of the clicked month
        var clickedMonthIndex = monthIndex(clickedMonth);
        targetMonth = clickedMonthIndex + 1;
        yearForTargetMonth = clickedYear;
    
        // Get the start date of the clicked month
        var startDate = new Date(Date.UTC(clickedYear, monthIndex(clickedMonth), 1)); // Use Date.UTC() for UTC-based Date object
        var formattedStartDate = formatDate(startDate);
    
        // Get the end date (last day of the clicked month plus one day)
        var lastDay = new Date(Date.UTC(clickedYear, monthIndex(clickedMonth) + 1, 0)); // Use Date.UTC() for UTC-based Date object
        lastDay.setDate(lastDay.getDate() + 1);
        var formattedEndDate = formatDate(lastDay);
    
        // Display the result
        dateStart = formattedStartDate;
        dateEnd = formattedEndDate;
        $(".preloader").fadeIn("fast");
        fetchData(
            clickedLat,
            clickedLong,
            "tmax",
            temperatureUnit,
            dateStart,
            dateEnd,
        );
    });
    
  // Helper function to get the index of the month
function monthIndex(month) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.indexOf(month);
  }

    const getNormalsData = async (lat, lon, targetMonth, yearForTargetMonth) => {
      // Determine the units based on the temperatureUnit parameter
      const units = temperatureUnit === "°C" ? "metric" : "imperial";
  
      // Update the apiUrl with the units parameter
      const apiUrl = `https://api.weather2020.com/normals?lat=${lat}&lon=${lon}&units=${units}&month=${targetMonth}&year=${yearForTargetMonth}`;
  
      return await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
      })
        .then(async (result) => result.json().then(({ data }) => data))
        .catch((err) => console.error(err));
    };
  
    const getBackgroundColor = (result) => {
      switch (true) {
        case result >= -0.59 && result <= 0.59:
          return "average";
        case result >= 0.6 && result <= 3.39:
          return "above-average";
        case result >= 3.4 && result <= 6.09:
          return "much-above-average";
        case result >= 6.1:
          return "extreme-above-average";
        case result <= -0.6 && result >= -3.39:
          return "below-average";
        case result <= -3.4 && result >= -6.09:
          return "much-below-average";
        case result <= -6.1:
          return "extreme-below-average";
        default:
          return ""; // or handle other cases if needed
      }
    };
  
    let temperatureUnit = "°F";
    var currentDataType;
  
    const toggleTemperatureUnit = () => {
      // Get the state of the checkbox (checked or not)
      const isChecked = $("#temperatureUnitCheckbox").prop("checked");
  
      // Update the temperature unit based on the checkbox state
      isToggled = isChecked;
  
      temperatureUnit = isChecked ? "°C" : "°F";
  
      // Show preloader
      $(".preloader").fadeIn("fast");
  
      if (currentDataType === "tmax") {
        fetchData(
          clickedLat,
          clickedLong,
          "tmax",
          temperatureUnit,
          dateStart,
          dateEnd,
        );
      } else if (currentDataType === "tmin") {
        fetchData(
          clickedLat,
          clickedLong,
          "tmin",
          temperatureUnit,
          dateStart,
          dateEnd,
        );
      } else if (currentDataType === "snow") {
        fetchData(
          clickedLat,
          clickedLong,
          "snow",
          temperatureUnit,
          dateStart,
          dateEnd,
        );
      } else if (currentDataType === "prcp") {
        fetchData(
          clickedLat,
          clickedLong,
          "prcp",
          temperatureUnit,
          dateStart,
          dateEnd,
        );
      } else {
        fetchData(
          clickedLat,
          clickedLong,
          "tmax",
          temperatureUnit,
          dateStart,
          dateEnd,
        );
      }
    };
  
    // Attach change event to the temperature unit checkbox
    $("#temperatureUnitCheckbox").on("change", toggleTemperatureUnit);
  
    $("#temperatureUnitButton").on("click", toggleTemperatureUnit);
  
    const fetchData = async (lat, lon, dataType, temperatureUnit) => {
      // Determine the units based on the temperatureUnit parameter
      const units = temperatureUnit === "°C" ? "metric" : "imperial";
      currentDataType = dataType;
      // Update the apiUrl with the units parameter
      const apiUrl = `https://api.weather2020.com/forecasts?lat=${lat}&lon=${lon}&units=${units}&start_date=${dateStart}&end_date=${dateEnd}`;
  
      await getNormalsData(lat, lon, targetMonth, yearForTargetMonth).then(
        (fetchResult) => {
          $.ajax({
            url: apiUrl,
            type: "GET",
            beforeSend: (xhr) => xhr.setRequestHeader("X-API-Key", apiKey),
            success: ({ data }) => {
              const calendarContainer = $("#calendar");
              calendarContainer.empty();
              $(".preloader").fadeOut("fast");
              const monthsData = {};
  
         data.forEach((item) => {
                            const date = new Date(item.date);
                            const year = date.getUTCFullYear(); // Using getUTCFullYear() for UTC year
                            const month = date.getUTCMonth() + 1; // Using getUTCMonth() for UTC month
    
                            const key = `${year}-${String(month).padStart(2, "0")}`;
                            if (!monthsData[key]) {
                                monthsData[key] = [];
                            }
                            monthsData[key].push({
                                day: date.getUTCDate(),
                    tmax: item.tmax,
                    tmin: item.tmin,
                    snow: item.snow,
                    prcp: item.prcp,
                  });
                });
  
              for (let key in monthsData) {
                if (monthsData.hasOwnProperty(key)) {
                  const yearMonth = key.split("-");
                  const year = parseInt(yearMonth[0]);
                  const month = parseInt(yearMonth[1]);
  
                  if (month === targetMonth && year === yearForTargetMonth) {
                    const monthName = new Date(year, month - 1, 1).toLocaleString(
                      "default",
                      {
                        month: "long",
                      },
                    );
                    const calendarDays = [
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ];
                    const daysLength = calendarDays.length;
  
                    const monthTable = $('<table class="month-table"></table>');
                    monthTable.append(
                      `<thead>
                            <tr><th colspan="${daysLength}">${monthName} ${year}</th></tr>
                            <tr>${calendarDays
                              .map((d) => `<th>${d}</th>`)
                              .join("")}</tr>
                          </thead>`,
                    );
  
                    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate(); // Using Date.UTC() and getUTCDate() for UTC days in a month
                    const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // Using Date.UTC() and getUTCDay() for UTC day of the week
                    let dateCounter = 1; // No change needed for dateCounter
  
                    const tbody = $("<tbody></tbody>");
  
                    // Inside the loop for creating calendar days
                    for (let i = 0; i < daysLength - 1; i++) {
                      const row = $("<tr></tr>");
                      for (let j = 0; j < daysLength; j++) {
                        const updateBg = () => {
                          const cell = $("<td></td>");
                          cell.append(`<div class="date">${dateCounter}</div>`);
                          monthsData[key] &&
                            monthsData[key].forEach((item) => {
                              if (item.day === dateCounter) {
                                const isSnow = dataType === "snow";
                                const isPrcp = dataType === "prcp";
  
                                // Function to determine the background class based on data type
                                // Function to determine the background class based on data type
                                const determineBackgroundColor = (normalTmax) => {
                                  // Thresholds for snow and precipitation (prcp)
                                  const snowThresholdImperial = 0;
                                  const prcpThresholdImperial = 0;
  
                                  // Check if the units are metric
                                  if (units === "metric") {
                                    // Convert the imperial thresholds to metric (millimeters)
                                    const snowThresholdMetric =
                                      snowThresholdImperial * 25.4;
                                    const prcpThresholdMetric =
                                      prcpThresholdImperial * 25.4;
  
                                    if (isSnow) {
                                      return item[dataType] > snowThresholdMetric
                                        ? "snow-background"
                                        : "transparent";
                                    } else if (isPrcp) {
                                      return item[dataType] > prcpThresholdMetric
                                        ? "prcp-background"
                                        : "transparent";
                                    }
                                  } else {
                                    // Units are imperial
                                    if (isSnow) {
                                      return item[dataType] >
                                        snowThresholdImperial
                                        ? "snow-background"
                                        : "transparent";
                                    } else if (isPrcp) {
                                      return item[dataType] >
                                        prcpThresholdImperial
                                        ? "prcp-background"
                                        : "transparent";
                                    }
                                  }
  
                                  // For other cases (e.g., temperature), use the existing logic
                                  return getBackgroundColor(
                                    item[dataType] - normalTmax,
                                  );
                                };
  
                                const backgroundColor = determineBackgroundColor(
                                  fetchResult.find(
                                    (fr) =>
                                      fr.day === dateCounter &&
                                      fr.month === month,
                                  )[dataType],
                                );
  
                                const temperatureSymbol =
                                  temperatureUnit === "°C" ? "°C" : "°F";
                                const temperatureValue =
                                  temperatureUnit === "°C"
                                    ? item[dataType].toFixed(1)
                                    : Math.round(item[dataType]);
  
                                const precipitationSymbol =
                                  units === "imperial" ? "in" : "mm";
  
                                // For snow, convert to inches if metric, and adjust formatting
                                let snowValue =
                                  isSnow && units === "metric"
                                    ? (item[dataType] / 25.4).toFixed(2) // Convert to inches with 2 decimal places
                                    : item[dataType].toFixed(2); // Display snow value with 2 decimals
  
                                // If snow value has 2 or more decimal places, multiply by 10
                                snowValue =
                                  snowValue % 1 !== 0 &&
                                  snowValue.toString().split(".")[1].length >= 2
                                    ? snowValue * 10
                                    : snowValue;
  
                                // Ensure that snowValue has exactly 2 decimal places
                                snowValue = parseFloat(snowValue).toFixed(2);
  
                                const snowOpacity =
                                  isSnow && parseFloat(snowValue) < 0.5 ? 0 : 1;
  
                                // For prcp, display only 2 decimals
                                const prcpValue = isPrcp
                                  ? parseFloat(item[dataType]).toFixed(2)
                                  : item[dataType];
  
                                const imageSrc = svgLinks[dataType] || ""; // Use a default empty string if svgLinks[dataType] is undefined
  
                                if (["prcp", "snow"].includes(dataType)) {
                                  const toggledType = {
                                    prcp: prcpValue < (isToggled ? 1.27 : 0.05),
                                    snow: snowValue < 0.5,
                                  };
  
                                  if (toggledType[dataType]) return;
                                }
                                cell.append(`<div class="${dataType} ${backgroundColor}"> ${
                                  imageSrc &&
                                  item[dataType] !== 0 &&
                                  `<img src="${imageSrc}" alt="arrow" />`
                                }
      ${
        !isSnow && isPrcp
          ? `${prcpValue}${precipitationSymbol}`
          : !isSnow && !isPrcp
          ? `${temperatureValue}${temperatureSymbol}`
          : `${snowValue}${isPrcp ? precipitationSymbol : ""}`
      }
      </div>`);
                              }
                            });
  
                          row.append(cell);
                          dateCounter++;
                        };
  
                        i === 0 && j < firstDay
                          ? row.append("<td></td>")
                          : dateCounter <= daysInMonth
                          ? updateBg()
                          : row.append("<td></td>");
                      }
                      tbody.append(row);
                      if (dateCounter > daysInMonth) break;
                    }
                    monthTable.append(tbody);
                    calendarContainer.append(monthTable);
                  }
                }
              }
            },
            error: (_xhr, _status, error) => console.error(error),
          });
        },
      );
    };
    // Button click event handlers
    $("#tmaxButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      $("#snow-label").removeClass("is-active");
      $("#prcp-label").removeClass("is-active");
      $("#tmax-label").addClass("is-active");
      $("#tmin-label").removeClass("is-active");
      $(".temp-unit-wrapper.main").css("display", "flex");
      $(".legend-label.temp-unit").css("display", "block");
      $(".legend-label.prc-unit").css("display", "none");
      fetchData(
        clickedLat,
        clickedLong,
        "tmax",
        temperatureUnit,
        dateStart,
        dateEnd,
      );
    });
  
    $("#tminButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      $("#snow-label").removeClass("is-active");
      $("#prcp-label").removeClass("is-active");
      $("#tmax-label").removeClass("is-active");
      $("#tmin-label").addClass("is-active");
      $(".temp-unit-wrapper.main").css("display", "flex");
      $(".legend-label.temp-unit").css("display", "block");
      $(".legend-label.prc-unit").css("display", "none");
      fetchData(
        clickedLat,
        clickedLong,
        "tmin",
        temperatureUnit,
        dateStart,
        dateEnd,
      );
    });
  
    $("#snowButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      $("#snow-label").addClass("is-active");
      $("#prcp-label").removeClass("is-active");
      $("#tmax-label").removeClass("is-active");
      $("#tmin-label").removeClass("is-active");
      $(".temp-unit-wrapper.main").css("display", "none");
      $(".legend-label.temp-unit").css("display", "block");
      $(".legend-label.prc-unit").css("display", "none");
      fetchData(
        clickedLat,
        clickedLong,
        "snow",
        temperatureUnit,
        dateStart,
        dateEnd,
      );
    });
  
    $("#prcpButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      $("#snow-label").removeClass("is-active");
      $("#prcp-label").addClass("is-active");
      $("#tmax-label").removeClass("is-active");
      $("#tmin-label").removeClass("is-active");
      $(".temp-unit-wrapper.main").css("display", "flex");
      $(".legend-label.temp-unit").css("display", "none");
      $(".legend-label.prc-unit").css("display", "block");
      fetchData(
        clickedLat,
        clickedLong,
        "prcp",
        temperatureUnit,
        dateStart,
        dateEnd,
      );
    });
  });
