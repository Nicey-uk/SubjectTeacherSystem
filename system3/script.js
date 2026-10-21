
const API_URL = "http://localhost:3000/api/events";

async function loadEvents() {
    const status = document.getElementById("status");
    const table = document.getElementById("eventsTable");

    status.textContent = "Loading events...";
    table.innerHTML = "";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("HTTP error: " + response.status);
        }

        const events = await response.json();

        if (!Array.isArray(events)) {
            throw new Error("Expected an array of events.");
        }

        document.getElementById("totalEvents").textContent =
            events.length;

        document.getElementById("createdEvents").textContent =
            events.filter(e => e.action === "CREATED").length;

        document.getElementById("updatedEvents").textContent =
            events.filter(e => e.action === "UPDATED").length;

        document.getElementById("deletedEvents").textContent =
            events.filter(e => e.action === "DELETED").length;

        for (const event of events) {
            const row = document.createElement("tr");

            const values = [
                event.id,
                event.action,
                event.source,
                event.message,
                new Date(event.timestamp).toLocaleString()
            ];

            values.forEach((value, index) => {
                const cell = document.createElement("td");

                if (index === 1) {
                    const badge = document.createElement("span");
                    badge.className = "badge " + event.action;
                    badge.textContent = event.action;
                    cell.appendChild(badge);
                } else {
                    cell.textContent = value ?? "";
                }

                row.appendChild(cell);
            });

            table.appendChild(row);
        }

        status.textContent = "Events loaded successfully.";
    } catch (error) {
        console.error(error);
        status.textContent =
            "Could not load events. Check if the API server is running and CORS is enabled.";
    }
}

document.getElementById("refreshBtn")
    .addEventListener("click", loadEvents);

loadEvents();
