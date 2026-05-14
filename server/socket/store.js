// In-memory store for active users in workspace
// { userId: { userId, x, y, name, focusMode, avatarStyle } }

const activeUsers = new Map();
const objectStates = new Map();

const loadObjectStates = async () => {
  try {
    const ObjectState = require("../models/ObjectState");
    const states = await ObjectState.find({});
    states.forEach((s) => {
      objectStates.set(s.objectId, s.state);
    });
    console.log(`Loaded ${states.length} object states from DB`);
  } catch (err) {
    console.error("Error loading object states from DB:", err);
  }
};

const addUser = (userId, userData) => {
  activeUsers.set(userId, {
    ...userData,
    joinedAt: Date.now(),
  });
};

const setObjectState = (objectId, state) => {
  objectStates.set(objectId, state);
};

const upsertObjectState = async (objectId, state) => {
  try {
    const ObjectState = require("../models/ObjectState");
    await ObjectState.findOneAndUpdate(
      { objectId },
      { state, updatedAt: state.updatedAt || Date.now() },
      { upsert: true, new: true },
    );
    objectStates.set(objectId, state);
  } catch (err) {
    console.error("Error upserting object state to DB:", err);
  }
};

const getAllObjectStates = () => {
  return Object.fromEntries(objectStates);
};

const removeUser = (userId) => {
  return activeUsers.delete(userId);
};

const getUser = (userId) => {
  return activeUsers.get(userId);
};

const getAllUsers = () => {
  return Array.from(activeUsers.values());
};

const getUniqueUsers = () => {
  const uniqueUsersMap = new Map();
  activeUsers.forEach((user) => {
    uniqueUsersMap.set(user.userId, { id: user.userId, name: user.name });
  });
  return Array.from(uniqueUsersMap.values());
};

const updateUserPosition = (userId, x, y) => {
  const user = activeUsers.get(userId);
  if (user) {
    user.x = x;
    user.y = y;
    user.lastMove = Date.now();
  }
};

const updateUserFocus = (userId, focusMode) => {
  const user = activeUsers.get(userId);
  if (user) {
    user.focusMode = focusMode;
  }
};

const getAllUserPositions = (excludeUserId = null) => {
  return Array.from(activeUsers.values())
    .filter((user) => !excludeUserId || String(user.userId) !== String(excludeUserId))
    .map((user) => ({
      id: user.userId,
      x: user.x,
      y: user.y,
      name: user.name,
      focusMode: user.focusMode || false,
    }));
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getAllUsers,
  getUniqueUsers,
  updateUserPosition,
  updateUserFocus,
  getAllUserPositions,
  setObjectState,
  upsertObjectState,
  loadObjectStates,
  getAllObjectStates,
};
