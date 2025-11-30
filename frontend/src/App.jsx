/*
React için Video Call + Chat bileşeni
Kullanım talimatları:
1) Backend: önceki server.js (Express + Socket.io) aynı şekilde çalışmalı (public klasörü yerine API soket server olarak çalışır).
   Alternatif olarak backend'i ayrı bir Node server olarak çalıştır.

2) Frontend (React): Bu dosyayı bir React uygulamasında (Vite veya Create React App) `src/App.jsx` olarak koy.

3) Gerekli paketleri yükle:
   npm install socket.io-client simple-peer

4) Çalıştır:
   npm run dev (Vite) veya npm start (CRA)

NOT: Bu basit örnek "room1" adlı odayı kullanır. Geliştirirken dinamik oda id'si, kullanıcı isimleri, TURN sunucusu ve hata yönetimi ekle.
*/

import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import SimplePeer from 'simple-peer'

const SOCKET_SERVER_URL = 'http://localhost:3000' // backend adresi
const ROOM_ID = 'room1'

export default function App() {
  const [socket, setSocket] = useState(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const peerRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL)
    setSocket(s)

    // Media al
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        // Odaya katıl
        s.emit('join-room', ROOM_ID)
      } catch (err) {
        console.error('Kamera/Mikrofon açılamadı:', err)
      }
    }

    startMedia()

    s.on('user-joined', userId => {
      // Başlatıcı taraf oluruz
      if (!peerRef.current) createPeer(true, s)
    })

    s.on('signal', ({ sender, data }) => {
      // Gelen sinyali uygula
      if (!peerRef.current) createPeer(false, s)
      peerRef.current.signal(data)
    })

    s.on('chat-message', ({ sender, message }) => {
      setMessages(m => [...m, { sender, message }])
    })

    return () => {
      s.disconnect()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  function createPeer(initiator, socketInstance) {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current
      // iceServers: [{ urls: "stun:stun.l.google.com:19302" }] // isteğe bağlı
    })

    peer.on('signal', data => {
      socketInstance.emit('signal', { roomId: ROOM_ID, data })
    })

    peer.on('stream', remoteStream => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    })

    peer.on('error', err => console.error('Peer error:', err))

    peerRef.current = peer
  }

  function sendMessage() {
    if (!msgInput.trim() || !socket) return
    socket.emit('chat-message', { roomId: ROOM_ID, message: msgInput })
    setMessages(m => [...m, { sender: 'me', message: msgInput }])
    setMsgInput('')
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: 20, display: 'flex', gap: 20 }}>
      <div>
        <h2>Video</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: 320, borderRadius: 8, background: '#000' }}
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: 320, borderRadius: 8, background: '#000' }}
          />
        </div>
      </div>

      <div style={{ width: 320 }}>
        <h3>Chat</h3>
        <div
          style={{
            height: 360,
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            padding: 10,
            borderRadius: 8,
            background: '#fff'
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{ marginBottom: 8 }}
            >
              <strong style={{ fontSize: 12 }}>{m.sender === 'me' ? 'You' : m.sender}</strong>
              <div style={{ fontSize: 14 }}>{m.message}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Mesaj yaz..."
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
          />
          <button
            onClick={sendMessage}
            style={{ padding: '8px 12px', borderRadius: 6 }}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  )
}
