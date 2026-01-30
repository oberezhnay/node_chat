'use strict'
const { Server } = require('socket.io');
const roomService = require('./../services/room.service.js');
const messageService = require('./../services/message.service.js');

console.log('SOCKET EVENTS FILE LOADED');
const setupSockets = (server) => {
  const io = new Server(server, {
    cors: { origin: '*'},
  });

  io.on('connection', async (socket) => {
    console.log('SOCKET CONNECTED', socket.id);
    socket.emit('room_list',  await roomService.getAllRooms());
    socket.on('room_create', async ({ name, owner }) => {
      try {
        await roomService.createRoom({ name, owner });
        io.emit('room_list', await roomService.getAllRooms());
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('room_join', async ({ roomId, userName }) => {
      try {
        const room = await roomService.joinRoom({ roomId });

        if (!room) {
          throw new Error('Room not found');
        }

        socket.userName = userName;
        socket.roomId = roomId;

        socket.join(roomId);

        socket.emit('message_history', room.messages);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('room_rename', async ({ roomId, newName }) => {
      try {
        await roomService.renameRoom({ roomId, newName });

        io.emit('room_list', await roomService.getAllRooms());
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('room_delete', async ({ roomId }) => {
      try {
        await roomService.deleteRoom({ roomId });

        io.emit('room_list', await roomService.getAllRooms());
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('message_send', async ({ text }) => {
      try {
        if (!text || !text.trim()) {
          throw new Error('Message is empty');
        }

        if (!socket.userName || !socket.roomId) {
          throw new Error('User is not in room');
        }

        const message = await messageService.createMessage({
          text,
          author: socket.userName,
          userId: socket.userId,
          roomId: socket.roomId,
        })

        io.to(socket.roomId).emit('message_new', message);
      } catch (error) {
        socket.emit('error_message', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`${socket.userName} disconnected`);
    })
  });
}

module.exports = setupSockets;
