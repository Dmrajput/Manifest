const { success } = require("../utils/response");
const userService = require("../services/userService");
const meditationService = require("../services/meditationService");
const { UserActivity } = require("../models");

async function listTracks(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const tracks = await meditationService.listTracks(user._id);
    return success(res, { data: { tracks }, message: "Meditation library loaded" });
  } catch (error) {
    return next(error);
  }
}

async function getTrack(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const track = await meditationService.getTrack(user._id, req.params.id);
    if (track && !track.locked) {
      await UserActivity.create({
        user_id: user._id,
        activity_type: "meditation_play",
        metadata: { track_id: track.id || req.params.id },
      });
    }
    return success(res, { data: { track }, message: "Track loaded" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listTracks, getTrack };
