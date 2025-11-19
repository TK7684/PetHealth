// workers/db.js
import mysql from "mysql2/promise";

let dbPool;

export function getDatabasePool(env) {
  if (!dbPool) {
    dbPool = mysql.createPool({
      connectionLimit: 10,
      host: env.DB_HOST || "localhost",
      user: env.DB_USER || "root",
      password: env.DB_PASSWORD || "",
      database: env.DB_NAME || "pethealth",
      charset: "utf8mb4",
      timezone: "Asia/Bangkok",
    });
  }
  return dbPool;
}

export async function executeQuery(pool, query, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    connection.release();
    return rows;
  } catch (error) {
    connection.release();
    throw error;
  }
}

export async function beginTransaction(pool) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    return connection;
  } catch (error) {
    connection.release();
    throw error;
  }
}

export async function commitTransaction(connection) {
  try {
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
