import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import path from 'path'
import { Server } from 'socket.io'
dotenv.config()
const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(cors())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

io.on('connection', socket => {
  console.log('Kullanıcı bağlandı:', socket.id)

  // Odaya katılma
  socket.on('join-room', roomId => {
    socket.join(roomId)
    socket.to(roomId).emit('user-joined', socket.id)
  })

  // WebRTC signaling
  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', {
      sender: socket.id,
      data
    })
  })

  // Chat mesajı
  socket.on('chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('chat-message', {
      sender: socket.id,
      message
    })
  })

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id)
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('Server is running on port 3000')
})
