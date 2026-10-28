const mongoose = require("mongoose");

let isConnected = false;

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  isConnected = true;
  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  isConnected = false;
}

function getConnectionState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState;
}

module.exports = {
  mongoose,
  connectDatabase,
  disconnectDatabase,
  getConnectionState,
};
