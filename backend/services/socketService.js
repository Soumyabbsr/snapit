const emitToGroup = (io, groupId, event, data) => {
  io.to('group:' + groupId.toString()).emit(event, data);
};

const emitToGroupExcept = (io, groupId, excludeSocketId, event, data) => {
  io.to('group:' + groupId.toString()).except(excludeSocketId).emit(event, data);
};

const emitToUser = (io, userId, event, data) => {
  io.to('user:' + userId.toString()).emit(event, data);
};

module.exports = {
  emitToGroup,
  emitToGroupExcept,
  emitToUser
};
