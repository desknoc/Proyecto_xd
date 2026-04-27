// ========================================
// CRUD Contactos — Lógica con Supabase
// ========================================

// -----------------------------------------
// 🔑 CONFIGURACIÓN DE SUPABASE
// Reemplaza estos valores con los de tu proyecto
// Los encuentras en: Supabase → Settings → API
// -----------------------------------------
const SUPABASE_URL = 'https://viscjytqxlfpukanvqyu.supabase.co';       // Ej: https://xxxxx.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc2NqeXRxeGxmcHVrYW52cXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODUzNDAsImV4cCI6MjA5Mjg2MTM0MH0.XUju7VjMBP494d9n4I-PDDpixkXrgp-S46xH2Fz4I4A';  // Ej: eyJhbGciOiJI...

// Inicializar el cliente de Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// -----------------------------------------
// REFERENCIAS AL DOM
// -----------------------------------------
const form = document.getElementById('contact-form');
const inputNombre = document.getElementById('nombre');
const inputApellido = document.getElementById('apellido');
const inputCorreo = document.getElementById('correo');
const inputTelefono = document.getElementById('telefono');
const inputId = document.getElementById('contact-id');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const btnSubmitText = document.getElementById('btn-submit-text');
const tableBody = document.getElementById('table-body');
const recordCount = document.getElementById('record-count');
const loader = document.getElementById('loader');
const tableWrapper = document.getElementById('table-wrapper');
const emptyState = document.getElementById('empty-state');
const modalOverlay = document.getElementById('modal-overlay');
const modalName = document.getElementById('modal-contact-name');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');
const toastContainer = document.getElementById('toast-container');

// Variable para guardar el ID del contacto a eliminar
let deleteId = null;

// -----------------------------------------
// INICIALIZACIÓN
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  cargarContactos();
  form.addEventListener('submit', manejarSubmit);
  btnCancel.addEventListener('click', cancelarEdicion);
  btnModalCancel.addEventListener('click', cerrarModal);
  btnModalConfirm.addEventListener('click', confirmarEliminacion);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cerrarModal();
  });
});

// -----------------------------------------
// CRUD: LEER (Read)
// -----------------------------------------
async function cargarContactos() {
  mostrarLoader(true);

  const { data, error } = await db
    .from('contactos')
    .select('*')
    .order('created_at', { ascending: false });

  mostrarLoader(false);

  if (error) {
    mostrarToast('Error al cargar contactos: ' + error.message, 'error');
    console.error('Error:', error);
    return;
  }

  renderizarTabla(data);
}

// -----------------------------------------
// CRUD: CREAR / ACTUALIZAR (Create / Update)
// -----------------------------------------
async function manejarSubmit(e) {
  e.preventDefault();

  // Validaciones
  const nombre = inputNombre.value.trim();
  const apellido = inputApellido.value.trim();
  const correo = inputCorreo.value.trim();
  const telefono = inputTelefono.value.trim();

  if (!nombre || !apellido || !correo || !telefono) {
    mostrarToast('Por favor, completa todos los campos.', 'error');
    return;
  }

  if (!validarCorreo(correo)) {
    mostrarToast('Por favor, ingresa un correo válido.', 'error');
    return;
  }

  const contacto = { nombre, apellido, correo, telefono };
  const editId = inputId.value;

  // Deshabilitar botón mientras se procesa
  btnSubmit.disabled = true;

  if (editId) {
    // --- ACTUALIZAR ---
    const { error } = await db
      .from('contactos')
      .update(contacto)
      .eq('id', editId);

    if (error) {
      mostrarToast('Error al actualizar: ' + error.message, 'error');
      console.error('Error:', error);
    } else {
      mostrarToast('Contacto actualizado correctamente.', 'success');
      cancelarEdicion();
      cargarContactos();
    }
  } else {
    // --- CREAR ---
    const { error } = await db
      .from('contactos')
      .insert([contacto]);

    if (error) {
      mostrarToast('Error al crear contacto: ' + error.message, 'error');
      console.error('Error:', error);
    } else {
      mostrarToast('Contacto creado correctamente.', 'success');
      form.reset();
      cargarContactos();
    }
  }

  btnSubmit.disabled = false;
}

// -----------------------------------------
// CRUD: PREPARAR EDICIÓN
// -----------------------------------------
function editarContacto(id, nombre, apellido, correo, telefono) {
  inputId.value = id;
  inputNombre.value = nombre;
  inputApellido.value = apellido;
  inputCorreo.value = correo;
  inputTelefono.value = telefono;

  btnSubmitText.textContent = '✏️ Actualizar';
  btnCancel.style.display = 'inline-flex';

  // Scroll suave al formulario
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Efecto visual de foco
  document.querySelector('.form-card').style.borderColor = 'rgba(0, 206, 201, 0.4)';
}

function cancelarEdicion() {
  form.reset();
  inputId.value = '';
  btnSubmitText.textContent = '💾 Guardar';
  btnCancel.style.display = 'none';
  document.querySelector('.form-card').style.borderColor = '';
}

// -----------------------------------------
// CRUD: ELIMINAR (Delete)
// -----------------------------------------
function abrirModalEliminar(id, nombre, apellido) {
  deleteId = id;
  modalName.textContent = `${nombre} ${apellido}`;
  modalOverlay.classList.add('active');
}

function cerrarModal() {
  modalOverlay.classList.remove('active');
  deleteId = null;
}

async function confirmarEliminacion() {
  if (!deleteId) return;

  const { error } = await db
    .from('contactos')
    .delete()
    .eq('id', deleteId);

  if (error) {
    mostrarToast('Error al eliminar: ' + error.message, 'error');
    console.error('Error:', error);
  } else {
    mostrarToast('Contacto eliminado.', 'info');
    cargarContactos();
  }

  cerrarModal();
}

// -----------------------------------------
// RENDERIZAR TABLA
// -----------------------------------------
function renderizarTabla(contactos) {
  recordCount.textContent = `${contactos.length} registro${contactos.length !== 1 ? 's' : ''}`;

  if (contactos.length === 0) {
    tableWrapper.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  tableWrapper.style.display = 'block';
  emptyState.style.display = 'none';

  tableBody.innerHTML = contactos.map(c => `
    <tr>
      <td>${escaparHTML(c.nombre)}</td>
      <td>${escaparHTML(c.apellido)}</td>
      <td>${escaparHTML(c.correo)}</td>
      <td>${escaparHTML(c.telefono)}</td>
      <td class="td-actions">
        <button class="btn btn-edit" onclick="editarContacto(${c.id}, '${escaparJS(c.nombre)}', '${escaparJS(c.apellido)}', '${escaparJS(c.correo)}', '${escaparJS(c.telefono)}')">
          ✏️ Editar
        </button>
        <button class="btn btn-delete" onclick="abrirModalEliminar(${c.id}, '${escaparJS(c.nombre)}', '${escaparJS(c.apellido)}')">
          🗑️ Eliminar
        </button>
      </td>
    </tr>
  `).join('');
}

// -----------------------------------------
// SISTEMA DE NOTIFICACIONES (Toast)
// -----------------------------------------
function mostrarToast(mensaje, tipo = 'info') {
  const iconos = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `
    <span class="toast-icon">${iconos[tipo]}</span>
    <span>${mensaje}</span>
  `;

  toastContainer.appendChild(toast);

  // Auto-eliminar después de 4 segundos
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -----------------------------------------
// LOADER
// -----------------------------------------
function mostrarLoader(mostrar) {
  loader.classList.toggle('active', mostrar);
  if (mostrar) {
    tableWrapper.style.display = 'none';
    emptyState.style.display = 'none';
  }
}

// -----------------------------------------
// UTILIDADES
// -----------------------------------------
function validarCorreo(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function escaparJS(texto) {
  return texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}
