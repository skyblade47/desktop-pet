const { spawn } = require('child_process')
const electron = require('electron')
const path = require('path')

let electronProcess = null

const startVite = () => {
  return new Promise((resolve) => {
    const viteProcess = spawn('npx', ['electron-vite', '--dev'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    })
    
    viteProcess.on('close', (code) => {
      if (electronProcess) {
        electronProcess.kill()
      }
      process.exit(code)
    })
    
    setTimeout(resolve, 2000)
  })
}

const startElectron = () => {
  electronProcess = spawn(electron, ['.'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  
  electronProcess.on('close', (code) => {
    process.exit(code)
  })
}

startVite().then(startElectron)
