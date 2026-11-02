import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { orders, schema } from "./data.js";

function withoutLeadingComments(sql) {
  let text = sql.trim();
  while (text.startsWith("--") || text.startsWith("/*")) {
    if (text.startsWith("--")) {
      const end = text.indexOf("\n");
      text = end === -1 ? "" : text.slice(end + 1).trim();
    } else {
      const end = text.indexOf("*/");
      if (end === -1) throw new Error("Unclosed SQL comment.");
      text = text.slice(end + 2).trim();
    }
  }
  return text;
}
self.onmessage = async ({ data }) => {
  let db;
  try {
    if (typeof data.query !== "string" || !data.query.trim())
      throw new Error("Enter a SELECT query before running.");
    if (data.query.length > 10000)
      throw new Error("Queries are limited to 10,000 characters.");
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    db = new SQL.Database();
    db.run(
      `CREATE TABLE orders (${schema.map(([name, type]) => name + " " + type).join(", ")});`,
    );
    db.run("BEGIN");
    const insert = db.prepare(
      "INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    try {
      for (const row of orders) insert.run(schema.map(([name]) => row[name]));
    } finally {
      insert.free();
    }
    db.run("COMMIT");
    db.run("PRAGMA query_only = ON");
    let count = 0;
    for (const statement of db.iterateStatements(data.query)) {
      count++;
      if (count > 1) throw new Error("Run one SELECT statement at a time.");
      if (!/^SELECT\b/i.test(withoutLeadingComments(statement.getSQL())))
        throw new Error(
          "This notebook supports read-only SELECT statements only.",
        );
    }
    if (count !== 1) throw new Error("Enter one SELECT statement.");
    const statement = db.prepare(data.query);
    const columns = statement.getColumnNames();
    const bindings = { ":region": data.region || "All regions" };
    if (new Set(columns).size !== columns.length) {
      statement.free();
      throw new Error("Give every result column a unique alias.");
    }
    let rows = [],
      truncated = false;
    try {
      statement.bind(bindings);
      while (statement.step()) {
        if (rows.length === 500) {
          truncated = true;
          break;
        }
        rows.push(statement.get());
      }
    } finally {
      statement.free();
    }
    self.postMessage({ ok: true, columns, rows, truncated });
  } catch (error) {
    self.postMessage({ ok: false, error: error.message || String(error) });
  } finally {
    db?.close();
  }
};
