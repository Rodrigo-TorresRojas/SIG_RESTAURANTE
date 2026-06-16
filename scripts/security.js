import { empleados } from './data.js'

const loginForm = document.getElementById('loginForm')

loginForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()
  const user = empleados.find(
    (empleado) => empleado.email.toLowerCase() === email.toLowerCase() && empleado.password === password
  )

  if (user) {
    sessionStorage.setItem('huerequeque-authenticated', 'true')
    sessionStorage.setItem(
      'huerequeque-user',
      JSON.stringify({
        id_empleado: user.id_empleado,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        email: user.email
      })
    )
    window.location.href = 'index.html'
    return
  }

  alert('Usuario o contraseña incorrectos. Verifica tu correo y contraseña.')
})
