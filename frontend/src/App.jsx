import { useEffect, useState } from 'react'

// ==========================================
// 1. ÍCONOS SVG (Todos los íconos necesarios)
// ==========================================
const IconoHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IconoBox = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
const IconoHistory = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconoBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="22" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
const IconoIn = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
const IconoOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
const IconoTag = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
const IconoChart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
const IconoMail = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
const IconoLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IconoFilter = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const IconoTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
const IconoMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const IconoClose = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconoEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
const IconoBriefcase = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>

function App() {
  // ==========================================
  // 2. CONFIGURACIÓN Y ESTADOS
  // ==========================================
  const API_URL = 'https://obralink-sistema.onrender.com';

  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [rolUsuario, setRolUsuario] = useState('') 
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [errorLogin, setErrorLogin] = useState('')
  const [recordarSesion, setRecordarSesion] = useState(false) // NUEVO: Estado para el checkbox
  
  const [materiales, setMateriales] = useState([])
  const [historial, setHistorial] = useState([])
  const [obras, setObras] = useState([])
  
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState('TODOS')

  const [formulario, setFormulario] = useState({ nombre: '', sku: '', precio_costo: '', categoria: '' })
  const [idEditando, setIdEditando] = useState(null)

  const [formObra, setFormObra] = useState({ nombre: '', cliente: '', presupuesto: '' })
  const [movimientoData, setMovimientoData] = useState({ id_producto: '', cantidad: '', id_obra: '' })
  
  const [menuActivo, setMenuActivo] = useState('Inicio')
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false) 

  // ==========================================
  // 3. CÁLCULOS Y FILTROS EN TIEMPO REAL
  // ==========================================
  const categoriasUnicas = [...new Set(materiales.map(m => m.categoria || 'Sin Categoría'))]
  
  const statsPorCategoria = materiales.reduce((acc, curr) => {
    const cat = curr.categoria || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const materialesFiltrados = materiales.filter(m => {
    const coincideBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || m.sku.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = filtroCategoria === '' || m.categoria === filtroCategoria
    return coincideBusqueda && coincideCategoria
  })

  const historialFiltrado = historial.filter(h => {
    const texto = busquedaHistorial.toLowerCase();
    const coincideTexto = h.nombre.toLowerCase().includes(texto) || h.sku.toLowerCase().includes(texto) || (h.nombre_obra && h.nombre_obra.toLowerCase().includes(texto));
    const coincideTipo = filtroTipoHistorial === 'TODOS' || h.tipo === filtroTipoHistorial;
    return coincideTexto && coincideTipo;
  })

  const kpiTotalValor = materiales.reduce((acc, m) => acc + (m.stock_actual * m.precio_costo), 0)
  const kpiTotalItems = materiales.length
  const kpiStockCritico = materiales.filter(m => m.stock_actual < 5).length
  const kpiObrasActivas = obras.length

  // ==========================================
  // 4. FUNCIONES DE CONEXIÓN (API)
  // ==========================================
  
  // NUEVO: Verificar si hay sesión guardada al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario_obralink');
    const rolGuardado = localStorage.getItem('rol_obralink');
    if (usuarioGuardado && rolGuardado) {
      setUsuarioLogueado(usuarioGuardado);
      setRolUsuario(rolGuardado);
    }
  }, []);

  const manejarLogin = async (e) => { 
    e.preventDefault(); 
    try { 
      const r = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginData) }); 
      const d = await r.json(); 
      if (d.success) { 
        setUsuarioLogueado(d.nombre); 
        setRolUsuario(d.rol);
        
        // Lógica de "Recordarme"
        if (recordarSesion) {
          localStorage.setItem('usuario_obralink', d.nombre);
          localStorage.setItem('rol_obralink', d.rol);
        }
      } else { 
        setErrorLogin('Acceso denegado'); 
      }
    } catch { setErrorLogin('Sin conexión con el servidor'); } 
  }

  // NUEVO: Función para cerrar sesión y limpiar memoria
  const cerrarSesion = () => {
    setUsuarioLogueado(null);
    setRolUsuario('');
    localStorage.removeItem('usuario_obralink');
    localStorage.removeItem('rol_obralink');
  }
  
  const obtenerDatos = async () => { 
    try { 
      const rProd = await fetch(`${API_URL}/productos`); const dProd = await rProd.json(); setMateriales(dProd);
      const rObras = await fetch(`${API_URL}/obras`); const dObras = await rObras.json(); setObras(dObras);
      if (dObras.length > 0 && !movimientoData.id_obra) { setMovimientoData(prev => ({...prev, id_obra: dObras[0].id})) }
      
      if (menuActivo === 'Historial' || menuActivo === 'Inicio' || menuActivo === 'Obras') { 
        const rHist = await fetch(`${API_URL}/movimientos`); const dHist = await rHist.json(); setHistorial(dHist); 
      }
    } catch (e) { console.error("Error cargando datos:", e); } 
  }

  const guardarMaterial = async (e) => { 
    e.preventDefault(); 
    if (idEditando) {
       await fetch(`${API_URL}/productos/${idEditando}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) });
       alert("✅ Producto actualizado correctamente"); setIdEditando(null); cambiarMenu('Almacén'); 
    } else {
       const prefix = formulario.nombre ? formulario.nombre.substring(0, 3).toUpperCase() : 'GEN';
       const randomNum = Math.floor(1000 + Math.random() * 9000);
       const skuAutomatico = `${prefix}-${randomNum}`;
       await fetch(`${API_URL}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formulario, sku: skuAutomatico, precio_venta: 0, stock_actual: 0 }) }); 
       alert(`✅ Producto creado exitosamente.\nSKU Asignado: ${skuAutomatico}`);
    }
    setFormulario({ nombre: '', sku: '', precio_costo: '', categoria: '' }); obtenerDatos(); 
  }

  const cargarProductoParaEditar = (prod) => {
     setFormulario({ nombre: prod.nombre, sku: prod.sku, precio_costo: prod.precio_costo, categoria: prod.categoria });
     setIdEditando(prod.id); cambiarMenu('Crear Producto'); 
  }
  
  const guardarObra = async (e) => { 
    e.preventDefault(); 
    await fetch(`${API_URL}/obras`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formObra) }); 
    setFormObra({ nombre: '', cliente: '', presupuesto: '' }); obtenerDatos(); 
  }

  const registrarMovimiento = async (e, tipo) => {
    e.preventDefault();
    if (!movimientoData.id_producto || !movimientoData.cantidad) return alert("Por favor complete los datos");
    let obraFinal = null;
    if (tipo === 'SALIDA') { if(!movimientoData.id_obra) return alert("Debe seleccionar una obra de destino"); obraFinal = movimientoData.id_obra; }
    await fetch(`${API_URL}/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_producto: movimientoData.id_producto, tipo: tipo, cantidad: movimientoData.cantidad, id_obra: obraFinal }) }); 
    setMovimientoData({ ...movimientoData, cantidad: '' }); obtenerDatos();
    alert(tipo === 'ENTRADA' ? "✅ Ingreso a bodega registrado" : "🚀 Despacho a obra registrado");
  }

  const eliminarProducto = async (id, nombre) => {
    if (window.confirm(`⚠️ ADVERTENCIA ⚠️\n\n¿Estás seguro de eliminar el producto "${nombre}"?`)) {
      try { await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' }); obtenerDatos(); } catch (e) { alert("Error al eliminar"); }
    }
  }
  const eliminarMovimiento = async (id) => {
    if (window.confirm(`¿Seguro deseas eliminar este registro del historial?`)) {
      try { await fetch(`${API_URL}/movimientos/${id}`, { method: 'DELETE' }); obtenerDatos(); } catch (e) { alert("Error al eliminar"); }
    }
  }
  const eliminarObra = async (id, nombre) => {
    if (window.confirm(`⚠️ PELIGRO ⚠️\n\n¿Estás seguro de eliminar la obra "${nombre}"?`)) {
      try { const response = await fetch(`${API_URL}/obras/${id}`, { method: 'DELETE' }); if (!response.ok) { return alert("⛔ Error: No puedes eliminar la Bodega Central."); } obtenerDatos(); } catch (e) { alert("Error de conexión al eliminar."); }
    }
  }
  
  const manejarInput = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value })
  const cambiarMenu = (nuevoMenu) => { setMenuActivo(nuevoMenu); setMenuMovilAbierto(false); }

  const calcularMaterialesEnObra = (obraId) => {
    return historial.filter(h => h.id_obra === obraId && h.tipo === 'SALIDA').reduce((acc, item) => acc + parseInt(item.cantidad), 0);
  }

  useEffect(() => { if(usuarioLogueado) obtenerDatos() }, [usuarioLogueado, menuActivo])

  // ==========================================
  // 5. RENDERIZADO DE PANTALLA
  // ==========================================

  if (!usuarioLogueado) {
    return (
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="relative z-10"><h1 className="text-white text-4xl font-bold flex items-center gap-3"><span className="text-blue-500">●</span> ObraLink</h1></div>
          <div className="relative z-10"><blockquote className="text-2xl text-slate-300 font-medium leading-relaxed">"El éxito de una obra comienza con un inventario ordenado."</blockquote><p className="mt-6 text-slate-500 text-sm tracking-widest uppercase">Sistema de Gestión Integral v3.0</p></div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-none lg:shadow-none sm:shadow-xl">
            <div className="text-center mb-10"><h2 className="text-3xl font-bold text-slate-800">Bienvenido</h2><p className="text-slate-500 mt-2">Ingresa tus credenciales para acceder</p></div>
            <form onSubmit={manejarLogin} className="space-y-6">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconoMail /></div><input type="email" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50 focus:bg-white" value={loginData.email} onChange={e=>setLoginData({...loginData, email:e.target.value})} /></div></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IconoLock /></div><input type="password" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50 focus:bg-white" value={loginData.password} onChange={e=>setLoginData({...loginData, password:e.target.value})} /></div></div>
              
              {/* NUEVO: Checkbox "Recordarme" */}
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="recordar" 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  checked={recordarSesion}
                  onChange={(e) => setRecordarSesion(e.target.checked)}
                />
                <label htmlFor="recordar" className="text-sm text-slate-600 cursor-pointer">Mantener sesión iniciada</label>
              </div>

              {errorLogin && (<div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 justify-center animate-pulse"><span>⚠️</span> {errorLogin}</div>)}
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/30 text-base">INGRESAR AL SISTEMA</button>
            </form>
            {/* ELIMINADO: Cuadro azul de cuentas de acceso */}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-700 relative">
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 shadow-md">
         <span className="font-bold text-lg flex items-center gap-2"><span className="text-blue-500">●</span> ObraLink</span>
         <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}>{menuMovilAbierto ? <IconoClose /> : <IconoMenu />}</button>
      </div>

      <aside className={`fixed inset-y-0 left-0 transform ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out w-64 bg-slate-800 text-slate-300 flex-shrink-0 z-40 min-h-screen flex flex-col shadow-2xl md:shadow-none`}>
        <div className="h-14 hidden md:flex items-center px-6 bg-slate-900 font-bold text-white text-lg tracking-wider border-b border-slate-700"><span className="text-blue-500 mr-2">●</span> ObraLink</div>
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${rolUsuario === 'ADMIN' ? 'bg-blue-600 border-blue-400' : 'bg-orange-600 border-orange-400'}`}>{usuarioLogueado.charAt(0).toUpperCase()}</div>
          <div className="overflow-hidden"><p className="text-white text-sm font-bold truncate">{usuarioLogueado}</p><p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">{rolUsuario}</p></div>
        </div>
        <nav className="mt-4 text-sm space-y-1 flex-1 overflow-y-auto">
          <p className="px-6 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider mt-4">Principal</p>
          <button onClick={()=>cambiarMenu('Inicio')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Inicio' ? 'bg-blue-600 text-white' : ''}`}><IconoHome/><span className="ml-3">Inicio</span></button>
          
          <p className="px-6 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider mt-4">Logística</p>
          <button onClick={()=>cambiarMenu('Ingresos')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Ingresos' ? 'bg-green-600 text-white' : ''}`}><IconoIn/><span className="ml-3">Ingresos</span></button>
          <button onClick={()=>cambiarMenu('Salidas')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Salidas' ? 'bg-red-600 text-white' : ''}`}><IconoOut/><span className="ml-3">Salidas</span></button>

          <p className="px-6 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider mt-4">Gestión</p>
          <button onClick={()=>cambiarMenu('Crear Producto')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Crear Producto' ? 'bg-slate-700 text-white' : ''}`}><IconoTag/><span className="ml-3">Crear Producto</span></button>
          <button onClick={()=>cambiarMenu('Almacén')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Almacén' ? 'bg-slate-700 text-white' : ''}`}><IconoBox/><span className="ml-3">Almacén</span></button>
          <button onClick={()=>cambiarMenu('Obras')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Obras' ? 'bg-slate-700 text-white' : ''}`}><IconoBuilding/><span className="ml-3">Obras</span></button>
          <button onClick={()=>cambiarMenu('Historial')} className={`w-full flex items-center px-6 py-3 hover:bg-slate-700 hover:text-white transition ${menuActivo === 'Historial' ? 'bg-slate-700 text-white' : ''}`}><IconoHistory/><span className="ml-3">Historial</span></button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden">
        <header className="hidden md:flex h-14 bg-white shadow-sm border-b items-center justify-between px-6 z-10">
          <div className="text-lg font-bold text-slate-700 uppercase flex items-center gap-2"><span className="text-blue-500">/</span> {menuActivo}</div>
          <button onClick={cerrarSesion} className="text-xs font-bold text-red-500 hover:text-red-700 uppercase border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition">Cerrar Sesión</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100 pb-20 md:pb-6">
          
          {menuActivo === 'Inicio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {rolUsuario === 'ADMIN' && (
                  <div className="bg-blue-600 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Almacén')}>
                    <div><h3 className="text-3xl font-bold">${kpiTotalValor.toLocaleString('es-CL')}</h3><p className="text-blue-100 text-xs font-bold uppercase mt-1">Inversión Stock</p></div>
                  </div>
                )}
                <div className="bg-red-500 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Almacén')}>
                  <div><h3 className="text-3xl font-bold">{kpiStockCritico}</h3><p className="text-red-100 text-xs font-bold uppercase mt-1">Stock Crítico (!)</p></div>
                </div>
                <div className="bg-orange-500 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Obras')}>
                  <div><h3 className="text-3xl font-bold">{kpiObrasActivas}</h3><p className="text-orange-100 text-xs font-bold uppercase mt-1">Obras Activas</p></div>
                </div>
                <div className="bg-green-600 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Ingresos')}>
                  <div><h3 className="text-3xl font-bold">{kpiTotalItems}</h3><p className="text-green-100 text-xs font-bold uppercase mt-1">Total Ítems</p></div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-700 text-sm uppercase mb-3 flex items-center gap-2">Accesos Rápidos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <button onClick={()=>cambiarMenu('Ingresos')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-green-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-green-100 text-green-600 p-3 rounded-full group-hover:bg-green-600 group-hover:text-white transition"><IconoIn /></div><span className="text-xs font-bold text-slate-600">Ingresos</span></button>
                    <button onClick={()=>cambiarMenu('Salidas')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-red-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-red-100 text-red-600 p-3 rounded-full group-hover:bg-red-600 group-hover:text-white transition"><IconoOut /></div><span className="text-xs font-bold text-slate-600">Salidas</span></button>
                    <button onClick={()=>cambiarMenu('Crear Producto')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-slate-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-slate-100 text-slate-600 p-3 rounded-full group-hover:bg-slate-600 group-hover:text-white transition"><IconoTag /></div><span className="text-xs font-bold text-slate-600">Crear</span></button>
                    <button onClick={()=>cambiarMenu('Almacén')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-blue-100 text-blue-600 p-3 rounded-full group-hover:bg-blue-600 group-hover:text-white transition"><IconoBox /></div><span className="text-xs font-bold text-slate-600">Inventario</span></button>
                    <button onClick={()=>cambiarMenu('Obras')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-orange-100 text-orange-600 p-3 rounded-full group-hover:bg-orange-600 group-hover:text-white transition"><IconoBuilding /></div><span className="text-xs font-bold text-slate-600">Obras</span></button>
                    <button onClick={()=>cambiarMenu('Historial')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-purple-100 text-purple-600 p-3 rounded-full group-hover:bg-purple-600 group-hover:text-white transition"><IconoHistory /></div><span className="text-xs font-bold text-slate-600">Historial</span></button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-700 text-sm uppercase mb-4 flex items-center gap-2"><IconoChart/> Composición de Bodega</h3>
                  <div className="space-y-4">{Object.keys(statsPorCategoria).slice(0, 5).map((cat) => { const count = statsPorCategoria[cat]; const porcentaje = Math.round((count / kpiTotalItems) * 100) || 0; return (<div key={cat}><div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-600">{cat}</span><span className="text-slate-400">{count} ítem(s) ({porcentaje}%)</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${porcentaje}%` }}></div></div></div>)})}</div>
                </div>
                <div className="lg:col-span-2 bg-white rounded shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700 text-sm uppercase flex items-center gap-2"><IconoHistory/> Actividad Reciente</h3><button onClick={()=>cambiarMenu('Historial')} className="text-xs text-blue-600 hover:underline">Ver todo</button></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[300px]">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50"><tr><th className="px-3 py-2">Hora</th><th className="px-3 py-2">Producto</th><th className="px-3 py-2 text-center">Mov</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{historial.slice(0, 5).map((mov, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-3 py-2 text-slate-400 text-xs font-mono">{new Date(mov.fecha).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}</td><td className="px-3 py-2 font-medium text-slate-700">{mov.nombre}</td><td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mov.tipo==='ENTRADA'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{mov.tipo}</span></td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {menuActivo === 'Ingresos' && (
             <div className="max-w-2xl mx-auto bg-white rounded shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-green-600 p-6 text-white"><h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><IconoIn/> Registrar Ingreso</h2><p className="text-green-100 text-sm">Entrada de mercadería a Bodega Central</p></div>
                <form onSubmit={(e) => registrarMovimiento(e, 'ENTRADA')} className="p-6 md:p-8 space-y-6">
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Seleccionar Producto</label><select required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-green-500" onChange={(e) => setMovimientoData({...movimientoData, id_producto: e.target.value})}><option value="">-- Buscar en catálogo --</option>{materiales.map(m => (<option key={m.id} value={m.id}>{m.nombre} (SKU: {m.sku})</option>))}</select></div>
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Cantidad a Ingresar</label><input type="number" required min="1" className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-green-500 text-lg font-bold" value={movimientoData.cantidad} onChange={(e) => setMovimientoData({...movimientoData, cantidad: e.target.value})} /></div>
                   <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded text-lg transition shadow-lg">CONFIRMAR INGRESO</button>
                </form>
             </div>
          )}

          {menuActivo === 'Salidas' && (
             <div className="max-w-2xl mx-auto bg-white rounded shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-red-600 p-6 text-white"><h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><IconoOut/> Registrar Salida</h2><p className="text-red-100 text-sm">Despacho de materiales hacia Obra</p></div>
                <form onSubmit={(e) => registrarMovimiento(e, 'SALIDA')} className="p-6 md:p-8 space-y-6">
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Destino (Obra)</label><select required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500" value={movimientoData.id_obra} onChange={(e) => setMovimientoData({...movimientoData, id_obra: e.target.value})}><option value="">-- Seleccionar Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></div>
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Seleccionar Producto</label><select required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500" onChange={(e) => setMovimientoData({...movimientoData, id_producto: e.target.value})}><option value="">-- Buscar en catálogo --</option>{materiales.map(m => (<option key={m.id} value={m.id}>{m.nombre} (Disp: {m.stock_actual})</option>))}</select></div>
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Cantidad a Despachar</label><input type="number" required min="1" className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500 text-lg font-bold" value={movimientoData.cantidad} onChange={(e) => setMovimientoData({...movimientoData, cantidad: e.target.value})} /></div>
                   <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded text-lg transition shadow-lg">CONFIRMAR SALIDA</button>
                </form>
             </div>
          )}

          {menuActivo === 'Crear Producto' && (
             <div className="max-w-2xl mx-auto bg-white rounded shadow-sm border border-slate-200 h-fit">
                <div className={`bg-white px-6 py-4 border-b border-slate-100 border-l-4 ${idEditando ? 'border-orange-500' : 'border-slate-700'}`}>
                    <h3 className="font-bold text-slate-700 text-lg uppercase flex items-center gap-2"><IconoTag/> {idEditando ? 'Editar Producto' : 'Crear Producto'}</h3>
                    <p className="text-xs text-slate-400 mt-1">{idEditando ? 'Modificando información existente' : 'Registra nuevos productos. SKU automático.'}</p>
                </div>
                <form onSubmit={guardarMaterial} className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-sm font-bold text-slate-600 block mb-2">Categoría</label><input required name="categoria" value={formulario.categoria} onChange={manejarInput} type="text" className="w-full border border-slate-300 p-3 rounded bg-slate-50 outline-none focus:border-slate-500" placeholder="Ej: Herramientas" /></div>
                  </div>
                  <div><label className="text-sm font-bold text-slate-600 block mb-2">Nombre del Producto</label><input required name="nombre" value={formulario.nombre} onChange={manejarInput} type="text" className="w-full border border-slate-300 p-3 rounded bg-slate-50 outline-none focus:border-slate-500" placeholder="Ej: Taladro Percutor 500W" /></div>
                  {rolUsuario === 'ADMIN' && (
                    <div><label className="text-sm font-bold text-slate-600 block mb-2">Costo Neto Unitario ($)</label><input required name="precio_costo" value={formulario.precio_costo} onChange={manejarInput} type="number" className="w-full border border-slate-300 p-3 rounded bg-slate-50 outline-none focus:border-slate-500" placeholder="0" /></div>
                  )}
                  <div className="flex gap-2">
                     {idEditando && (<button type="button" onClick={() => { setIdEditando(null); setFormulario({ nombre: '', sku: '', precio_costo: '', categoria: '' }); }} className="w-1/3 bg-slate-300 text-slate-700 font-bold py-4 rounded hover:bg-slate-400 transition">CANCELAR</button>)}
                     <button className={`flex-1 text-white font-bold py-4 rounded shadow-md flex justify-center items-center gap-2 transition ${idEditando ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-700 hover:bg-slate-800'}`}>{idEditando ? '💾 GUARDAR CAMBIOS' : <span>+ CREAR PRODUCTO</span>}</button>
                  </div>
                </form>
             </div>
          )}

          {menuActivo === 'Almacén' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rolUsuario === 'ADMIN' && (<div className="bg-white p-4 rounded shadow-sm border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase">Valor Visible</p><p className="text-xl font-bold text-blue-600">${kpiTotalValor.toLocaleString('es-CL')}</p></div>)}
                  <div className="bg-white p-4 rounded shadow-sm border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase">Items Listados</p><p className="text-xl font-bold text-slate-700">{kpiTotalItems}</p></div>
                  <div className="bg-white p-4 rounded shadow-sm border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase">Stock Crítico</p><p className={`text-xl font-bold ${kpiStockCritico > 0 ? 'text-red-500' : 'text-green-500'}`}>{kpiStockCritico}</p></div>
                </div>
                <div className="bg-white rounded shadow-sm border border-slate-200 h-fit">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center border-l-4 border-slate-500 gap-2">
                      <span className="font-bold text-slate-700 text-sm uppercase">Inventario General</span>
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                        <button onClick={() => window.open(`${API_URL}/reporte-pdf?busqueda=${busqueda}&categoria=${filtroCategoria}`, '_blank')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-bold flex justify-center items-center gap-1 shadow-sm transition">📄 PDF</button>
                        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="text-xs px-2 py-2 border rounded outline-none bg-white font-medium text-slate-600"><option value="">Todas las Categorías</option>{categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                        <div className="flex items-center bg-white border rounded px-2"><span className="text-slate-400">🔍</span><input type="text" placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="text-xs px-2 py-2 outline-none w-full md:w-48" /></div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                          <tr><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3 text-center">Estado Stock</th>{rolUsuario === 'ADMIN' && <th className="px-4 py-3 text-right">Costo Unit.</th>}{rolUsuario === 'ADMIN' && <th className="px-4 py-3 text-right">Valor Total</th>}<th className="px-4 py-3 text-center">Acciones</th></tr>
                        </thead>
                        <tbody>
                          {materialesFiltrados.map((mat) => (
                            <tr key={mat.id} className="border-b hover:bg-slate-50 transition">
                              <td className="px-4 py-3 text-slate-500 text-xs font-mono">{mat.sku}</td>
                              <td className="px-4 py-3 font-medium text-slate-700">{mat.nombre}</td>
                              <td className="px-4 py-3"><span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">{mat.categoria || 'GENERAL'}</span></td>
                              <td className="px-4 py-3 text-center">{mat.stock_actual <= 5 ? (<span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-200">CRÍTICO ({mat.stock_actual})</span>) : mat.stock_actual <= 20 ? (<span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200">BAJO ({mat.stock_actual})</span>) : (<span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-200">NORMAL ({mat.stock_actual})</span>)}</td>
                              {rolUsuario === 'ADMIN' && <td className="px-4 py-3 text-right text-slate-500">${parseInt(mat.precio_costo).toLocaleString()}</td>}
                              {rolUsuario === 'ADMIN' && <td className="px-4 py-3 text-right font-bold text-slate-700">${(mat.stock_actual * mat.precio_costo).toLocaleString()}</td>}
                              <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                <button onClick={() => cargarProductoParaEditar(mat)} className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-blue-50" title="Editar"><IconoEdit /></button>
                                <button onClick={() => eliminarProducto(mat.id, mat.nombre)} className="text-slate-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50" title="Eliminar"><IconoTrash /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
            </div>
          )}

          {menuActivo === 'Obras' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full content-start">
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit overflow-hidden">
                <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                  <h3 className="font-bold text-white text-lg uppercase flex items-center gap-2"><IconoBriefcase/> Gestión de Proyectos</h3>
                  <p className="text-xs text-slate-400 mt-1">Crea centros de costos para asignar materiales.</p>
                </div>
                <form onSubmit={guardarObra} className="p-6 space-y-4">
                  <div><label className="text-xs font-bold text-slate-500 block mb-1">Nombre del Proyecto</label><input required value={formObra.nombre} onChange={e=>setFormObra({...formObra, nombre: e.target.value})} type="text" className="w-full border border-slate-300 p-3 rounded bg-slate-50 focus:bg-white transition" placeholder="Ej: Edificio Centro" /></div>
                  <div><label className="text-xs font-bold text-slate-500 block mb-1">Cliente / Encargado</label><input required value={formObra.cliente} onChange={e=>setFormObra({...formObra, cliente: e.target.value})} type="text" className="w-full border border-slate-300 p-3 rounded bg-slate-50 focus:bg-white transition" placeholder="Ej: Constructora XYZ" /></div>
                  {rolUsuario === 'ADMIN' && (
                    <div><label className="text-xs font-bold text-slate-500 block mb-1">Presupuesto ($)</label><input value={formObra.presupuesto} onChange={e=>setFormObra({...formObra, presupuesto: e.target.value})} type="number" className="w-full border border-slate-300 p-3 rounded bg-slate-50 focus:bg-white transition" /></div>
                  )}
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded shadow-md transition active:scale-95">CREAR NUEVO PROYECTO</button>
                </form>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                 {obras.map(o => (
                   <div key={o.id} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group hover:shadow-md transition ${o.nombre === 'Bodega Central' ? 'border-l-4 border-l-blue-600' : 'border-l-4 border-l-orange-500'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className={`p-3 rounded-lg ${o.nombre === 'Bodega Central' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}><IconoBuilding /></div>
                           <div><h3 className="font-bold text-slate-800 text-lg leading-tight">{o.nombre}</h3><p className="text-xs text-slate-500 font-medium uppercase mt-1">{o.cliente}</p></div>
                        </div>
                        {o.nombre !== 'Bodega Central' && (<button onClick={() => eliminarObra(o.id, o.nombre)} className="text-slate-300 hover:text-red-500 transition"><IconoTrash /></button>)}
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-3 rounded border border-slate-100 flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500 uppercase">Estado</span><span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">● En Ejecución</span>
                        </div>
                        {rolUsuario === 'ADMIN' && (<div className="flex justify-between items-center px-1"><span className="text-xs font-bold text-slate-400 uppercase">Presupuesto</span><span className="text-sm font-bold text-slate-700">${parseInt(o.presupuesto).toLocaleString()}</span></div>)}
                        
                        <div className="flex justify-between items-center px-1 border-t border-slate-100 pt-2 mt-2">
                             <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                <IconoBox/> {o.nombre === 'Bodega Central' ? 'Valor Materiales' : 'Materiales Recibidos'}
                             </span>
                             <span className="text-lg font-bold text-slate-800">
                                {o.nombre === 'Bodega Central' 
                                   ? `$${materiales.reduce((acc, m) => acc + (m.stock_actual * m.precio_costo), 0).toLocaleString('es-CL')}` // Bodega = Plata
                                   : <span>{calcularMaterialesEnObra(o.id)} <span className="text-xs text-slate-400 font-normal">unid.</span></span> // Obra = Unidades
                                } 
                             </span>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {menuActivo === 'Historial' && (
             <div className="bg-white rounded shadow-sm border border-slate-200 h-full flex flex-col">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center border-l-4 border-purple-500 gap-2">
                  <h3 className="font-bold text-slate-700 text-sm uppercase">Bitácora de Movimientos</h3>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                    <button onClick={() => window.open(`${API_URL}/reporte-historial-pdf?busqueda=${busquedaHistorial}&tipo=${filtroTipoHistorial}`, '_blank')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-bold flex justify-center items-center gap-1 shadow-sm transition">📄 PDF</button>
                    <div className="flex bg-white rounded border overflow-hidden"><button onClick={()=>setFiltroTipoHistorial('TODOS')} className={`px-3 py-2 text-xs font-bold ${filtroTipoHistorial==='TODOS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Todos</button><button onClick={()=>setFiltroTipoHistorial('ENTRADA')} className={`px-3 py-2 text-xs font-bold ${filtroTipoHistorial==='ENTRADA' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Entradas</button><button onClick={()=>setFiltroTipoHistorial('SALIDA')} className={`px-3 py-2 text-xs font-bold ${filtroTipoHistorial==='SALIDA' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Salidas</button></div>
                    <div className="flex items-center bg-white border rounded px-2"><IconoFilter className="text-slate-400 w-3 h-3"/><input type="text" placeholder="Buscar..." value={busquedaHistorial} onChange={e=>setBusquedaHistorial(e.target.value)} className="text-xs px-2 py-2 outline-none w-full md:w-48" /></div>
                  </div>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0"><tr><th className="px-4 py-3">Fecha/Hora</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3 text-center">Tipo</th><th className="px-4 py-3 text-center">Cantidad</th><th className="px-4 py-3">Origen / Destino</th><th className="px-4 py-3 text-center">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {historialFiltrado.map((mov, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{new Date(mov.fecha).toLocaleDateString()} <span className="text-slate-400">{new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></td>
                          <td className="px-4 py-3 font-medium text-slate-700">{mov.nombre} <span className="block text-xs text-slate-400 font-normal">{mov.sku}</span></td>
                          <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{mov.tipo}</span></td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700 text-lg">{mov.cantidad}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{mov.tipo === 'SALIDA' ? (<span className="flex items-center gap-1 font-bold text-orange-600"><IconoBuilding className="w-3 h-3"/> {mov.nombre_obra || 'Obra Desconocida'}</span>) : (<span className="flex items-center gap-1 text-slate-400">🏢 Bodega Central</span>)}</td>
                          <td className="px-4 py-3 text-center"><button onClick={() => eliminarMovimiento(mov.id)} className="text-slate-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"><IconoTrash /></button></td>
                        </tr>
                      ))}
                      {historialFiltrado.length === 0 && (<tr><td colSpan="6" className="text-center py-12 text-slate-400 italic">No se encontraron movimientos que coincidan con la búsqueda.</td></tr>)}
                    </tbody>
                  </table>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App