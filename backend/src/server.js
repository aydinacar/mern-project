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

const __dirname = path.resolve()

app.get('/health', (req, res) => {
  res.json({ message: 'Healthy' })
})

app.get('/books', (req, res) => {
  res.json({ message: 'Books' })
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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
}

server.listen(port, () => {
  console.log('Server is running on port 3000')
})
