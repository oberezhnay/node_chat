'use strict'
const { Server } = require('socket.io');
const roomService = require('./../services/room.service.js');
const userService = require('./../services/user.service.js');
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
        const user = userService.findOrCreateUser(userName);

        socket.userId = user.id
        socket.userName = user.name;
        socket.roomId = roomId;

        socket.join(roomId);

        const room = await roomService.joinRoom({ roomId });

        if (!room) {
          throw new Error('Room not found');
        }

        const messages = room.Messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          authorName: msg.User.name,
          createdAt: msg.createdAt,
        }));

        socket.emit('message_history', messages);
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

        if (!socket.userId || !socket.roomId) {
          throw new Error('User is not in room');
        }

        const message = await messageService.createMessage({
          text,
          // authorName: socket.userName,
          userId: socket.userId,
          roomId: socket.roomId,
        })

        io.to(socket.roomId).emit('message_new', {
          id: message.id,
          text: message.text,
          authorName: socket.userName,
          createdAt: message.createdAt,
        });
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
