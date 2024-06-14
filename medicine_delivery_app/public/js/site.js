document.querySelectorAll(".product-item-btn").forEach((item) => {
  item.addEventListener("click", addToCart);
});

document.querySelectorAll(".product-quantity").forEach((item) => {
  item.addEventListener("input", recalculateTotal);
});

document.querySelectorAll(".remove-product").forEach((item) => {
  item.addEventListener("click", removeFromCart);
});

document.querySelectorAll(".search-btn").forEach((item) => {
  item.addEventListener("click", searchOrderedProducts);
});

document.querySelectorAll("couponsModalBtn").forEach((item) => {
  item.addEventListener("click", searchOrderedProducts);
});

let modalInstance = null;
let isRecaptchaValidated = false;
const saveCouponBtn = document.getElementById("coupon-btn");
const openCouponModualBtn = document.getElementById("coupons-modal-btn");
const localStorageProducts = "addToCartStatus";

if (saveCouponBtn != null) {
  saveCouponBtn.addEventListener("click", checkCoupon);
}

if (openCouponModualBtn != null) {
  openCouponModualBtn.addEventListener("click", checkCouponModel);
}

function recalculateTotal(e) {
  var inputs = document.getElementsByClassName("product-quantity");
  let totalSum = 0;

  for (var i = 0; i < inputs.length; i++) {
    let quantity = inputs[i].value;
    let productId = inputs[i].id;
    let hiddenInputId = `product-${productId}-quantity`;
    let hiddenElement = document.getElementById(hiddenInputId);
    hiddenElement.value = quantity;
    totalSum += Number(quantity) * Number(inputs[i].getAttribute("data-price"));
  }

  const discountElement = document.getElementById("couponDiscount");
  const discountStringValue = discountElement.value;
  const discount = discountStringValue
    ? Number(discountStringValue)
    : undefined;

  if (discount) {
    totalSum = Math.floor(totalSum - (totalSum * discount) / 100);
  }

  let span = document.getElementById("totalPrice");
  span.innerHTML = totalSum;
}

function ckeckCartProducts() {
  const elements = document.getElementsByClassName("product-item-btn");
  const orderResultContainer = document.getElementById("order-result");

  if (elements && elements.length) {
    const productsArrayString = localStorage.getItem(localStorageProducts);
    let productsArray = JSON.parse(productsArrayString);

    if (!productsArray) {
      return;
    }

    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      const id = element.getAttribute("data-id");

      if (productsArray.some((x) => x == id)) {
        element.disabled = true;
        element.style.backgroundColor = "red";
        element.getElementsByTagName("i")[0].className = "icon-bag";
      }
    }
  }

  if (orderResultContainer) {
    const result = orderResultContainer.getAttribute("data-result");

    if (result == "true") {
      localStorage.setItem(localStorageProducts, []);
    }
  }
}

async function addToCart(event) {
  const element = event.target;
  const url = element.getAttribute("data-url");

  if (url) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      element.disabled = true;
      element.style.backgroundColor = "red";
      element.getElementsByTagName("i")[0].className = "icon-bag";

      addProductToLocalStorage(element);
    } catch (error) {
    }
  }
}

function addProductToLocalStorage(element) {
  const id = element.getAttribute("data-id");
  const productsArrayString = localStorage.getItem(localStorageProducts);
  let productsArray = JSON.parse(productsArrayString);

  if (!productsArray) {
    productsArray = [];
  }

  productsArray.push(id);
  const finalArrayString = JSON.stringify(productsArray);
  localStorage.removeItem(localStorageProducts);
  localStorage.setItem(localStorageProducts, finalArrayString);
}

function removeProductFromLocalStorage(element) {
  const id = element.getAttribute("data-id");
  const productsArrayString = localStorage.getItem(localStorageProducts);
  let productsArray = JSON.parse(productsArrayString);

  if (!productsArray) {
    productsArray = [];
  }

  if (productsArray.some((x) => x == id)) {
    productsArray = productsArray.filter((x) => x != id);
  }

  const finalArrayString = JSON.stringify(productsArray);
  localStorage.removeItem(localStorageProducts);
  localStorage.setItem(localStorageProducts, finalArrayString);
}

async function removeFromCart(event) {
  const btnElement = event.target;
  const url = btnElement.getAttribute("data-url");

  if (url) {
    try {
      let requestOptions = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      };

      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (data.message) {
        alert(data.message);
      }

      if (data.id) {
        let divIdentificator = `product-${data.id}`;
        let productElememt = document.getElementById(divIdentificator);
        removeProductFromLocalStorage(btnElement);
        productElememt.remove();
        recalculateTotal();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

function validateInputValue(elementId) {
  const element = document.getElementById(elementId);

  if (!element) {
    return undefined;
  }

  let value;

  if (!element.value || !element.value.length) {
    element.classList.add("is-invalid");
    value = undefined;
  } else {
    element.classList.remove("is-invalid");
    value = element.value;
  }

  return value;
}

async function searchOrderedProducts(event) {
  const element = event.target;
  const url = element.getAttribute("data-url");
  const emailValue = validateInputValue("email");
  const phoneValue = validateInputValue("phone");

  if (url && emailValue && phoneValue) {
    try {
      let requestBody = {
        email: emailValue,
        phone: phoneValue,
      };

      let requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      };

      const response = await fetch(url, requestOptions);

      const htmlTable = await response.text();

      const tableContainer = document.getElementById("history-table");
      tableContainer.innerHTML = htmlTable;
    } catch (error) {
    }
  }
}

async function checkCouponModel() {
  modalInstance = new bootstrap.Modal("#couponModal");
  modalInstance.show();
}

async function checkCoupon(event) {
  const codeValue = validateInputValue("couponCode");
  const btnElement = event.target;
  const url = btnElement.getAttribute("data-url");
  const couponIdInput = document.getElementById("couponId");
  const couponDiscountInput = document.getElementById("couponDiscount");
  const couponDetailsSpan = document.getElementById("coupon-details");

  if (codeValue && url) {
    let requestBody = {
      code: codeValue,
    };

    let requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    };

    const response = await fetch(url, requestOptions);
    const responseObj = await response.json();

    if (responseObj.isValid) {
      couponIdInput.value = responseObj.id;
      couponDiscountInput.value = responseObj.couponDiscount;
      recalculateTotal();
      couponDetailsSpan.innerHTML = responseObj.coupnonTitle;

      if (modalInstance) {
        modalInstance.hide();
      }

      return;
    } else {
      const element = document.getElementById("couponCode");
      element.classList.add("is-invalid");
    }
  }

  couponIdInput.value = "";
  couponDiscountInput.value = "";
  couponDetailsSpan.innerHTML = "";
  recalculateTotal();
}

document.addEventListener("DOMContentLoaded", function () {
  const copyBtns = document.querySelectorAll(".copy-btn");

  copyBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const couponCode = this.getAttribute("data-url");
      copyToClipboard(couponCode);
    });
  });

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Coupon code copied to clipboard: " + text);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }
});

document.addEventListener("DOMContentLoaded", checkRecupcha());

let map;
let marker;
let directionsService;
let directionsRenderer;
let routePolyline; 

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  const mapElements = document.querySelectorAll(".shop-item");

  if (mapElements.length > 0) {
    let firstElem = mapElements[0];
    const latitude1 = parseFloat(firstElem.getAttribute("data-latitude"));
    const longitude1 = parseFloat(firstElem.getAttribute("data-longitude"));

    map = new Map(document.getElementById("map"), {
      zoom: 10,
      center: { lat: latitude1, lng: longitude1 },
      mapId: "DEMO_MAP_ID",
    });

    for (var i = 0; i < mapElements.length; i++) {
      const mapElement = mapElements[i];
      const id = parseInt(mapElement.getAttribute("data-id"));
      const latitude = parseFloat(mapElement.getAttribute("data-latitude"));
      const longitude = parseFloat(mapElement.getAttribute("data-longitude"));
      const name = mapElement.getAttribute("data-name");

      new AdvancedMarkerElement({
        map: map,
        position: { lat: latitude, lng: longitude },
        title: name,
      });
    }

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    map.addListener("click", function (event) {
      placeMarkerAndPanTo(event.latLng, map);
    });
  } else {
    
    var mapContainer = document.getElementById("map-container");
    mapContainer.innerHTML = `
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d169794.07259955906!2d25.769109731397695!3d48.32145859124088!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473407dadce32d8b%3A0x16962b85f17a97e2!2z0KfQtdGA0L3RltCy0YbRliwg0KfQtdGA0L3RltCy0LXRhtGM0LrQsCDQvtCx0LvQsNGB0YLRjCwgNTgwMDA!5e0!3m2!1suk!2sua" 
            width="650" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        `;
  }
}

function placeMarkerAndPanTo(latLng, map) {
  if (marker) {
    marker.setPosition(latLng); 
  } else {
    marker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: "My coordinates",
      icon: {
        url: "/images/vector-icon.jpg", 
        scaledSize: new google.maps.Size(40, 40), 
      },
    });
  }

  map.panTo(latLng);

  const addressInput = document.getElementById("address");
  const coordinates = latLng.lat() + ", " + latLng.lng();
  addressInput.value = coordinates;

  const selectElement = document.getElementById("selectid");
  const option = document.createElement("option");
  option.value = coordinates;
  option.text = "Coordinates: " + coordinates;
  selectElement.appendChild(option);
}

function calculateAndDisplayRoute() {
  const selectedOption = document.getElementById("selectid").value;
  const selectedCoords = selectedOption.split(", ");
  const selectedLat = parseFloat(selectedCoords[0]);
  const selectedLng = parseFloat(selectedCoords[1]);
  const selectedLatLng = new google.maps.LatLng(selectedLat, selectedLng);

  const destination = selectedLatLng;

  if (routePolyline) {
    routePolyline.setMap(null);
  }

  const shopCoordinates = [];

  document.querySelectorAll(".shop-item").forEach((shop) => {
    const shopLat = parseFloat(shop.getAttribute("data-latitude"));
    const shopLng = parseFloat(shop.getAttribute("data-longitude"));
    const shopLatLng = new google.maps.LatLng(shopLat, shopLng);
    shopCoordinates.push(shopLatLng);
  });

  shopCoordinates.forEach((coordinate) => {
    const routeCoordinates = [coordinate, destination];
    const routePolyline = new google.maps.Polyline({
      path: routeCoordinates,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    routePolyline.setMap(map);
  });
}

function onRecaptchaSuccess() {
  isRecaptchaValidated = true;
  document.getElementById('alert-danger').style.visibility = 'hidden';
}

function onRecaptchaError() {  
  document.getElementById('alert-danger').style.visibility = 'visible';
}

function onRecaptchaResponseExpiry() {
  onRecaptchaError();
}

function checkRecupcha() {
  const buyForm = document.getElementById('buy-form');

  if(!buyForm) {
    return;
  }

  buyForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!isRecaptchaValidated) {
      onRecaptchaError();

      return;
    }

    console.log('recapcha success');
    buyForm.submit();
  });  
}