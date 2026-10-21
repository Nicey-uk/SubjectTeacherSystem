
const API_URL = "/api/allocations";

const methodInput = document.getElementById("method");
const idInput = document.getElementById("recordId");
const teacherInput = document.getElementById("teacher");
const subjectInput = document.getElementById("subject");
const sectionInput = document.getElementById("section");
const dataFields = document.getElementById("dataFields");
const responseBox = document.getElementById("response");
const statusBox = document.getElementById("status");
const recordsBody = document.getElementById("records");

function updateForm() {
  const method = methodInput.value;
  dataFields.hidden = method === "GET" || method === "DELETE";
  idInput.required = method === "PUT";
}

methodInput.addEventListener("change", updateForm);
updateForm();

async function sendRequest(method, id = "", body = null) {
  const url = id
    ? `${API_URL}/${encodeURIComponent(id)}`
    : API_URL;

  const options = {
    method,
    headers: {
      "X-System-Name": "System 2"
    }
  };

  if (body !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  responseBox.textContent = JSON.stringify({
    status: response.status,
    ok: response.ok,
    response: data
  }, null, 2);

  if (!response.ok) {
    throw new Error(data.error || "API request failed.");
  }

  return data;
}

async function loadRecords() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Could not load records.");

    const records = await response.json();
    recordsBody.replaceChildren();

    if (records.length === 0) {
      recordsBody.innerHTML =
        "<tr><td colspan='4'>No records found.</td></tr>";
      return;
    }

    records.forEach(item => {
      const row = document.createElement("tr");

      [item.id, item.teacher_name, item.subject_name, item.section_name]
        .forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });

      recordsBody.appendChild(row);
    });
  } catch (error) {
    recordsBody.innerHTML =
      "<tr><td colspan='4'>Could not load records. Check the server.</td></tr>";
  }
}

document.getElementById("sendButton").addEventListener("click", async () => {
  const method = methodInput.value;
  const id = method === "PUT" || method === "DELETE" || method === "GET"
  ? idInput.value.trim()
  : "";

  if ((method === "PUT" || method === "DELETE") && !id) {
    statusBox.textContent = "Please enter a record ID.";
    return;
  }

  if (method === "GET" && id) {
    // GET a single record
  }

  let body = null;

  if (method === "POST" || method === "PUT") {
    body = {
      teacher_name: teacherInput.value.trim(),
      subject_name: subjectInput.value.trim(),
      section_name: sectionInput.value.trim()
    };

    if (!body.teacher_name || !body.subject_name || !body.section_name) {
      statusBox.textContent = "Please fill in all three fields.";
      return;
    }
  }

  if (method === "DELETE" &&
      !confirm(`Delete allocation ID ${id}?`)) {
    return;
  }

  try {
    statusBox.textContent = "Sending request...";

    await sendRequest(method, id, body);

    statusBox.textContent = `${method} request successful!`;
    await loadRecords();
  } catch (error) {
    statusBox.textContent = error.message;
  }
});

document.getElementById("getAllButton").addEventListener("click", async () => {
  try {
    statusBox.textContent = "Loading all records...";
    await sendRequest("GET");
    statusBox.textContent = "GET all records successful!";
    await loadRecords();
  } catch (error) {
    statusBox.textContent = error.message;
  }
});

loadRecords();
