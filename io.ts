import socketIO from "socket.io";
import http from "http";
import { Request, Response, NextFunction } from 'express'
import { sessionMiddleware } from './session'
import { join } from "path";


export let io: socketIO.Server;



export function attachServer(server: http.Server) {
  io = new socketIO.Server(server)
  io.use((socket, next) => {
    let req = socket.request as Request
    let res = req.res!
    sessionMiddleware(req, res, next as NextFunction)
  })
  io.on('connection', socket => {
    let req = socket.request as Request
    let user = req.session.user
    console.log('connection established:', {
      socket_id: socket.id,
      user_id: user?.id,
    })

    if (user) {
      socket.emit('greet', `hi ${user.username}, welcome back`)
      //
      let user_id = user.id
      socket.on('join room', id => {
        let sender_id = user_id
        let receiver_id = +id
        let room = sender_id < receiver_id ? sender_id + ':' + receiver_id : receiver_id + ':' + sender_id
        socket.join(room)
        console.log({ room })
      })
    }
    socket.on('disconnect', () => {
      console.log('connection closed:', {
        socket_id: socket.id,
        user_id: user?.id,
      })
    })
  })
}