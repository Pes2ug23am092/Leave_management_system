# ✅ ELMS Test Plan

## Overview
This document outlines the test scenarios, steps, expected results, and remarks for the Automated Leave Management System (LeaveItToUs). It is designed to ensure all major features and flows are validated for quality and reliability.

---

## Test Case Table

| Test Case ID | Test Scenario / Description                | Preconditions                  | Test Steps / Input Data                                       | Expected Result                            | Postconditions / Remarks               |
| ------------ | ------------------------------------------ | ------------------------------ | ------------------------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| TC-Auth-01   | Validate successful login                  | User has valid credentials     | 1. Enter valid email<br>2. Enter valid password<br>3. Click Login | User logged in & redirected to role dashboard  | Session starts, audit log updated      |
| TC-Auth-02   | Validate login with invalid credentials    | User exists in system          | 1. Enter wrong password<br>2. Click Login                         | Error message displayed: Invalid credentials | Audit log entry updated                |
| TC-Auth-03   | Validate role-based redirection            | User has Employee/Manager/HR role | Login with each role                                              | Redirect to respective dashboard           | Role display correct                   |
| TC-Auth-04   | Verify session expires after timeout       | User logged in                 | Stay idle beyond session timeout                                  | User logged out automatically              | Redirect to login                      |
| TC-RBAC-01   | Verify unauthorized page access            | User logged in as Employee     | Try accessing /admin or /manager URL                              | Access denied message                      | Access prevented, redirect to allowed page |
| TC-RBAC-02   | Hide unauthorized UI menu                  | User logged in                 | View dashboard                                                    | Only role-based UI visible                 | UI elements hidden                     |
| TC-Audit-01  | Verify audit log entry on login/logout     | User logs in/out               | 1. Login<br>2. Logout                                             | Audit entry generated                      | Entry visible to admin                 |
| TC-Audit-02  | Validate audit logs filter                 | Admin logged in                | Filter logs by DATE & USER                                        | Correct audit records displayed            | Export possible                        |
| TC-LA-01     | Submit Leave Request successfully          | User logged in & has leave balance | 1. Open apply leave<br>2. Enter future date range<br>3. Submit    | Leave status = Pending                     | Email notification sent                  |
| TC-LA-02     | Leave request with past date               | User logged in                 | Enter past date for leave                                         | Error: Past date not allowed               | Validation message shown               |
| TC-LA-03     | Leave application overlapping existing request | User has existing leave record     | Enter overlapping dates                                           | Error: Overlapping leave request found      | Request blocked                        |
| TC-LA-04     | Leave insufficient balance                 | User has less balance          | Apply for more days than balance                                  | Error: Insufficient balance                | Balance unchanged                      |
| TC-APP-01    | Manager approves leave                     | Manager logged in              | 1. Go to pending requests<br>2. Click Approve                     | Status changed to Approved                 | Employee notified                      |
| TC-APP-02    | Manager rejects leave with comment         | Manager logged in              | 1. Select request<br>2. Reject and enter reason                   | Status changed to Rejected                 | Notification sent                      |
| TC-APP-03    | Reject without comment                     | Manager logged in              | Reject without entering comment                                   | Error: Comment mandatory                   | Action blocked                         |
| TC-CANCEL-01 | Employee cancels pending leave             | User logged in                 | Click Cancel on pending request                                   | Leave marked Cancelled                     | Notification sent                      |
| TC-CANCEL-02 | Cancel approved leave                      | Leave already approved         | Request cancellation                                              | Manager notified for review                | Updated in leave ledger                |
| TC-LB-01     | Leave balance updates on approval          | Request approved               | Apply leave & get approval                                        | Leave balance deducted                     | Ledger updated                         |
| TC-POL-01    | Carry-forward rule validation              | End of year scenario           | Run leave carry-forward                                           | Carry only allowed limit (max 30 days)     | Ledger updated                         |
| TC-HOL-01    | Public holiday excluded from leave duration| Holiday set in system          | Apply leave covering holiday dates                                | Holidays auto-excluded                     | Duration correct                       |
| TC-NOT-01    | Notification for leave actions             | SMTP configured                | Apply/Approve/Reject/Cancel leave                                 | Email notification sent                    | Verified logs                          |
| TC-REPORT-01 | Generate leave report                      | Admin logged in                | Apply filters & generate report                                   | Report downloaded CSV/PDF                  | Accurate data                          |

---

## Notes
- All test cases should be executed for each supported user role (Employee, Manager, HR, Admin).
- Test data can be seeded using the provided SQL scripts.
- For automated testing, use Jest and Supertest for backend APIs, and React Testing Library for frontend flows.
- Update this document as new features or bug fixes are added.

---

## Approval
*Reviewed and approved by the LeaveItToUs QA Team.*

---

*Last updated: November 9, 2025*
