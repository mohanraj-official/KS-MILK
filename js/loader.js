document.addEventListener("readystatechange", () => {
  const loader = document.getElementById("loader");

  // When page is fully loaded (including Firebase, images, etc.)
  if (document.readyState === "complete") {
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 500);
  }
});

// Safety: hide loader after 6 seconds even if something goes wrong
setTimeout(() => {
  const loader = document.getElementById("loader");
  if (loader && !loader.classList.contains("hidden")) {
    loader.classList.add("hidden");
  }
}, 6000);
