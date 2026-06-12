# DAY1 : (2/6/26):

# Member1 : (2023CSB037)
1) Github Repo Setup and inviting collaborators
2) Initiaized frontend with ReactJS and TailwindCSS (Commit : Frontend Setup)
3) Initialized backend with ExpressJS , JSON Web Token , Bycrypt JS , Mongoose , dotenv , nodemon (Commit : Backend Setup)

# Member 2 : (2023CSB115)
Cloned the project repository to local system.
# Member 3 : 

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