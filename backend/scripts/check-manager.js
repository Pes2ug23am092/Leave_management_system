require('dotenv').config();
const { query } = require('../db/db');

async function main() {
  const empEmail = (process.argv[2] || '').trim();
  if (!empEmail) {
    console.log('Usage: node scripts/check-manager.js <employee-email>');
    process.exit(1);
  }

  const sql = `
    SELECT E.EmpID AS empId, E.FirstName AS empFirst, E.LastName AS empLast, E.Email AS empEmail,
           E.ManagerID, M.EmpID AS mgrId, M.FirstName AS mgrFirst, M.LastName AS mgrLast, M.Email AS mgrEmail
    FROM Employee E
    LEFT JOIN Employee M ON E.ManagerID = M.EmpID
    WHERE LOWER(E.Email) = LOWER(?);
  `;
  try {
    const rows = await query(sql, [empEmail]);
    if (!rows.length) {
      console.log('Employee not found.');
      return;
    }
    const r = rows[0];
    console.log({
      empId: r.empId,
      employee: `${r.empFirst} ${r.empLast}`,
      empEmail: r.empEmail,
      managerID: r.ManagerID,
      manager: r.mgrId ? `${r.mgrFirst} ${r.mgrLast}` : null,
      managerEmail: r.mgrEmail || null
    });
  } catch (e) {
    console.error('Query failed:', e.message);
  }
}

main();
