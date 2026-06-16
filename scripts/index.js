const authorized = sessionStorage.getItem('huerequeque-authenticated') === 'true'

if (!authorized) {
  window.location.href = 'security.html'
}

const logoutButton = document.getElementById('logoutButton')
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('huerequeque-authenticated')
    window.location.href = 'security.html'
  })
}
