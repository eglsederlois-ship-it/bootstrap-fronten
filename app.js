console.log("App geladen");

// Feature 1: Zufälliges Katzenbild
const catBtn = document.getElementById("cat-btn");
const catOutput = document.getElementById("cat-output");

catBtn.addEventListener("click", async () => {
  catOutput.textContent = "Lädt...";

  try {
    const response = await fetch("https://api.thecatapi.com/v1/images/search");
    const data = await response.json();
    const imageUrl = data[0].url;

    catOutput.innerHTML = `<img src="${imageUrl}" alt="Zufällige Katze" class="img-fluid rounded">`;
  } catch (error) {
    catOutput.textContent = "Fehler beim Laden 😿";
    console.error(error);
  }
});
