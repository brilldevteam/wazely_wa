require("dotenv").config({ silent: true });

const mysql = require("mysql2/promise");

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DBHOST || "localhost",
    port: process.env.DBPORT || 3306,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
  });

  try {
    const [columns] = await connection.query(
      `SELECT DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'meta_templet_media'
         AND COLUMN_NAME = 'meta_hash'`,
    );

    if (columns.length < 1) {
      throw new Error("Column meta_templet_media.meta_hash was not found");
    }

    if (columns[0].DATA_TYPE === "mediumtext") {
      console.log("meta_templet_media.meta_hash is already MEDIUMTEXT");
      return;
    }

    await connection.query(
      "ALTER TABLE meta_templet_media MODIFY meta_hash MEDIUMTEXT NULL",
    );
    console.log("Updated meta_templet_media.meta_hash to MEDIUMTEXT");
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
