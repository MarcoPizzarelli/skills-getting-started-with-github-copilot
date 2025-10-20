document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          // Crea la lista dei partecipanti come elenco puntato
        let participantsHTML = '';
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Partecipanti iscritti:</strong>
              <div class="participants-list">
                ${details.participants.map(p => `
                  <span class="participant-item" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}">
                    <span class="participant-email">${p}</span>
                    <span class="delete-participant" title="Rimuovi partecipante">&times;</span>
                  </span>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Partecipanti iscritti:</strong>
              <p class="no-participants">Nessun partecipante ancora</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Listener per cancellazione partecipante
        const deleteIcons = activityCard.querySelectorAll('.delete-participant');
        deleteIcons.forEach(icon => {
          icon.addEventListener('click', async (e) => {
            const participantItem = e.target.closest('.participant-item');
            const email = decodeURIComponent(participantItem.getAttribute('data-email'));
            const activity = decodeURIComponent(participantItem.getAttribute('data-activity'));
            if (confirm(`Vuoi davvero rimuovere ${email} da "${activity}"?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });
                const result = await response.json();
                if (response.ok) {
                  fetchActivities();
                } else {
                  alert(result.detail || 'Errore nella rimozione del partecipante');
                }
              } catch (error) {
                alert('Errore di rete nella rimozione del partecipante');
              }
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Aggiorna la lista delle attività senza ricaricare la pagina
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
