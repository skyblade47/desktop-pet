import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PetWindow } from './components/pet/PetWindow'
import './index.css'

const searchParams = new URLSearchParams(window.location.search)
const isV2Preview = searchParams.get('preview') === 'v2'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isV2Preview ? <PetWindow /> : <App />}</React.StrictMode>
)
