// Proximity calculation and logic
const PROXIMITY_DISTANCE = 120; // pixels

const calculateDistance = (x1, y1, x2, y2) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

const isWithinProximity = (x1, y1, x2, y2) => {
  return calculateDistance(x1, y1, x2, y2) <= PROXIMITY_DISTANCE;
};

const findNearbyUsers = (currentUser, allUsers) => {
  return allUsers.filter(
    (user) =>
      user.socketId !== currentUser.socketId &&
      isWithinProximity(currentUser.x, currentUser.y, user.x, user.y),
  );
};

const getProximityStatus = (user1, user2) => {
  const distance = calculateDistance(user1.x, user1.y, user2.x, user2.y);
  return {
    distance: Math.round(distance),
    canInteract: distance <= PROXIMITY_DISTANCE,
    status: distance <= PROXIMITY_DISTANCE ? "near" : "far",
  };
};

module.exports = {
  PROXIMITY_DISTANCE,
  calculateDistance,
  isWithinProximity,
  findNearbyUsers,
  getProximityStatus,
};
