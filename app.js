const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const { format, parse, isValid } = require("date-fns");
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeServerAndDbConnection = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3003, () => {});
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeServerAndDbConnection();

//API 1
const bothPriorityAndStatus = (objects) => {
  return objects.priority !== undefined && objects.status !== undefined;
};
const bothCategoryAndStatus = (objects) => {
  return objects.category !== undefined && objects.status !== undefined;
};
const bothCategoryAndPriority = (objects) => {
  return objects.category !== undefined && objects.priority !== undefined;
};
const hasPriority = (objects) => {
  return objects.priority !== undefined;
};
const hasCategory = (objects) => {
  return objects.category !== undefined;
};
const hasStatus = (objects) => {
  return objects.status !== undefined;
};

const hasTodo = (objects) => {
  return objects.todo !== undefined;
};

const hasDueDate = (objects) => {
  return objects.dueDate !== undefined;
};

const getStatusOutput = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let dbQuery = "";
  let data = null;

  const { search_q = "", priority, status, category, dueDate } = request.query;

  switch (true) {
    case bothPriorityAndStatus(request.query):
      dbQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
      data = await db.all(dbQuery);
      response.status(200);
      response.send(data.map((each) => getStatusOutput(each)));
      break;
    case hasPriority(request.query):
      if (
        request.query.priority === "HIGH" ||
        request.query.priority === "MEDIUM" ||
        request.query.priority === "LOW"
      ) {
        dbQuery = `SELECT * FROM todo WHERE  priority = '${priority}';`;
        data = await db.all(dbQuery);
        response.status(200);
        response.send(data.map((each) => getStatusOutput(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasStatus(request.query):
      if (
        request.query.status === "TO DO" ||
        request.query.status === "IN PROGRESS" ||
        request.query.status === "DONE"
      ) {
        dbQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(dbQuery);
        response.status(200);
        response.send(data.map((each) => getStatusOutput(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case bothCategoryAndStatus(request.query):
      dbQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`;
      data = await db.all(dbQuery);
      response.status(200);
      response.send(data.map((each) => getStatusOutput(each)));
    case bothCategoryAndPriority(request.query):
      dbQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
      data = await db.all(dbQuery);
      response.status(200);
      response.send(data.map((each) => getStatusOutput(each)));
    case hasCategory(request.query):
      if (
        request.query.category === "WORK" ||
        request.query.category === "HOME" ||
        request.query.category === "LEARNING"
      ) {
        dbQuery = `SELECT * FROM todo WHERE category='${category}';`;
        data = await db.all(dbQuery);
        response.status(200);
        response.send(data.map((each) => getStatusOutput(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

    case hasDueDate(request.query):
      const changeDate = format(dueDate, "yyyy-MM-dd");
      if (changeDate === dueDate) {
        dbQuery = `SELECT * FROM todo WHERE due_date='${changeDate}';`;
        data = await db.all(dbQuery);
        response.status(200);
        response.send(data.map((each) => getStatusOutput(each)));
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

    default:
      console.log(request.query);
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(dbQuery);
      response.status(200);
      response.send(data.map((each) => getStatusOutput(each)));
  }
});

//API2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const playerQuery = `SELECT
        *
        FROM
        todo
        WHERE
        id = ${todoId};`;
  const playerHistory = await db.get(playerQuery);
  response.send(getStatusOutput(playerHistory));
});

//API3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(date);
  const agendaQuery = `SELECT * FROM todo WHERE due_date='${date}';`;
  const agendaResults = await db.all(agendaQuery);
  response.send(agendaResults.map((each) => getStatusOutput(each)));
});

//API4
let P = "";
let C = "";
let S = "";
let D = "";
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    P = true;
  } else {
    P = false;
    response.status(400);
    response.send("Invalid Todo Priority");
  }

  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    C = true;
  } else {
    C = false;
    response.status(400);
    response.send("Invalid Todo Category");
  }

  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    S = true;
  } else {
    S = false;
    response.status(400);
    response.send("Invalid Todo Status");
  }

  if (P === true && C === true && S === true) {
    const postQuery = `INSERT INTO  todo (id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    const postResponse = await db.run(postQuery);
    response.send("Todo Successfully Added");
  }
});

//API5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbsQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const previousTodo = await db.get(dbsQuery);
  const {
    search_q = "",
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.due_date,
  } = request.body;
  switch (true) {
    case hasCategory(request.body):
      if (
        request.body.category === "WORK" ||
        request.body.category === "HOME" ||
        request.body.category === "LEARNING"
      ) {
        dbQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
        await db.run(dbQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case hasPriority(request.body):
      if (
        request.body.priority === "HIGH" ||
        request.body.priority === "MEDIUM" ||
        request.body.priority === "LOW"
      ) {
        dbQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
        await db.run(dbQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatus(request.body):
      if (
        request.body.status === "TO DO" ||
        request.body.status === "IN PROGRESS" ||
        request.body.status === "DONE"
      ) {
        dbQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
        await db.run(dbQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case hasTodo(request.body):
      dbQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("Todo Updated");
      break;

    case hasDueDate(request.body):
      if (isValid(request.body.dueDate)) {
        const changeDate = format(dueDate, "yyyy-MM-dd");
        dbQuery = `UPDATE todo SET due_date='${changeDate}';`;
        await db.run(dbQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;

    default:
      dbQuery = `UPDATE todo SET todo='%${search_q}%',priority = '${priority}',status = '${status}',category = '${category}',due_date='${dueDate}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("All are Updated");
  }
});

//API6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
