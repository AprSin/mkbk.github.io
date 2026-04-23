const mysql = require('mysql2/promise');

async function fixEnum() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'cloud_prosperity'
  });

  try {
    await connection.query(`ALTER TABLE \`projects\` MODIFY COLUMN \`status\` ENUM('待审核','交易中','已完成','已取消') DEFAULT '待审核'`);
    console.log('projects status enum updated successfully');
  } catch (err) {
    console.error('Error updating projects:', err.message);
  }

  try {
    await connection.query(`ALTER TABLE \`products\` MODIFY COLUMN \`status\` ENUM('待审核','在售','已售罄','下架') DEFAULT '待审核'`);
    console.log('products status enum updated successfully');
  } catch (err) {
    console.error('Error updating products:', err.message);
  }

  await connection.end();
}

fixEnum();
