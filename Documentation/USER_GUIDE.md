# User Guide — LeaveItToUs (Automated Leave Management System)

**Version:** 1.0.0  
**Last Updated:** **November 2025**  
**Maintainers:** LeaveItToUs Dev Team (@Deepthi-PES1UG23AM092, @Pes1ug23am915, @pes1ug23am117, @ChiragGD)

_A web-based system to simplify employee leave management and approval workflows._

---

## Table of Contents
1. [Who Should Read This?](#who-should-read-this)  
2. [Getting Started](#getting-started)  
3. [Roles & Permissions](#roles--permissions)  
4. [Your Dashboard](#your-dashboard)  
5. [Applying for Leave (Employee)](#applying-for-leave-employee)  
6. [Viewing Leave Requests & Status](#viewing-leave-requests--status)  
7. [Manager: Reviewing Team Requests](#manager-reviewing-team-requests)  
8. [Cancelling a Leave](#cancelling-a-leave)  
9. [Holidays](#holidays)  
10. [Admin Functions](#admin-functions)  
11. [Tips & FAQs](#tips--faqs)  
12. [Need Help?](#need-help)  

---

## Who Should Read This?
- **Employees:** Apply for leave, view balances, and track requests.  
- **Managers:** Review, approve, or reject team leave requests and cancellations.  
- **Admins:** Manage employees, leave types, and holidays.

---

## Getting Started
1. Open the app in your browser: [http://localhost:3000](http://localhost:3000) (or your deployed URL).  
2. Log in using your **email** and **password**.  
3. If you don’t have credentials, contact your **Admin**.

---

## Roles & Permissions
| Role | Permissions |
|------|--------------|
| **Employee** | Apply for leave, view balances/history, request cancellations |
| **Manager** | All employee actions, plus approve/reject requests and handle cancellations |
| **Admin** | Manage employees, leave types, holidays, and view system metrics |

---

## Your Dashboard
- **Leave Balances:** Total, taken, and remaining days per leave type.  
- **Recent Activity:** See your latest actions or status updates.  
- **Upcoming Holidays:** View upcoming holidays based on your location/year.

_Optional screenshot placeholder (for PDF/manuals):_  
`assets/dashboard.png`

---

## Applying for Leave (Employee)
1. Go to `Leave → Apply`.  
2. Choose a **Leave Type** (e.g., Casual, Sick, Earned).  
3. Select **From Date** and **To Date**.  
4. Choose sessions (`AM` / `PM`) if applicable.  
5. Enter a **reason** (optional or required by policy).  
6. Click **Submit**.

**What happens next?**
- The system automatically calculates your leave duration (including half-days).  
- Your **Manager** receives an email notification (if email is configured).  
- You can track the request under `Leave → Requests`.

---

## Viewing Leave Requests & Status
Go to `Leave → Requests` to view:
- Date range, type, status (`Pending`, `Approved`, `Rejected`, `Cancelled`), and approver.  
- Number of days auto-calculated by the system.

---

## Manager: Reviewing Team Requests
1. Navigate to `Team → Requests`.  
2. Click a request to view details.  
3. Choose **Approve** or **Reject** (add remarks if necessary).  
4. Upon approval, the employee’s leave balance updates automatically.

---

## Cancelling a Leave
- **If your leave is Pending:**  
  You can cancel it directly — your balance will be restored.  

- **If your leave is Approved:**  
  1. Submit a **Cancellation Request** with a reason.  
  2. Your Manager will approve or reject the cancellation.  
  3. Upon approval, your balance is restored automatically.

**Where to find:**
- Employee: `Leave → My Cancellation Requests` (history/status)  
- Manager: `Team → Cancellation Requests` (Pending/History)

---

## Holidays
- View upcoming holidays under `Holidays`.  
- Admins can import or update holiday data from an external API (admin-only feature).

---

## Admin Functions

### Employees
- Create, edit, or remove employee accounts.  
- Assign managers and roles.

### Leave Types
- Define leave names, allowed days, and carry-forward behavior per year.

### Holidays
- Add, update, or remove holidays.  
- Optionally sync from an external holiday API.

### Metrics & Stats
- Review high-level system usage and performance metrics.

---

## Tips & FAQs

**Q: I can’t log in.**  
A: Double-check your email and password. If it still fails, contact your Admin.

**Q: My leave balance looks wrong.**  
A: Check the selected sessions (`AM/PM`) and date range. If still incorrect, contact Admin.

**Q: I don’t see any leave types.**  
A: Ask your Admin to configure leave types for the current year.

**Q: I’m a Manager but can’t see team requests.**  
A: Ensure your account has the **Manager** role and your team members reference your `ManagerID`.

---

### Known Rules
- Days are calculated using selected date range and session choices.  
- Weekend/holiday exclusions depend on organization policy.  
- Cancelling an **Approved** leave restores balance.  
- Admin-only features require appropriate privileges.

---

## Need Help?
If you face issues:
- Contact your **Admin** or the **LeaveItToUs Dev Team**.  
- Refer to these documents for technical details:  
  - [Developer Guide](./DEVELOPER_GUIDE.md)  
  - [API Documentation](./backend/API_DOCUMENTATION.md)  
  - [Email Setup](./backend/EMAIL_SETUP.md)

---

© **LeaveItToUs Team — 2025.**  
_All rights reserved._
