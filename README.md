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

# Day14 : (15/6/26)
# Member1 : (2023CSB037)
1) Analyzed the react dom and recharts version for import
2) Fix the react rendering issue
3) Analyzed the folder structure package.json causing the react rendering issue
1) Tested notifications and risk alerts dashboards
2) Analyzed and studied the various hits needed for notifications
3) Analyzed the bug/issue needed to solve for analytics tab
4) Trigger the duration hit for statcards in analytics dashboard

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

# Day16 : (17/6/26)
# Member1 : (2023CSB037)
1) Changed files : 
- task.model.js (changed task->1 employee relation to task->many employee relation)
- taskAssignment.js (new file for employee progress under that task)
- EmployeeProject.js (changed the content since sub-manager is not related with project)
- task.routes.js (new and changed api endpoints)

# Day17 : (18/6/26)
# Member1 : (2023CSB037)
1) Working on solving the issues
- controllers : analytics , task , project , employeeProject , risk , reports , notifications
- Handled the routes of re-written controllers