function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("show");
}

//place order script
const form = document.getElementById("orderForm");
const popup = document.getElementById("popup");

form.addEventListener("submit", function (e) {
  e.preventDefault(); // stop actual submit
  popup.style.display = "flex"; // show popup
});

function closePopup() {
  popup.style.display = "none";
  form.reset(); // reset after closing
}





// confirm order script
function showSuccess() {
  document.getElementById("successPopup").style.display = "flex";
}
function closePopup() {
  document.getElementById("successPopup").style.display = "none";
  window.location.href = "index.html"; // redirect home
}
