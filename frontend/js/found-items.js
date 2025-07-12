document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("foundItemForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const itemName = document.getElementById("itemName").value;
    const description = document.getElementById("itemDescription").value;
    const location = document.getElementById("locationFound").value;
    const dateFound = document.getElementById("dateFound").value;
    const contact = document.getElementById("contactInfo").value;

    const data = {
      itemName,
      description,
      location,
      dateFound,
      contact
    };

    fetch("http://localhost:5000/api/found-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(response => {
        alert("✅ Found item submitted successfully!");
        form.reset();
        loadFoundItems(); // refresh the list
      })
      .catch(err => {
        console.error("❌ Submission failed:", err);
        alert("Something went wrong. Try again.");
      });
  });

  // Load and display all found items
  function loadFoundItems() {
    fetch("http://localhost:5000/api/found-items")
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById("foundItemsList");
        list.innerHTML = "";

        if (data.length === 0) {
          list.innerHTML = "<p>No found items submitted yet.</p>";
          return;
        }

        data.forEach(item => {
          const div = document.createElement("div");
          div.classList.add("lost-item"); // reuse style
          div.innerHTML = `
            <h3>${item.itemName}</h3>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Location:</strong> ${item.location}</p>
            <p><strong>Date Found:</strong> ${item.dateFound}</p>
            <p><strong>Contact:</strong> ${item.contact}</p>
            <hr>
          `;
          list.appendChild(div);
        });
      })
      .catch(err => {
        console.error("❌ Failed to load found items:", err);
      });
  }

  loadFoundItems();
});
