# DAY1 : (2/6/26):
# Member1 : (2023CSB037)
1) Github Repo Setup and inviting collaborators
2) Initiaized frontend with ReactJS and TailwindCSS (Commit : Frontend Setup)
3) Initialized backend with ExpressJS , JSON Web Token , Bycrypt JS , Mongoose , dotenv , nodemon (Commit : Backend Setup)

# Member 2 : (2023CSB115)
Cloned the project repository to local system.

# DAY2 : (3/6/26)
# Member 1 : (2023CSB037)
1) Added Database connection code
2) Added 4 models code (Schema)
-- activityLogs
--reports
--risks
--workloads
3) merged other member codes

# Member 2 : (2023CSB115)
- Cloned and synchronized the latest project repository.
- Configured the backend to use ES Modules.
- Resolved module import/export issues in the backend.
- Created database models:
     - User Model
     - Project Model
     - Task Model
     - EmployeeProject Model
- Added project constants and backend configuration files.
- Updated package dependencies and project structure.
- Successfully tested the backend server using nodemon and verified server startup on port 5000.

# DAY3 : (4/6/26)
# Member 1 : (2023CSB037)
1) Added methods for access and refresh tokens 
2) Tried to debug backend for authentication
3) Added Error and Response js files for faster coding 
4) Added async handler function as helper functions for reuses of async functions

# Member 2 : (2023CSB115)
- Configured local development environment and cloned repository
- Set up MongoDB Atlas cluster and database connectivity
- Implemented User schema with bcrypt password hashing
- Added JWT Access Token and Refresh Token generation
- Built Register and Login authentication APIs

# Member 3 :(2023CSB030)
-Created Login page UI using React and Tailwind
-Created Signup page UI using React and Tailwind
-Organized frontend code structure with reusable components
- Pushed changes to authentication3 branch

# Day4 : (5/6/26)
# Member 1 : (2023CSB037)
1) Added Auth frontend (Login and Signup)
2) Debug backend connection for Auth
3) Added Dashboards : 
- Employee Dashboard
- Manager Dashbaord
- Admin Dashboard
4) Debug Register frontend page with database connection

# Member 2 : (2023CSB115)
* Fixed MongoDB connection issue (data going to 'test' db instead of 'agenttrack_ai')
* Fixed MONGO_URI parsing in db/index.js to correctly append database name
* Resolved 'next is not a function' error in User model pre-save hook
* Successfully tested Register and Login APIs using Postman
* Synced authentication2 branch with main and created task2 branch

# Day5 : (6/6/26)
# Member 1 : (2023CSB037)
1) Included task related backend ai endpoints
2) Backend logic for task management for all roles (employee , admin , manager)
3) Handled and changed frontend code (in branch task2) for handling with created task api endpoints
4) Discuseed a critical issue with gpt and members about relations between manager , employee and admin

# Member 2 : (2023CSB115)
1) Reviewed task management backend logic and API endpoints built by Member1
2) Tested task-related APIs across employee, admin, and manager roles using Postman
3) Participated in discussion on the critical issue around manager-employee-admin relationship design
4) Began studying alternative database design approaches to resolve the role hierarchy problem

# Day6 : (7/6/26)
# Member 1 : (2023CSB037)
1) Created a pdf for completely new design for : 
- Relations between manager , employee and admin
- - New database design
- - New and updated schemas
- - Aggregation pipelines
- - Overview of API endpoints

# Member 2 : (2023CSB115)
- Studied the updated PDF covering:
    - Entity relationships
    - Database design
    - Schemas
    - Aggregation pipelines
    - API endpoints
- Started implementing the proposed design by creating schemas, writing backend logic, and testing APIs.

# Day7 : (8/6/26)
# Member 1 : (2023CSB037)
1) Added frontend logic for solution
2) Studied the workflow and navigation (Solution)

# Member 2 : (2023CSB115)
- Added backend logic for Company ID-based workflow.
- Updated database relations and wrote code to ensure proper workflow execution.
- Studied and refined the company-manager-employee structure.

# Day8 : (9/6/26)
# Member 1 : (2023CSB037)
1) Redesigned complete new model designs for creating a real world scenario structure for a company
2) Designed the workflow of the website
3) Designed the navigation for redesigned structure
4) Initialized the auth controller and backend structure for redesign models
5) Prepared a document for redesign to shared thought with team members

# Member 2 : (2023CSB115)
1) Studied the complete AgentTrack AI workflow and project architecture.
2) Analyzed relationships between Admin, Manager, Employee, Projects, and Tasks.
3) Identified that Company ID alone is insufficient for maintaining proper user hierarchy and project ownership.
4) Studied project allocation, employee assignment, task delegation, and reporting workflows.
5) Analyzed manager-submanager-employee interactions and their impact on database design.
6) Worked on redesigning the database structure to support proper Admin → Manager → Employee relationships.
7) Contributed to designing improved relationship mapping for future scalability and workflow management.

# Day9 : (10/6/26)
# Member1 : (2023CSB037)
1) Changed all the routes struture , middleware , models for this redesigned 
2) Started designing frontend 
3) Fixed company controllers and user controllers
4) Designed the users hierarchy on the website

# Member2 : (2023CSB115)
1) Debugged and tested the redesigned backend modules
2) Fixed issues in the existing implementation and verified functionality
3) Updated the authentication frontend (Login & Register pages) according to the new redesign structure
4) Integrated frontend authentication changes with the updated backend flow

# Day10 : (11/6/26)
# Member1 : (2023CSB037)
1) Redesigned all the pages for new design 
- Employee Dashboard
- Admin Dashbaord
- Manager Dashboard
2) Fixed the login issue (using companyID instead of invite code for user.controller.js)
3) Decided the next few days roadmap with team members , distributed work among three members
4) Building the comeplete flow and logic for projects an task management
5) Backend logic and frontend design for projects and tasks
6) Handled the logic for assigning manager for a project and sub manager for tasks

# Member2 : (2023CSB115)
1) Built complete auth flow: LoginPage, RegisterPage (employee self-registration), RegisterCompanyPage (admin registration with company details)
2) Fixed ProtectedRoute.jsx — removed non-existent "manager" role checks, created AdminGuard and EmployeeGuard
3) Updated api.js with authAPI (login/registerEmployee/registerCompany)
4) Wired all auth routes into App.jsx
5) Tested complete auth flow end-to-end via UI
   
# Day11 : (12/6/26)
# Member1 : (2023CSB037)
1) Tested the complete wrap up goal of flow between admin , manager , sub manager and employee for projects and tasks
2) Decided the next goal for our roadmap , analyzed the different agents motive, workflow , flow across the application
3) Learn about Google gemini api and how to integrate them with website
4) Analyzed the reports feature for admin and manager and its structure across the system

# Member2 : (2023CSB115)
1)  Merged Member1's branch and synced local branch with latest updates.
2)  Developed Admin → Employee Management functionality.
3)  Implemented employee search, filtering, edit, and activate/deactivate features.
4)  Added employee project assignment viewing functionality.
5)  Updated hooks and integrated Admin Employee Management page into routing.
6)  Performed end-to-end testing of project assignment, employee management, task delegation, and task tracking workflows.
7)  Verified complete workflow functionality and fixed integration issues.


# Day12 : (13/6/26)
# Member1 : (2023CSB037)
1) Started working on Reporting Agent : 
- Added reports management page for manager 
- added the report api endpoint from backend
- edited the report schema for for information (title , generatedAt etc)
- coded the routes for router from manager user
- created the gemini api key and added it in .env file
- coded the prompt generation for gemini model
- coded a emergency fallback function (if gemini model fails)
- wrap up the reporting Agent and tested it

# Member2 : (2023CSB115)
1) Built Risk Agent — rule-based, cron-scheduled, no LLM
2) Created Risk.js and Notification.js models
3) Detects overdue tasks and delayed projects automatically
4) Auto-creates risks + notifications for employee, manager, admin
5) Built /api/v1/risks and /api/v1/notifications APIs
6) Wired hourly cron job in server.js
7) Built live notification bell dropdown + Notifications page
8) Built Active Risks page (/admin/risks, /manager/risks) with resolve toggle
9) Verified full pipeline end-to-end — fully automatic 

# Day13 : (14/6/26)
# Member1 : (2023CSB037)
1) Tried to solve the gemini model issue 
2) Tested with different gemini models
3) Studied the motive and role of analytics Agent
4) Studied the charts (Javascript) to provide better understandability to users
5) Added analytics dashboard for employee and manager
6) Added analytics routes in backend accessed through frontend
- Added controller , routes and edited api endpoint file
- Added dashboard , edited sidebar (including analytics tab)
7) Fixed analytics mounting issue
8) Tried to fix react rendering issue

# Member2 : (2023CSB115)
- Built complete event-driven notification system — added Notification.create() calls across project, task, and employeeProject controllers
- Extended notification triggers beyond risk alerts: project lifecycle, team assignment, task lifecycle events
- Verified Gemini fallback mechanism — confirmed reports were using template-based fallback, diagnosed ACCESS_TOKEN_TYPE_UNSUPPORTED root cause (wrong API key format)
- Tested Saiyam's analytics and reports pages end-to-end (charts, custom date ranges, report generation)

# Day14 : (15/6/26)
# Member1 : (2023CSB037)
1) Analyzed the react dom and recharts version for import
2) Fix the react rendering issue
3) Analyzed the folder structure package.json causing the react rendering issue
1) Tested notifications and risk alerts dashboards
2) Analyzed and studied the various hits needed for notifications
3) Analyzed the bug/issue needed to solve for analytics tab
4) Trigger the duration hit for statcards in analytics dashboard

# Member2 : (2023CSB115)
- Installed missing dependencies (recharts, @google/generative-ai, node-cron) to unblock both branches
- Verified analytics dashboard across personal/team views with custom date ranges
- Confirmed Reporting Agent fallback working correctly (template-based reports) while real Gemini key issue pending
- Identified missing Manager-side UI for sub-manager promotion — flagged as a gap

# Day15 : (16/6/26)
# Member1 : (2023CSB037)
1) Changed the analytics dashboard featuring changes with respect to duration selected
2) Changed the controller logic featuring correct computation
3) fix the api.js for react rendering issue
4) Analyzed the recharts issue faced during bug fixing of statcards
5) Tested all the options (1d/7d/30d/90d/overall/custom) and collected correct results
6) distributed and analyzed the work for activityLogs and workload Management Agent
7) Identified the sub - manager bug and controller system of manager and sub-manager relations (respect to tasks)
- started to fix the issue 
- changed the schema structure supporting task and sub-manager relations
  
# Member2 : (2023CSB115)
- Merged 2023CSB037 branch into 2023CSB115 — resolved conflicts in server.js, App.jsx, useTasks.js, package.json
- Removed duplicate ProtectedRoute.jsx file found during merge
- Smoke-tested merged app (dashboard, bell icon, risks page, reports page, analytics) — confirmed nothing broke
- Updated Notification.js model's type enum to support new notification types added during merge
  
# Day16 : (17/6/26)
# Member1 : (2023CSB037)
1) Changed files : 
- task.model.js (changed task->1 employee relation to task->many employee relation)
- taskAssignment.js (new file for employee progress under that task)
- EmployeeProject.js (changed the content since sub-manager is not related with project)
- task.routes.js (new and changed api endpoints)

# Member2 : (2023CSB115)
- Identified and confirmed sub-manager promotion bug with Saiyam — root cause traced to missing control system at project-role level
- Reviewed new schema redesign on 2023CSB037: Task.js (single→multi-employee relation), TaskAssignment.js (per-employee progress tracking)
- Reviewed rewritten controllers (task, project, employeeProject, analytics) against new schema
- Flagged missing Task import bug in employeeProject.controller.js (removeEmployee would crash)
- Updated Notification.js enum with new types (task_deleted, task_member_added, task_member_removed, task_progress_updated)

# Day17 : (18/6/26)
# Member1 : (2023CSB037)
1) Working on solving the issues
- controllers : analytics , task , project , employeeProject , risk , reports , notifications
- Handled the routes of re-written controllers

# Member2 : (2023CSB115)
1) Reviewed rewritten controllers (task, project, employeeProject) against new schema
2) Tested updated API endpoints via Postman across all roles
3) Identified and documented integration issues between new task schema and existing frontend hooks

# Day18 : (19/6/26)
# Member1 : (2023CSB037)
1) Handled the full frontend for this redesign 
2) Tested and identifies addTaskMember to task hook bug 
3) Fixed the addTaskMember bug and identified more logical bugs in hooks file and fixed them

# Member2 : (2023CSB115)
1) Audited all 16 notification creation points across task/project/employeeProject controllers against the Notification model's type enum
2) Found and fixed 3 logic bugs: removeEmployee deactivating before role-check (silent data corruption), promotion/demotion notification type mismatch, task_completed/project_completed not reaching all relevant recipients
3) Confirmed both completion-notification fixes with Saiyam, implemented and verified end-to-end via Postman (sub-manager, manager, and admin all correctly notified)
4) Pushed verified fixes to 2023CSB037

# Day19 : (20/6/26)
# Member1 : (2023CSB037)
1) Identified the add employee hooks issue in tasks management and fixed it 
2) Identified json response parsing issue due to route mismatch in updateProgress of Task Management and fixed it

# Member2 : (2023CSB115)
1) Updated task routes to match new controller (added member/assignment endpoints, removed stale ones)
2) Removed obsolete sub-manager promotion route (now task-level, not project-level)
3) Updated Notification model with new notification types
4) Verified server boots cleanly, all routes mounted correctly
5) End-to-end tested new Task/TaskAssignment schema via Postman — all working


# Day21 : (22/6/26)
# Member1 : (2023CSB037)
1) Analyzed the current design flow and issues for workload design
2) Identified the schema design issues 
3) Implemented the new schema design and studied the control flow and calculation criteria for workload calculation

# Member2 : (2023CSB115)
1) Built and finalized Admin Settings page with secure invite code management (hidden by default, password required to reveal or regenerate)
2) Masked invite code on Admin Dashboard, redirecting to Settings for secure access


# Day22 : (23/6/26)
# Member1 : (2023CSB037)
1) Coded the controllers
- workload (created)
- analytics (modified)
- task (modified)
2) created workloadAgent using gemini API
3) created a workload service for workloadCalculation 
4) Defined the routes for new controllers 
5) Used in server.js
6) Designed the frontend pages for workload Analysis and Agent
7) Added manager , admin , employee dashbaords for workload
8) Used the backend endpoint for workload

# Member2 : (2023CSB115)
1) Tested Activity Log feature end-to-end across all roles
2) Identified findOneAndUpdate hook not firing for project status changes — root cause: Mongoose options not passing _performedBy reliably


# Day23 : (24/6/26)
# Member1 : (2023CSB037)
1) Added workload components for employee , admin , manager workload dashboard
2) Modified the api.js for new endpoints
3) Identified 4 frontend design issues and fixed them 
4) Identified 6 backend design issues and fixed them
5) Wrapped up the frontend and backend designs for workload analysis

# Member2 : (2023CSB115)
1) Continued Activity Log testing across project/task lifecycle actions
2) Identified and documented missing log hits vs defined enum actions


# Day24 : (25/6/26)
# Member1 : (2023CSB037)
1) Merged the new design supporting workload and activityLog
2) Solved 5 merge conflicts
3) Tested the resultant codebase
4) Identifies the managerId issue for activityLog and fixed it (issue in use Hooks)

# Member2 : (2023CSB115)
1) Reviewed Saiyam's bug reports from testing session
2) Fixed ManageTeamModal remove button (was hidden for managers, silently failing)


# Day25 : (27/6/26)
# Member1 : (2023CSB037)
1) Testing ..
2) Merged 115 branch having latest code and solved merge conflicts

# Member2 : (2023CSB115)
1) Pulled latest main, resolved merge conflicts
2) Implemented multi-manager support per project
3) Fixed removeEmployee active task check bug
4) Added task remarks feature end-to-end


# Day26 : (27/6/26)
# Member2 : (2023CSB115)
1) Implemented hard-delete for projects with full cascade + admin password re-verification
2) Added frontend delete button with type-to-confirm + password modal


# Day27 : (28/6/26)
# Member1 : (2023CSB037)
1) Fixed and changed manage team section for admin

# Member2 : (2023CSB115)
1) Fixed "All Projects" view in Activity Log
2) Added 8 new activity log hits: employee_assigned, manager_added/removed, user_login, task_progress_updated, employee_deactivated/reactivated
3) Fixed completed task blocking employee removal bug
4) Updated Activity Log filter tabs and ACTION_CFG for all new action types

   
# Day28 : (29/6/26)
# Member1 : (2023CSB037)
1) socket-io and multer setup
2) created models : 
- Conversation.js
- Message.js
- MessageRead.js
3) created socket middleware checking user authentication during connection (socketAuth.js)
4) defined the chat permissions on different users according to users

# Member2 : (2023CSB115)
1) Implemented multi-manager support per project
2) Fixed removeEmployee bug — was blocking removal even for completed tasks
3) Added task remarks feature (Limitation 2) end-to-end


# Day29 : (30/6/26)
# Member1 : (2023CSB037)
1) Socket creation && defined socket structure in socket.js
2) Added chat notification type
3) Handled task and project related chat groups (in respective controllers)

# Member2 : (2023CSB115)
1) Implemented hard-delete for projects with full cascade + admin password re-verification
2) Added frontend delete button with type-to-confirm + password modal
3) Fixed "All Projects" view in Activity Log (was silently returning empty for admin)
4) Added 8 new activity log hits: employee_assigned, manager_added, employee_removed, manager_removed, user_login, task_progress_updated, employee_deactivated, employee_reactivated
5) Fixed active task check bug in removeEmployee (completed tasks were blocking removal)
6) Updated Activity Log filter tabs and ACTION_CFG for all new action types


# Day30 : (1/7/26)
# Member1 : (2023CSB037)
1) Added useChat hooks for frontend
2) Added components for chat system and modified the api.js and new routes for chat
3) Identified the bugs of chat system
4) Task management Bug (Backend returns tasks with respect to project from manager , but it should return all tasks of all projects he is of manager)
5) Fixed the task fetching from manager dashboard

# Member2 : (2023CSB115)
1) Added employee_created and employee_updated activity log hits in user.controller.js
2) Added user_login logging restored after file corruption incident (recovered via git checkout)
3) Updated activityLogs.model.js enum with employee_created, employee_updated, employee_deactivated, employee_reactivated, user_login
4) Updated entityType enum to include "User" for user-scoped log entries
5) Updated Activity Log frontend ACTION_CFG and filter tabs for all newly added action types

# Day31 : (2/7/26)
# Member1 : (2023CSB037)
1) Added drop down system for group chats to see the current members 
2) Identfied the chat group auto deletion system bug 
3) Fixed the auto deletion system
4) Identified the task group chat bug (auto addition and deletion of employees)
5) Fixed the bug
6) Identified and fixed the bug for DMs between two members
7) Reassignment manager -> chat member bug fixed