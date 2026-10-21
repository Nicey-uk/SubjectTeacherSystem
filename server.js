
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, "data");
const ALLOCATIONS_FILE = path.join(DATA_DIR, "allocations.json");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

async function readJSON(file) {
  const content = await fs.readFile(file, "utf8");
  return JSON.parse(content);
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function recordEvent(action, allocation, source) {
  const data = await readJSON(EVENTS_FILE);

  const event = {
    id: data.next_id,
    action,
    source,
    allocation_id: allocation.id,
    message: `${action} allocation: ${allocation.subject_name} - ${allocation.teacher_name}`,
    timestamp: new Date().toISOString()
  };

  data.events.unshift(event);
  data.next_id++;
  await writeJSON(EVENTS_FILE, data);

  return event;
}

app.get("/", (req, res) => {
  res.json({
    message: "Subject and Teacher Allocation API is running",
    endpoints: [
      "GET /api/allocations",
      "GET /api/allocations/:id",
      "POST /api/allocations",
      "PUT /api/allocations/:id",
      "DELETE /api/allocations/:id",
      "GET /api/events"
    ]
  });
});

// GET: Show all allocations
app.get("/api/allocations", async (req, res) => {
  try {
    const data = await readJSON(ALLOCATIONS_FILE);
    res.json(data.allocations);
  } catch (error) {
    res.status(500).json({ error: "Could not read allocations." });
  }
});

// GET: Show one allocation
app.get("/api/allocations/:id", async (req, res) => {
  try {
    const data = await readJSON(ALLOCATIONS_FILE);
    const item = data.allocations.find(
      a => a.id === Number(req.params.id)
    );

    if (!item) {
      return res.status(404).json({ error: "Allocation not found." });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Could not read allocation." });
  }
});

// POST: Create an allocation
app.post("/api/allocations", async (req, res) => {
  try {
    const { teacher_name, subject_name, section_name } = req.body;

    if (!teacher_name || !subject_name || !section_name) {
      return res.status(400).json({
        error: "Teacher, subject, and section are required."
      });
    }

    const data = await readJSON(ALLOCATIONS_FILE);

    const allocation = {
      id: data.next_id,
      teacher_name: String(teacher_name).trim(),
      subject_name: String(subject_name).trim(),
      section_name: String(section_name).trim()
    };

    data.allocations.push(allocation);
    data.next_id++;

    await writeJSON(ALLOCATIONS_FILE, data);
    const event = await recordEvent("CREATED", allocation, req.get("X-System-Name") || "System 1");

    res.status(201).json({ allocation, event });
  } catch (error) {
    res.status(500).json({ error: "Could not create allocation." });
  }
});

// PUT: Update an allocation
app.put("/api/allocations/:id", async (req, res) => {
  try {
    const data = await readJSON(ALLOCATIONS_FILE);
    const item = data.allocations.find(
      a => a.id === Number(req.params.id)
    );

    if (!item) {
      return res.status(404).json({ error: "Allocation not found." });
    }

    const { teacher_name, subject_name, section_name } = req.body;

    if (!teacher_name || !subject_name || !section_name) {
      return res.status(400).json({
        error: "Teacher, subject, and section are required."
      });
    }

    item.teacher_name = String(teacher_name).trim();
    item.subject_name = String(subject_name).trim();
    item.section_name = String(section_name).trim();

    await writeJSON(ALLOCATIONS_FILE, data);
    const event = await recordEvent("UPDATED", item, req.get("X-System-Name") || "System 1");

    res.json({ allocation: item, event });
  } catch (error) {
    res.status(500).json({ error: "Could not update allocation." });
  }
});

// DELETE: Remove an allocation
app.delete("/api/allocations/:id", async (req, res) => {
  try {
    const data = await readJSON(ALLOCATIONS_FILE);
    const index = data.allocations.findIndex(
      a => a.id === Number(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({ error: "Allocation not found." });
    }

    const removed = data.allocations[index];
    data.allocations.splice(index, 1);
    
    data.allocations.forEach((allocation, index) => {
    allocation.id = index + 1;
    });

    data.next_id = data.allocations.length + 1;

    await writeJSON(ALLOCATIONS_FILE, data);
    const event = await recordEvent("DELETED", removed, req.get("X-System-Name") || "System 1");

    res.json({ message: "Allocation deleted.", event });
  } catch (error) {
    res.status(500).json({ error: "Could not delete allocation." });
  }
});

// GET: Subscriber notification history
app.get("/api/events", async (req, res) => {
  try {
    const data = await readJSON(EVENTS_FILE);
    res.json(data.events);
  } catch (error) {
    res.status(500).json({ error: "Could not read events." });
  }
});

// Pages for the three systems
app.get("/system1", (req, res) => {
  res.sendFile(path.join(__dirname, "system1", "index.html"));
});

app.get("/system2", (req, res) => {
  res.sendFile(path.join(__dirname, "system2", "index.html"));
});

app.get("/system3", (req, res) => {
  res.sendFile(path.join(__dirname, "system3", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
