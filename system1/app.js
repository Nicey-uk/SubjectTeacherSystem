
const API_URL = "/api/allocations";

const form = document.getElementById("allocationForm");
const idInput = document.getElementById("allocationId");
const teacherInput = document.getElementById("teacher");
const subjectInput = document.getElementById("subject");
const sectionInput = document.getElementById("section");
const table = document.getElementById("allocationTable");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formTitle = document.getElementById("formTitle");

async function requestAPI(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-System-Name": "System 1",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

async function loadAllocations() {
  table.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  try {
    const allocations = await requestAPI(API_URL);

    table.innerHTML = "";

    if (allocations.length === 0) {
      table.innerHTML =
        "<tr><td colspan='5'>No allocation records yet.</td></tr>";
      return;
    }

    allocations.forEach(item => {
      const row = document.createElement("tr");

      [
        item.id,
        item.teacher_name,
        item.subject_name,
        item.section_name
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actions = document.createElement("td");

      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => editAllocation(item));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "danger";
      deleteButton.addEventListener("click", () => deleteAllocation(item.id));

      actions.append(editButton, deleteButton);
      row.appendChild(actions);
      table.appendChild(row);
    });
  } catch (error) {
    table.innerHTML =
      "<tr><td colspan='5'>Could not load records.</td></tr>";
    message.textContent = error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const id = idInput.value;

  const allocation = {
    teacher_name: teacherInput.value.trim(),
    subject_name: subjectInput.value.trim(),
    section_name: sectionInput.value.trim()
  };

  try {
    if (id) {
      await requestAPI(`${API_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(allocation)
      });

      message.textContent = "Allocation updated successfully!";
    } else {
      await requestAPI(API_URL, {
        method: "POST",
        body: JSON.stringify(allocation)
      });

      message.textContent = "Allocation added successfully!";
    }

    resetForm();
    await loadAllocations();
  } catch (error) {
    message.textContent = error.message;
  }
});

function editAllocation(item) {
  idInput.value = item.id;
  teacherInput.value = item.teacher_name;
  subjectInput.value = item.subject_name;
  sectionInput.value = item.section_name;

  formTitle.textContent = "Edit Allocation";
  saveButton.textContent = "Save Changes";
  cancelButton.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteAllocation(id) {
  if (!confirm("Are you sure you want to delete this allocation?")) {
    return;
  }

  try {
    await requestAPI(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    message.textContent = "Allocation deleted successfully!";
    await loadAllocations();
  } catch (error) {
    message.textContent = error.message;
  }
}

function resetForm() {
  form.reset();
  idInput.value = "";
  formTitle.textContent = "Add New Allocation";
  saveButton.textContent = "Add Allocation";
  cancelButton.hidden = true;
}

cancelButton.addEventListener("click", resetForm);
document.getElementById("refreshButton").addEventListener("click", loadAllocations);

loadAllocations();
