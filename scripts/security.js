const loginForm = document.getElementById('loginForm')

const sampleUser = {
  email: 'admin@unlam.edu.ar',
  password: 'Huerequeque123'
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()

  if (email.toLowerCase() === sampleUser.email && password === sampleUser.password) {
    window.location.href = 'index.html'
    return
  }

  alert('Usuario o contraseña incorrectos. Intenta con admin@unlam.edu.ar / Huerequeque123')
})
