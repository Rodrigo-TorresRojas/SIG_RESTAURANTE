import { pedidos, platos, menu_dia } from './data.js'

const authorized = sessionStorage.getItem('huerequeque-authenticated') === 'true'
if (!authorized) {
  window.location.href = 'security.html'
}

const userInfo = JSON.parse(sessionStorage.getItem('huerequeque-user') || '{}')

document.addEventListener('DOMContentLoaded', () => {
  const userName = document.getElementById('userName')
  const userRole = document.getElementById('userRole')
  if (userName && userRole) {
    userName.textContent = `${userInfo.nombre || 'Empleado'} ${userInfo.apellido || ''}`.trim()
    userRole.textContent = userInfo.rol || 'Rol no disponible'
  }
})

const logoutButton = document.getElementById('logoutButton')
const orderForm = document.getElementById('orderForm')
const dishSelect = document.getElementById('dishSelect')
const quantityInput = document.getElementById('quantity')
const addDishButton = document.getElementById('addDish')
const cartBody = document.getElementById('cartBody')
const cartTotal = document.getElementById('cartTotal')
const cartStatus = document.getElementById('cartStatus')
const historyBody = document.getElementById('historyBody')
const orderNotice = document.getElementById('orderNotice')
const historyFilter = document.getElementById('historyFilter')
const tipoServicio = document.getElementById('tipoServicio')
const tableNumberRow = document.getElementById('tableNumberRow')
const tableNumber = document.getElementById('tableNumber')

let cartItems = []
let savedOrders = loadSavedOrders()
let savedDetails = loadSavedOrderDetails()

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem('huerequeque-authenticated')
  window.location.href = 'security.html'
})

orderForm.addEventListener('submit', handleSubmit)
addDishButton.addEventListener('click', addDishToCart)
tipoServicio.addEventListener('change', updateTableField)
historyFilter.addEventListener('change', renderHistory)

init()

function init() {
  renderDishOptions()
  renderCart()
  renderHistory()
  updateTableField()
}

function loadSavedOrders() {
  const saved = localStorage.getItem('huerequeque-orders')
  if (!saved) return [...pedidos].reverse()
  return JSON.parse(saved)
}

function loadSavedOrderDetails() {
  const saved = localStorage.getItem('huerequeque-order-details')
  if (!saved) return []
  return JSON.parse(saved)
}

function saveOrders() {
  localStorage.setItem('huerequeque-orders', JSON.stringify(savedOrders))
}

function saveOrderDetails() {
  localStorage.setItem('huerequeque-order-details', JSON.stringify(savedDetails))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function getNextOrderId() {
  const maxExisting = savedOrders.reduce((max, order) => Math.max(max, order.id_pedido), 0)
  return maxExisting + 1
}

function updateTableField() {
  const active = tipoServicio.value === 'Mesa'
  tableNumberRow.classList.toggle('hidden', !active)
}

function renderDishOptions() {
  const availability = buildAvailabilityMap()
  dishSelect.innerHTML = platos
    .map((dish) => {
      const availableText = availability[dish.id_plato] !== undefined ? ` - disp. ${availability[dish.id_plato]}` : ''
      return `<option value="${dish.id_plato}">${dish.nombre_plato} (${formatCurrency(dish.precio_venta)})${availableText}</option>`
    })
    .join('')
}

function buildAvailabilityMap() {
  return menu_dia.reduce((map, item) => {
    map[item.id_plato] = item.cantidad_disponible
    return map
  }, {})
}

function addDishToCart() {
  const dishId = Number(dishSelect.value)
  const quantity = Number(quantityInput.value)
  const dish = platos.find((item) => item.id_plato === dishId)

  if (!dish || quantity < 1) {
    setNotice('Selecciona un plato y una cantidad válida.', 'error')
    return
  }

  const availability = buildAvailabilityMap()[dishId]
  if (availability !== undefined && quantity > availability) {
    setNotice(`No hay suficiente disponibilidad. Máximo ${availability}.`, 'error')
    return
  }

  const existing = cartItems.find((item) => item.id_plato === dishId)
  if (existing) {
    existing.quantity += quantity
  } else {
    cartItems.push({
      id_plato: dish.id_plato,
      nombre_plato: dish.nombre_plato,
      cantidad: quantity,
      precio_unitario: dish.precio_venta
    })
  }

  quantityInput.value = '1'
  renderCart()
  setNotice('Plato agregado correctamente.', 'success')
}

function removeCartItem(id_plato) {
  cartItems = cartItems.filter((item) => item.id_plato !== id_plato)
  renderCart()
}

function renderCart() {
  if (cartItems.length === 0) {
    cartBody.innerHTML = '<tr><td colspan="5" class="empty-row">No hay platos agregados.</td></tr>'
    cartTotal.textContent = formatCurrency(0)
    cartStatus.textContent = 'Añade platos para calcular el total.'
    return
  }

  const rows = cartItems.map((item) => {
    const subtotal = item.cantidad * item.precio_unitario
    return `
      <tr>
        <td>${item.nombre_plato}</td>
        <td>${item.cantidad}</td>
        <td>${formatCurrency(item.precio_unitario)}</td>
        <td>${formatCurrency(subtotal)}</td>
        <td><button type="button" class="btn-icon" data-id="${item.id_plato}">✕</button></td>
      </tr>`
  })
  cartBody.innerHTML = rows.join('')
  cartTotal.textContent = formatCurrency(cartItems.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0))
  cartStatus.textContent = `${cartItems.length} artículo(s) en el pedido.`

  Array.from(cartBody.querySelectorAll('.btn-icon')).forEach((button) => {
    button.addEventListener('click', () => removeCartItem(Number(button.dataset.id)))
  })
}

function handleSubmit(event) {
  event.preventDefault()
  if (cartItems.length === 0) {
    setNotice('Agrega al menos un plato antes de registrar el pedido.', 'error')
    return
  }

  const tipoServicioValue = tipoServicio.value
  const estado = document.getElementById('estado').value
  const clienteNombre = document.getElementById('clienteNombre').value.trim()
  const mesa = tableNumber.value.trim()

  const newOrder = {
    id_pedido: getNextOrderId(),
    fecha_hora: formatDate(new Date()),
    tipo_servicio: tipoServicioValue,
    estado,
    total_pago: cartItems.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
    cliente: clienteNombre || 'Cliente presencial',
    mesa: tipoServicioValue === 'Mesa' ? mesa || 'N/A' : 'N/A'
  }

  savedOrders.unshift(newOrder)
  cartItems.forEach((item) => {
    savedDetails.unshift({
      id_pedido: newOrder.id_pedido,
      id_plato: item.id_plato,
      cantidad: item.cantidad,
      precio_unitario_historico: item.precio_unitario
    })
  })

  saveOrders()
  saveOrderDetails()
  cartItems = []
  renderCart()
  renderHistory()
  orderForm.reset()
  updateTableField()
  setNotice(`Pedido ${newOrder.id_pedido} registrado con éxito.`, 'success')
}

function renderHistory() {
  const filterValue = historyFilter.value
  const sortedOrders = [
    ...savedOrders.filter((order) => order.estado === 'En preparación'),
    ...savedOrders.filter((order) => order.estado !== 'En preparación')
  ]

  const filteredOrders = sortedOrders.filter((order) => filterValue === 'Todos' || order.estado === filterValue)
  const rows = filteredOrders.map((order) => {
    const estadoCell = order.estado === 'En preparación'
      ? `
        <select class="status-select" data-id="${order.id_pedido}">
          <option value="En preparación" ${order.estado === 'En preparación' ? 'selected' : ''}>En preparación</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>`
      : `<span class="badge ${order.estado === 'Cancelado' ? 'badge-danger' : 'badge-success'}">${order.estado}</span>`

    return `
      <tr>
        <td>${order.id_pedido}</td>
        <td>${order.fecha_hora}</td>
        <td>${order.tipo_servicio}</td>
        <td>${estadoCell}</td>
        <td>${formatCurrency(order.total_pago)}</td>
      </tr>`
  })

  historyBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5" class="empty-row">No hay pedidos para este filtro.</td></tr>'

  Array.from(historyBody.querySelectorAll('.status-select')).forEach((select) => {
    select.addEventListener('change', () => updateOrderStatus(Number(select.dataset.id), select.value))
  })
}

function updateOrderStatus(orderId, newStatus) {
  const order = savedOrders.find((item) => item.id_pedido === orderId)
  if (!order || order.estado !== 'En preparación') return

  order.estado = newStatus
  saveOrders()
  renderHistory()
  setNotice(`Pedido ${orderId} actualizado a ${newStatus}.`, 'success')
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

function setNotice(message, type) {
  orderNotice.textContent = message
  orderNotice.className = `notice ${type}`
  setTimeout(() => {
    orderNotice.textContent = ''
    orderNotice.className = 'notice'
  }, 3500)
}
