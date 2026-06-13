require("dotenv").config({ silent: true });

const mysql = require("mysql2/promise");
const {
  createDefaultMenuPermissions,
} = require("../config/menuPermissions");

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
         AND TABLE_NAME = 'plan'
         AND COLUMN_NAME = 'menu_permissions'`,
    );

    if (columns.length < 1) {
      await connection.query(
        "ALTER TABLE plan ADD COLUMN menu_permissions LONGTEXT NULL",
      );
      console.log("Added plan.menu_permissions");
    } else {
      console.log("plan.menu_permissions already exists");
    }

    const defaults = JSON.stringify(createDefaultMenuPermissions(true));
    const [result] = await connection.query(
      `UPDATE plan
       SET menu_permissions = ?
       WHERE menu_permissions IS NULL OR menu_permissions = ''`,
      [defaults],
    );

    console.log(`Initialized ${result.affectedRows} existing plan(s)`);
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
