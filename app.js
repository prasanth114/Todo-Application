const express = require("express");
const path = require("path");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () =>
      console.log("Server Running At: http://localhost:3000")
    );
  } catch (error) {
    console.log(`Data Base Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectIntoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    dueDate: dbObject.due_date,
    status: dbObject.status,
  };
};

const objectVerifying = async (request, response, next) => {
  const { status, priority, category, todo, dueDate } = request.body;
  const valuesArray = [
    "HIGH",
    "MEDIUM",
    "LOW",
    "TO DO",
    "IN PROGRESS",
    "DONE",
    "WORK",
    "HOME",
    "LEARNING",
  ];
  if (status !== undefined && valuesArray.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== undefined &&
    valuesArray.includes(priority) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== undefined &&
    valuesArray.includes(category) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== undefined && isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const quireVerifying = async (request, response, next) => {
  const { status, priority, category, date } = request.query;
  const valuesArray = [
    "HIGH",
    "MEDIUM",
    "LOW",
    "TO DO",
    "IN PROGRESS",
    "DONE",
    "WORK",
    "HOME",
    "LEARNING",
  ];
  if (status !== undefined && valuesArray.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== undefined &&
    valuesArray.includes(priority) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== undefined &&
    valuesArray.includes(category) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (date !== undefined && isValid(new Date(date)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

app.get("/todos/", quireVerifying, async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;

  let filterQuery;
  switch (true) {
    case status !== undefined && priority !== undefined:
      filterQuery = `SELECT * FROM todo WHERE status = "${status}" and priority = "${priority}"`;
      break;
    case status !== undefined:
      filterQuery = `SELECT * FROM todo WHERE status = "${status}"`;
      break;
    case priority !== undefined:
      filterQuery = `SELECT * FROM todo WHERE priority = "${priority}"`;
      break;
    case category !== undefined && priority !== undefined:
      filterQuery = `SELECT * FROM todo WHERE category = "${category}" and priority = "${priority}"`;
      break;
    case category !== undefined && status !== undefined:
      filterQuery = `SELECT * FROM todo WHERE category = "${category}" and status = "${status}"`;
      break;
    case category !== undefined:
      filterQuery = `SELECT * FROM todo WHERE category = "${category}"`;
      break;
    case search_q !== undefined:
      filterQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"`;
      break;
  }
  const result = await db.all(filterQuery);
  response.send(
    result.map((eachTodo) => convertDbObjectIntoResponseObject(eachTodo))
  );
});

app.get("/todos/:todoId/", quireVerifying, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const result = await db.get(getTodoQuery);
  response.send(convertDbObjectIntoResponseObject(result));
});

app.get("/agenda/", quireVerifying, async (request, response) => {
  const dateFormat = format(new Date(request.query.date), "yyyy-MM-dd");
  const getAgendaQuery = `SELECT * FROM todo WHERE due_date = "${dateFormat}"`;
  const result = await db.all(getAgendaQuery);
  response.send(
    result.map((eachObject) => convertDbObjectIntoResponseObject(eachObject))
  );
});

app.post("/todos/", objectVerifying, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const addTodoQuery = `
  INSERT INTO
    todo(id,todo, priority, status, category, due_date)
  VALUES
    (${id}, "${todo}", "${priority}", "${status}", "${category}", "${dueDate}")`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", objectVerifying, async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  let updateQuery;
  switch (true) {
    case status !== undefined:
      updateQuery = `UPDATE todo SET status = "${status}" WHERE id = ${todoId}`;
      await db.run(updateQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateQuery = `UPDATE todo SET priority = "${priority}" WHERE id = ${todoId}`;
      await db.run(updateQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateQuery = `UPDATE todo SET todo = "${todo}" WHERE id = ${todoId}`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      updateQuery = `UPDATE todo SET todo = "${category}" WHERE id = ${todoId}`;
      await db.run(updateQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      updateQuery = `UPDATE todo SET due_date = "${dueDate}" WHERE id = ${todoId}`;
      await db.run(updateQuery);
      response.send("Due Date Updated");
      break;
  }
});

app.delete("/todos/:todoId", quireVerifying, async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const a = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
