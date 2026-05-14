const Message = require("../models/Message");

// ==============================
// Send Message
// ==============================
const sendMessage = async (req, res) => {
  try {
    const { receiver, content, position, distance } = req.body;

    // Validation
    if (!content || !position) {
      return res
        .status(400)
        .json({ message: "Content and position are required" });
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiver || null,
      content,
      position,
      distance: distance || 0,
    });

    await message.save();

    // Populate sender info for response
    await message.populate("sender", "name avatarStyle");

    res.status(201).json({
      message: "Message sent successfully",
      messageData: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Messages (Conversation with specific user)
// ==============================
const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id },
      ],
    })
      .populate("sender", "name avatarStyle")
      .populate("receiver", "name avatarStyle")
      .sort({ createdAt: 1 }); // Chronological order

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Nearby Messages (Proximity Chat)
// ==============================
const getNearbyMessages = async (req, res) => {
  try {
    const { x, y, radius = 100 } = req.query; // Default radius 100 units

    if (x === undefined || y === undefined) {
      return res
        .status(400)
        .json({ message: "Position coordinates (x, y) are required" });
    }

    const xNum = Number(x);
    const yNum = Number(y);
    const radiusNum = Number(radius);

    if (Number.isNaN(xNum) || Number.isNaN(yNum) || Number.isNaN(radiusNum)) {
      return res
        .status(400)
        .json({ message: "Position coordinates and radius must be numbers" });
    }

    const messages = await Message.find({
      sender: { $ne: req.user.id }, // Exclude own messages
    })
      .populate("sender", "name avatarStyle")
      .sort({ createdAt: -1 })
      .lean()
      .limit(200); // Fetch a reasonable batch

    const nearbyMessages = messages
      .map((message) => {
        const dx = message.position.x - xNum;
        const dy = message.position.y - yNum;
        return {
          ...message,
          distance: Math.sqrt(dx * dx + dy * dy),
        };
      })
      .filter((message) => message.distance <= radiusNum)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50);

    res.json(nearbyMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Mark Message as Read
// ==============================
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the receiver
    if (message.receiver.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: "Message marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Convert Message to Task
// ==============================
const convertToTask = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check ownership
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Create task from message
    const Task = require("../models/Task");
    const task = new Task({
      title: message.content.substring(0, 100), // First 100 chars as title
      description: message.content,
      createdBy: req.user.id,
      chatConvertedFrom: message._id,
    });

    await task.save();

    // Update message
    message.convertedToTask = task._id;
    message.messageType = "task_conversion";
    await message.save();

    res.status(201).json({
      message: "Message converted to task",
      task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getNearbyMessages,
  markAsRead,
  convertToTask,
};
