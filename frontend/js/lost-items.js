document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lostItemForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const itemName = document.getElementById("itemName").value;
    const description = document.getElementById("itemDescription").value;
    const location = document.getElementById("location").value;
    const dateLost = document.getElementById("dateLost").value;
    const contact = document.getElementById("contactInfo").value;

    const data = {
      itemName,
      description,
      location,
      dateLost,
      contact,
    };

    fetch("http://localhost:5000/api/lost-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
      alert("✅ Lost item submitted successfully!");
      form.reset();
    })
    .catch(error => {
      console.error("Error:", error);
      alert("❌ Something went wrong while submitting the form.");
    });
  });
});
