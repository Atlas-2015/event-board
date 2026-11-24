import pool from "./db.js";

async function testDatabaseConnection() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS datenbank, NOW() AS serverzeit"
    );

    console.log("PostgreSQL-Verbindung erfolgreich!");
    console.log("Datenbank:", result.rows[0].datenbank);
    console.log("Serverzeit:", result.rows[0].serverzeit);

  } catch (error) {
    console.error("Datenbankverbindung fehlgeschlagen:", error.message);
    process.exitCode = 1;

  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
