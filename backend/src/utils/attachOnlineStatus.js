const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

/*
 * computeIsOnline(lastSeen)
 * Returns true if lastSeen is within the last 3 minutes.
 */
export const computeIsOnline = (lastSeen) => {
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
};

/*
 * withOnlineStatus(userObj)
 * Takes a single populated user object (plain JS object, e.g. from .lean())
 * and returns a new object with isOnline attached.
 * Safe against null/undefined (some populates may be optional).
 */
export const withOnlineStatus = (userObj) => {
    if (!userObj) return userObj;
    return {
        ...userObj,
        isOnline: computeIsOnline(userObj.lastSeen),
    };
};

/*
 * withOnlineStatusArray(userArray)
 * Same as above but for an array of populated user objects
 * (e.g. task.teamMembers after populate + lean).
 */
export const withOnlineStatusArray = (userArray) => {
    if (!Array.isArray(userArray)) return userArray;
    return userArray.map(withOnlineStatus);
};