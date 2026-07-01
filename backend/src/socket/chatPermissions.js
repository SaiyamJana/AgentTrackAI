import { EmployeeProject } from "../models/EmployeeProject.js";
import { Task }            from "../models/Task.js";
import { Conversation }   from "../models/Conversation.js";

/*
 * chatPermissions.js — server-side permission engine for the chat module.
 *
 * This module is the ONLY place where chat authorization logic lives.
 * Both the Socket.IO event handlers (socket.js) and the REST controllers
 * (chat.controller.js) call these functions — never inline their own checks.
 *
 * Permission rules (from spec):
 *
 *   ADMIN      → can chat only with Managers (project-role = "manager")
 *   MANAGER    → can chat with every sub-manager and every employee in
 *                their projects; can chat with admin.
 *   SUB-MANAGER→ can chat with employees on tasks they manage,
 *                other sub-managers in the same project, and the project manager.
 *   EMPLOYEE   → can chat with employees sharing at least one assigned task,
 *                the sub-manager of those tasks, and the project manager.
 *
 * "Sub-manager" is not a user.role — it is expressed as Task.subManagerId.
 * We resolve it by querying tasks the user manages.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/*
 * getProjectIdsForManager(userId)
 * Returns ObjectIds of all active projects where the user is the manager.
 */
const getProjectIdsForManager = async (userId) => {
    const records = await EmployeeProject.find({
        employeeId: userId,
        projectRole: "manager",
        isActive: true,
    }).select("projectId").lean();
    return records.map((r) => r.projectId);
};

/*
 * getProjectIdsForMember(userId)
 * Returns ObjectIds of all active projects the user is a member of
 * (any projectRole — includes manager and member).
 */
const getProjectIdsForMember = async (userId) => {
    const records = await EmployeeProject.find({
        employeeId: userId,
        isActive: true,
    }).select("projectId").lean();
    return records.map((r) => r.projectId);
};

/*
 * getTaskIdsAsSubManager(userId)
 * Returns ObjectIds of all tasks where this user is the sub-manager.
 */
const getTaskIdsAsSubManager = async (userId) => {
    const tasks = await Task.find({ subManagerId: userId })
        .select("_id projectId")
        .lean();
    return tasks;
};

/*
 * getTaskIdsAsTeamMember(userId)
 * Returns tasks where this user is in teamMembers[].
 */
const getTaskIdsAsTeamMember = async (userId) => {
    const tasks = await Task.find({ teamMembers: userId })
        .select("_id projectId subManagerId")
        .lean();
    return tasks;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core permission function
// ─────────────────────────────────────────────────────────────────────────────

/*
 * canUsersChat(userA, userB)
 *
 * userA — the initiating user (full User document from socket.user or req.user)
 * userB — the target user (full User document fetched from DB)
 *
 * Returns: { allowed: boolean, reason: string }
 *
 * This is intentionally query-heavy on first call because it's only
 * invoked when opening a NEW DM — after that the conversation exists
 * and membership is the guard.
 */
export const canUsersChat = async (userA, userB) => {
    const a = userA;
    const b = userB;

    // Same company check — always required
    if (String(a.companyId) !== String(b.companyId)) {
        return { allowed: false, reason: "Users belong to different companies" };
    }

    // Cannot chat with yourself
    if (String(a._id) === String(b._id)) {
        return { allowed: false, reason: "Cannot start a chat with yourself" };
    }

    // ── ADMIN ───────────────────────────────────────────────────────────────
    if (a.role === "admin") {
        // Admin can only chat with managers (project-role = "manager")
        const bManagerProjects = await EmployeeProject.findOne({
            employeeId: b._id,
            projectRole: "manager",
            isActive: true,
        }).lean();
        if (!bManagerProjects) {
            return { allowed: false, reason: "Admin can only chat with project managers" };
        }
        return { allowed: true, reason: "Admin ↔ Manager" };
    }

    // ── B is ADMIN ──────────────────────────────────────────────────────────
    if (b.role === "admin") {
        // Only managers can initiate chats with admin
        const aIsManager = await EmployeeProject.findOne({
            employeeId: a._id,
            projectRole: "manager",
            isActive: true,
        }).lean();
        if (!aIsManager) {
            return { allowed: false, reason: "Only project managers can chat with admin" };
        }
        return { allowed: true, reason: "Manager ↔ Admin" };
    }

    // Both are employees (role === "employee") from here.
    // Determine each user's effective roles.

    const [aManagerProjects, bManagerProjects] = await Promise.all([
        getProjectIdsForManager(a._id),
        getProjectIdsForManager(b._id),
    ]);

    const aIsManagerOf = new Set(aManagerProjects.map(String));
    const bIsManagerOf = new Set(bManagerProjects.map(String));

    // ── MANAGER ↔ anything in their projects ────────────────────────────────
    if (aManagerProjects.length > 0) {
        // A is a manager — can they see B in any of their projects?
        const bInAProjects = await EmployeeProject.findOne({
            employeeId: b._id,
            projectId: { $in: aManagerProjects },
            isActive: true,
        }).lean();
        if (bInAProjects) {
            return { allowed: true, reason: "Manager ↔ Project member" };
        }
        // B could also be a sub-manager (Task.subManagerId) on one of A's projects
        const bSubManagesInAProjects = await Task.findOne({
            projectId: { $in: aManagerProjects },
            subManagerId: b._id,
        }).lean();
        if (bSubManagesInAProjects) {
            return { allowed: true, reason: "Manager ↔ Sub-manager" };
        }
    }

    // ── B is MANAGER — mirror of the above ──────────────────────────────────
    if (bManagerProjects.length > 0) {
        const aInBProjects = await EmployeeProject.findOne({
            employeeId: a._id,
            projectId: { $in: bManagerProjects },
            isActive: true,
        }).lean();
        if (aInBProjects) {
            return { allowed: true, reason: "Project member ↔ Manager" };
        }
        const aSubManagesInBProjects = await Task.findOne({
            projectId: { $in: bManagerProjects },
            subManagerId: a._id,
        }).lean();
        if (aSubManagesInBProjects) {
            return { allowed: true, reason: "Sub-manager ↔ Manager" };
        }
    }

    // ── SUB-MANAGER ↔ employee/sub-manager ──────────────────────────────────
    // A is sub-manager on some tasks
    const aSubManagedTasks = await getTaskIdsAsSubManager(a._id);
    if (aSubManagedTasks.length > 0) {
        const taskIds   = aSubManagedTasks.map((t) => t._id);
        const projectIds = [...new Set(aSubManagedTasks.map((t) => String(t.projectId)))];

        // B is a team member on one of A's managed tasks?
        const bOnATask = await Task.findOne({
            _id: { $in: taskIds },
            teamMembers: b._id,
        }).lean();
        if (bOnATask) {
            return { allowed: true, reason: "Sub-manager ↔ Task employee" };
        }

        // B is another sub-manager in the same project?
        const bSubManagesInSameProject = await Task.findOne({
            projectId: { $in: projectIds },
            subManagerId: b._id,
        }).lean();
        if (bSubManagesInSameProject) {
            return { allowed: true, reason: "Sub-manager ↔ Sub-manager (same project)" };
        }
    }

    // ── Mirror: B is sub-manager ─────────────────────────────────────────────
    const bSubManagedTasks = await getTaskIdsAsSubManager(b._id);
    if (bSubManagedTasks.length > 0) {
        const taskIds = bSubManagedTasks.map((t) => t._id);

        const aOnBTask = await Task.findOne({
            _id: { $in: taskIds },
            teamMembers: a._id,
        }).lean();
        if (aOnBTask) {
            return { allowed: true, reason: "Task employee ↔ Sub-manager" };
        }
    }

    // ── EMPLOYEE ↔ EMPLOYEE — must share at least one task ──────────────────
    const aTeamTasks = await getTaskIdsAsTeamMember(a._id);
    if (aTeamTasks.length > 0) {
        const aTaskIds = aTeamTasks.map((t) => t._id);
        const sharedTask = await Task.findOne({
            _id: { $in: aTaskIds },
            teamMembers: b._id,
        }).lean();
        if (sharedTask) {
            return { allowed: true, reason: "Employee ↔ Employee (shared task)" };
        }
    }

    return { allowed: false, reason: "No shared task or project relationship found" };
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversation membership guard
// ─────────────────────────────────────────────────────────────────────────────

/*
 * assertConversationMember(conversationId, userId)
 *
 * Throws a descriptive Error if userId is not in conversation.members.
 * Used at the top of every socket event handler and REST endpoint that
 * reads or writes messages.
 *
 * Returns the Conversation document on success so the caller doesn't
 * need to fetch it again.
 */
export const assertConversationMember = async (conversationId, userId) => {
    const conv = await Conversation.findOne({
        _id: conversationId,
        members: userId,
        isActive: true,
    }).lean();

    if (!conv) {
        throw new Error("Forbidden: You are not a member of this conversation");
    }

    return conv;
};

// ─────────────────────────────────────────────────────────────────────────────
// Group membership sync helpers (called from task/project controllers)
// ─────────────────────────────────────────────────────────────────────────────

/*
 * syncProjectGroupMembers(projectId)
 *
 * Recomputes who should be in the project group chat and updates the
 * Conversation.members array accordingly.
 *
 * Called after:
 *   - Employee added to / removed from project
 *   - Project manager changes
 */
export const syncProjectGroupMembers = async (projectId) => {
    const conv = await Conversation.findOne({
        type: "project_group",
        projectId,
        isActive: true,
    });
    if (!conv) return; // project group not yet created (shouldn't happen)

    const members = await EmployeeProject.find({
        projectId,
        isActive: true,
    }).select("employeeId").lean();

    const memberIds = members.map((m) => m.employeeId);
    conv.members = memberIds;
    await conv.save();
    return conv;
};

/*
 * syncTaskGroupMembers(taskId)
 *
 * Recomputes who should be in the task group chat and updates the
 * Conversation.members array.
 *
 * Called after:
 *   - Employee added to / removed from task (teamMembers change)
 *   - Task.subManagerId changes
 *   - Project manager changes
 */
export const syncTaskGroupMembers = async (taskId) => {
    const conv = await Conversation.findOne({
        type: "task_group",
        taskId,
        isActive: true,
    });
    if (!conv) return;

    const task = await Task.findById(taskId)
        .select("teamMembers subManagerId projectId")
        .lean();
    if (!task) return;

    // Members = subManager + teamMembers + project manager
    const projectManager = await EmployeeProject.findOne({
        projectId: task.projectId,
        projectRole: "manager",
        isActive: true,
    }).select("employeeId").lean();

    const memberSet = new Set([
        String(task.subManagerId),
        ...task.teamMembers.map(String),
    ]);
    if (projectManager) memberSet.add(String(projectManager.employeeId));

    conv.members = [...memberSet];
    await conv.save();
    return conv;
};
