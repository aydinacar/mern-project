import { useState, useEffect } from 'react'

import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const getData = async () => {
    try {
      const response = await fetch('http://localhost:3000')
      const data = await response.json()
      setMessage(data.message)
    } catch (err) {
      console.log(err)
    }
  }
  useEffect(() => {
    getData()
  }, [])
  return (
    <div>
      <h1>{message}</h1>
    </div>
  )
}

export default App
