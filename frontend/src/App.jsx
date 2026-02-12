import { useEffect, useState } from 'react'

// IMPORTAMOS LOS ICONOS
import { 
  IconoHome, IconoBox, IconoHistory, IconoBuilding, IconoIn, 
  IconoOut, IconoChart, IconoMail, IconoLock, IconoFilter, 
  IconoTrash, IconoMenu, IconoClose, IconoEdit, IconoBriefcase, 
  IconoUpload 
} from './components/Icons'

function App() {
  const API_URL = 'https://obralink-sistema.onrender.com';

  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [rolUsuario, setRolUsuario] = useState('') 
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [errorLogin, setErrorLogin] = useState('')
  const [recordarSesion, setRecordarSesion] = useState(false)
  
  const [materiales, setMateriales] = useState([])
  const [historial, setHistorial] = useState([])
  const [obras, setObras] = useState([])
  
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState('TODOS')

  const [obraSeleccionada, setObraSeleccionada] = useState(null)

  const [ingresoManual, setIngresoManual] = useState({
    esNuevo: false,
    id_producto: '',
    nombre_nuevo: '',
    categoria: '',
    cantidad: '',
    precio_unitario: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    recibido_por: ''
  })

  const [formulario, setFormulario] = useState({ 
    nombre: '', sku: '', precio_costo: '', categoria: '',
    proveedor: '', recibido_por: ''
  })
  const [idEditando, setIdEditando] = useState(null)
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false)

  const [formObra, setFormObra] = useState({ nombre: '', cliente: '', presupuesto: '' })
  
  const [movimientoData, setMovimientoData] = useState({ 
    id_producto: '', 
    cantidad: '', 
    id_obra: '', 
    fecha: new Date().toISOString().split('T')[0],
    recibido_por: ''
  })
  
  const [tabIngreso, setTabIngreso] = useState('MANUAL')
  const [productosFactura, setProductosFactura] = useState([])
  const [cargandoFactura, setCargandoFactura] = useState(false)

  const [menuActivo, setMenuActivo] = useState('Inicio')
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false) 

  const categoriasUnicas = [...new Set(materiales.map(m => m.categoria || 'Sin Categoría'))]
  const proveedoresUnicos = [...new Set(materiales.map(m => m.ultimo_proveedor || '').filter(p => p !== ''))]
  
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

  // --- LOGICA DE ÚLTIMOS MOVIMIENTOS (MEMORIA CORTO PLAZO) ---
  
  // 1. ÚLTIMOS INGRESOS (Más reciente primero)
  const ultimosIngresos = historial
    .filter(h => h.tipo === 'ENTRADA')
    .slice(0, 5); // Tomamos los 5 primeros (el historial ya viene ordenado por fecha DESC del backend)

  // 2. ÚLTIMAS SALIDAS (Más reciente primero)
  const ultimasSalidas = historial
    .filter(h => h.tipo === 'SALIDA')
    .slice(0, 5);

  const obrasReales = obras.filter(o => o.nombre !== 'Bodega Central');

  const kpiTotalValor = materiales.reduce((acc, m) => acc + (m.stock_actual * m.precio_costo), 0)
  const kpiTotalItems = materiales.length
  const kpiStockCritico = materiales.filter(m => m.stock_actual < 5).length
  const kpiObrasActivas = obrasReales.length 

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
        if (recordarSesion) {
          localStorage.setItem('usuario_obralink', d.nombre);
          localStorage.setItem('rol_obralink', d.rol);
        }
      } else { setErrorLogin('Acceso denegado'); }
    } catch { setErrorLogin('Sin conexión con el servidor'); } 
  }

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
      
      if (dObras.length > 0) {
         const obrasValidas = dObras.filter(o => o.nombre !== 'Bodega Central');
         if (obrasValidas.length > 0 && !movimientoData.id_obra) {
            setMovimientoData(prev => ({...prev, id_obra: obrasValidas[0].id}));
         }
      }

      const rHist = await fetch(`${API_URL}/movimientos`); const dHist = await rHist.json(); setHistorial(dHist); 
    } catch (e) { console.error("Error cargando datos:", e); } 
  }

  const registrarIngresoCompleto = async (e) => {
    e.preventDefault();
    if (ingresoManual.esNuevo && !ingresoManual.nombre_nuevo) return alert("⚠️ Falta el nombre del producto nuevo");
    if (!ingresoManual.esNuevo && !ingresoManual.id_producto) return alert("⚠️ Selecciona un producto existente");
    if (!ingresoManual.cantidad || !ingresoManual.precio_unitario) return alert("⚠️ Faltan datos numéricos");

    const payload = {
        esNuevo: ingresoManual.esNuevo,
        id_producto: ingresoManual.id_producto,
        nombre: ingresoManual.esNuevo ? ingresoManual.nombre_nuevo : '', 
        categoria: ingresoManual.categoria,
        cantidad: ingresoManual.cantidad,
        precio_unitario: ingresoManual.precio_unitario,
        fecha: ingresoManual.fecha,
        proveedor: ingresoManual.proveedor,
        recibido_por: ingresoManual.recibido_por
    };

    try {
        const r = await fetch(`${API_URL}/registrar-ingreso-completo`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const d = await r.json();
        
        if(d.success) {
            alert("✅ Ingreso registrado con éxito");
            setIngresoManual({ ...ingresoManual, nombre_nuevo: '', cantidad: '', precio_unitario: '', proveedor: '', recibido_por: '' });
            obtenerDatos();
        } else {
            alert("❌ Error al registrar: " + (d.error || "Error desconocido en servidor"));
        }
    } catch (e) { alert("Error de conexión: " + e.message); }
  }

  const guardarEdicion = async (e) => { 
    e.preventDefault(); 
    if (!idEditando) return;
    await fetch(`${API_URL}/productos/${idEditando}`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) 
    });
    alert("✅ Producto actualizado");
    setMostrarModalEdicion(false);
    setIdEditando(null); 
    obtenerDatos(); 
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
    
    await fetch(`${API_URL}/movimientos`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            id_producto: movimientoData.id_producto, 
            tipo: tipo, 
            cantidad: movimientoData.cantidad, 
            id_obra: obraFinal,
            fecha: movimientoData.fecha,
            recibido_por: movimientoData.recibido_por
        }) 
    }); 
    setMovimientoData({ ...movimientoData, cantidad: '', recibido_por: '' }); obtenerDatos();
    alert(tipo === 'ENTRADA' ? "✅ Ingreso a bodega registrado" : "🚀 Despacho a obra registrado");
  }

  const procesarFactura = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargandoFactura(true);
    const formData = new FormData();
    formData.append('factura', file);
    try {
      const r = await fetch(`${API_URL}/subir-factura`, { method: 'POST', body: formData });
      if (!r.ok) throw new Error(`Error: ${r.statusText}`);
      const d = await r.json();
      if (d.success) {
        d.productos.length === 0 ? alert("⚠️ No se detectaron productos.") : setProductosFactura(d.productos);
      } else { alert("❌ Error leyendo factura."); }
    } catch (error) { alert(`Error de conexión: ${error.message}`); } 
    finally { setCargandoFactura(false); e.target.value = null; }
  }

  const ingresarProductosFactura = async () => {
    if(!window.confirm(`¿Confirmas el ingreso de ${productosFactura.length} productos?`)) return;
    try {
      const r = await fetch(`${API_URL}/ingreso-masivo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productos: productosFactura }) });
      const d = await r.json();
      if (d.success) { alert("✅ Inventario actualizado."); setProductosFactura([]); setTabIngreso('MANUAL'); obtenerDatos(); } else { alert("Error al guardar."); }
    } catch (error) { alert("Error de conexión."); }
  }

  const eliminarProducto = async (id, nombre) => {
    if (window.confirm(`⚠️ ¿Eliminar "${nombre}"?`)) {
      try { await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' }); obtenerDatos(); } catch (e) { alert("Error al eliminar"); }
    }
  }
  const eliminarMovimiento = async (id) => {
    if (window.confirm(`¿Anular registro y REVERTIR stock?`)) {
      try { await fetch(`${API_URL}/movimientos/${id}`, { method: 'DELETE' }); obtenerDatos(); } catch (e) { alert("Error al eliminar"); }
    }
  }
  const eliminarObra = async (id, nombre) => {
    if (window.confirm(`⚠️ ¿Eliminar obra "${nombre}"?`)) {
      try { const response = await fetch(`${API_URL}/obras/${id}`, { method: 'DELETE' }); if (!response.ok) { return alert("⛔ No puedes eliminar la Bodega Central."); } obtenerDatos(); } catch (e) { alert("Error de conexión."); }
    }
  }
  
  const manejarInput = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value })
  const abrirEdicion = (prod) => {
    setFormulario({ 
        nombre: prod.nombre, 
        sku: prod.sku, 
        precio_costo: prod.precio_costo, 
        categoria: prod.categoria,
        proveedor: prod.ultimo_proveedor || '', 
        recibido_por: ''
    });
    setIdEditando(prod.id);
    setMostrarModalEdicion(true);
 }
  const cambiarMenu = (nuevoMenu) => { 
      setMenuActivo(nuevoMenu); 
      setMenuMovilAbierto(false); 
      setObraSeleccionada(null); 
  }
  const calcularMaterialesEnObra = (obraId) => historial.filter(h => h.id_obra === obraId && h.tipo === 'SALIDA').reduce((acc, item) => acc + parseInt(item.cantidad), 0);

  useEffect(() => { if(usuarioLogueado) obtenerDatos() }, [usuarioLogueado, menuActivo])

  if (!usuarioLogueado) {
    return (
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="relative z-10"><h1 className="text-white text-5xl font-extrabold flex items-center gap-3 tracking-tight"><span className="text-blue-500">●</span> ObraLink</h1></div>
          <div className="relative z-10 max-w-lg mt-8"><blockquote className="text-3xl text-slate-300 font-medium leading-relaxed italic border-l-4 border-blue-500 pl-4">"El orden es el primer paso para la eficiencia."</blockquote><p className="mt-6 text-blue-400 text-sm tracking-[0.2em] uppercase font-bold">Gestión de Inventario 2026</p></div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
          <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 relative z-10">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg shadow-blue-300"><IconoBox/></div>
                <h2 className="text-3xl font-bold text-slate-800">Bienvenido</h2>
                <p className="text-slate-400 text-sm mt-2">Ingresa tus credenciales para continuar</p>
            </div>
            <form onSubmit={manejarLogin} className="space-y-6">
              <div><label className="block text-sm font-bold text-slate-700 mb-2 uppercase text-xs tracking-wider">Correo Electrónico</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><IconoMail /></div><input type="email" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" value={loginData.email} onChange={e=>setLoginData({...loginData, email:e.target.value})} placeholder="nombre@empresa.com" /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2 uppercase text-xs tracking-wider">Contraseña</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><IconoLock /></div><input type="password" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" value={loginData.password} onChange={e=>setLoginData({...loginData, password:e.target.value})} placeholder="••••••••" /></div></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="recordar" className="rounded text-blue-600 focus:ring-blue-500" checked={recordarSesion} onChange={(e) => setRecordarSesion(e.target.checked)}/><label htmlFor="recordar" className="text-sm text-slate-600 cursor-pointer font-medium">Mantener sesión iniciada</label></div>
              {errorLogin && (<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex justify-center items-center gap-2 border border-red-100 animate-pulse"><span>⚠️</span> {errorLogin}</div>)}
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transform hover:scale-[1.02] transition-all duration-200">INGRESAR AL SISTEMA</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-700 relative selection:bg-blue-100 selection:text-blue-900">
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); }
      `}</style>

      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 shadow-md">
         <span className="font-bold text-lg flex items-center gap-2"><span className="text-blue-500">●</span> ObraLink</span>
         <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}>{menuMovilAbierto ? <IconoClose /> : <IconoMenu />}</button>
      </div>

      <aside className={`fixed inset-y-0 left-0 transform ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out w-72 bg-slate-900 text-slate-300 flex-shrink-0 z-40 min-h-screen flex flex-col shadow-2xl`}>
        <div className="h-20 hidden md:flex items-center px-8 bg-slate-950 font-extrabold text-white text-xl tracking-wider border-b border-slate-800"><span className="text-blue-500 mr-2 text-2xl">●</span> ObraLink</div>
        <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-gradient-to-b from-slate-900 to-slate-900/50">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 ${rolUsuario === 'ADMIN' ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400' : 'bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400'}`}>{usuarioLogueado.charAt(0).toUpperCase()}</div>
          <div className="overflow-hidden"><p className="text-white text-base font-bold truncate">{usuarioLogueado}</p><p className="text-[10px] uppercase text-blue-400 tracking-widest font-extrabold">{rolUsuario}</p></div>
        </div>
        <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Dashboard</p>
          <button onClick={()=>cambiarMenu('Inicio')} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${menuActivo === 'Inicio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><IconoHome/><span className="ml-3 font-medium">Inicio</span></button>
          
          <p className="px-4 text-[10px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest mt-6">Operaciones</p>
          <button onClick={()=>cambiarMenu('Ingresos')} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${menuActivo === 'Ingresos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><IconoIn/><span className="ml-3 font-medium">Ingresos</span></button>
          <button onClick={()=>cambiarMenu('Salidas')} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${menuActivo === 'Salidas' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'hover:bg-slate-800 hover:text-white'}`}><IconoOut/><span className="ml-3 font-medium">Salidas</span></button>

          <p className="px-4 text-[10px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest mt-6">Gestión</p>
          <button onClick={()=>cambiarMenu('Almacén')} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${menuActivo === 'Almacén' ? 'bg-slate-700 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><IconoBox/><span className="ml-3 font-medium">Almacén</span></button>
          <button onClick={()=>cambiarMenu('Obras')} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${menuActivo === 'Obras' ? 'bg-slate-700 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><IconoBuilding/><span className="ml-3 font-medium">Obras</span></button>
          <button onClick={()=>cambiarMenu('Historial')} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${menuActivo === 'Historial' ? 'bg-slate-700 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><IconoHistory/><span className="ml-3 font-medium">Historial</span></button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden">
        <header className="hidden md:flex h-20 bg-white shadow-sm border-b border-slate-200 items-center justify-between px-8 z-10 sticky top-0">
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="text-slate-300 font-light">/</span> {menuActivo}</div>
          <button onClick={cerrarSesion} className="text-xs font-bold text-rose-500 hover:text-rose-700 uppercase border border-rose-100 bg-rose-50 px-4 py-2 rounded-lg hover:bg-rose-100 transition-colors">Cerrar Sesión</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 pb-20 md:pb-8">
          <datalist id="lista-categorias">{categoriasUnicas.map((cat, i) => <option key={i} value={cat} />)}</datalist>
          <datalist id="lista-proveedores">{proveedoresUnicos.map((prov, i) => <option key={i} value={prov} />)}</datalist>

          <div className="animate-fade-in">
          {menuActivo === 'Inicio' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-200 h-36 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden" onClick={()=>cambiarMenu('Almacén')}>
                    <div className="absolute top-0 right-0 p-4 opacity-10"><IconoBox /></div>
                    <div><h3 className="text-3xl font-bold tracking-tight">${kpiTotalValor.toLocaleString('es-CL')}</h3><p className="text-blue-100 text-xs font-bold uppercase mt-1 tracking-wider">Inversión Stock</p></div>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-2xl shadow-xl shadow-rose-200 h-36 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300" onClick={()=>cambiarMenu('Almacén')}>
                    <div><h3 className="text-3xl font-bold tracking-tight">{kpiStockCritico}</h3><p className="text-rose-100 text-xs font-bold uppercase mt-1 tracking-wider">Stock Crítico (!)</p></div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-200 h-36 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300" onClick={()=>cambiarMenu('Obras')}>
                    <div><h3 className="text-3xl font-bold tracking-tight">{kpiObrasActivas}</h3><p className="text-amber-100 text-xs font-bold uppercase mt-1 tracking-wider">Obras Activas</p></div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl shadow-emerald-200 h-36 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300" onClick={()=>cambiarMenu('Ingresos')}>
                    <div><h3 className="text-3xl font-bold tracking-tight">{kpiTotalItems}</h3><p className="text-emerald-100 text-xs font-bold uppercase mt-1 tracking-wider">Total Ítems</p></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-600 text-sm uppercase mb-4 flex items-center gap-2 tracking-wider">Accesos Rápidos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <button onClick={()=>cambiarMenu('Ingresos')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 group"><div className="bg-emerald-50 text-emerald-600 p-4 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300"><IconoIn /></div><span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">Ingresos</span></button>
                    <button onClick={()=>cambiarMenu('Salidas')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-rose-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 group"><div className="bg-rose-50 text-rose-600 p-4 rounded-full group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300"><IconoOut /></div><span className="text-xs font-bold text-slate-600 group-hover:text-rose-700">Salidas</span></button>
                    <button onClick={()=>cambiarMenu('Almacén')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 group"><div className="bg-blue-50 text-blue-600 p-4 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300"><IconoBox /></div><span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">Inventario</span></button>
                    <button onClick={()=>cambiarMenu('Obras')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 group"><div className="bg-amber-50 text-amber-600 p-4 rounded-full group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300"><IconoBuilding /></div><span className="text-xs font-bold text-slate-600 group-hover:text-amber-700">Obras</span></button>
                    <button onClick={()=>cambiarMenu('Historial')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 group"><div className="bg-purple-50 text-purple-600 p-4 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300"><IconoHistory /></div><span className="text-xs font-bold text-slate-600 group-hover:text-purple-700">Historial</span></button>
                </div>
              </div>
            </div>
          )}

          {menuActivo === 'Ingresos' && (
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white flex justify-between items-center">
                    <div><h2 className="text-2xl font-bold flex items-center gap-3"><IconoIn/> Registrar Ingreso</h2><p className="text-emerald-100 text-sm mt-1">Entrada de mercadería a Bodega</p></div>
                    <div className="flex bg-emerald-800/50 backdrop-blur rounded-lg p-1 gap-1">
                        <button onClick={()=>setTabIngreso('MANUAL')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${tabIngreso==='MANUAL' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white'}`}>Manual</button>
                        <button onClick={()=>setTabIngreso('FACTURA')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${tabIngreso==='FACTURA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white'}`}>Subir Factura</button>
                    </div>
                    </div>

                    {tabIngreso === 'MANUAL' ? (
                    <form onSubmit={registrarIngresoCompleto} className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <input type="checkbox" id="esNuevo" className="w-5 h-5 accent-emerald-600 rounded" checked={ingresoManual.esNuevo} onChange={(e) => setIngresoManual({...ingresoManual, esNuevo: e.target.checked})} />
                            <label htmlFor="esNuevo" className="font-bold text-slate-700 cursor-pointer select-none">¿Es un Producto Nuevo?</label>
                        </div>
                        {ingresoManual.esNuevo ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nombre del Producto *</label><input required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition" type="text" placeholder="Ej: Martillo" value={ingresoManual.nombre_nuevo} onChange={e=>setIngresoManual({...ingresoManual, nombre_nuevo: e.target.value})} /></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Categoría</label>
                                    <input className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition" type="text" placeholder="Ej: Herramientas" list="lista-categorias" value={ingresoManual.categoria} onChange={e=>setIngresoManual({...ingresoManual, categoria: e.target.value})} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Seleccionar Producto Existente *</label>
                                <select required className="w-full border border-slate-300 p-3 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition" value={ingresoManual.id_producto} onChange={(e) => setIngresoManual({...ingresoManual, id_producto: e.target.value})}>
                                    <option value="">-- Buscar en catálogo --</option>
                                    {materiales.map(m => (<option key={m.id} value={m.id}>{m.nombre} (SKU: {m.sku})</option>))}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Fecha Real del Ingreso *</label><input required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition" type="date" value={ingresoManual.fecha} onChange={e=>setIngresoManual({...ingresoManual, fecha: e.target.value})} /></div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Empresa / Proveedor</label>
                                <input className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition" type="text" placeholder="Ej: Sodimac" list="lista-proveedores" value={ingresoManual.proveedor} onChange={e=>setIngresoManual({...ingresoManual, proveedor: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Cantidad *</label><input required className="w-full border border-slate-300 p-3 rounded-xl font-bold text-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition" type="number" min="1" placeholder="0" value={ingresoManual.cantidad} onChange={e=>setIngresoManual({...ingresoManual, cantidad: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Precio Unitario ($) *</label><input required className="w-full border border-slate-300 p-3 rounded-xl font-bold text-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition" type="number" min="0" placeholder="0" value={ingresoManual.precio_unitario} onChange={e=>setIngresoManual({...ingresoManual, precio_unitario: e.target.value})} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Recibido Por (En Bodega)</label>
                            <input className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition" type="text" placeholder="Nombre del responsable" value={ingresoManual.recibido_por} onChange={e=>setIngresoManual({...ingresoManual, recibido_por: e.target.value})} />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl text-right border border-slate-100">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Costo Total Estimado</span>
                            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">${((ingresoManual.cantidad || 0) * (ingresoManual.precio_unitario || 0)).toLocaleString('es-CL')}</span>
                        </div>
                        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">CONFIRMAR INGRESO</button>
                    </form>
                    ) : (
                    <div className="p-8 space-y-6">
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 gap-4 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer relative group">
                            <div className="bg-slate-100 p-4 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors"><IconoUpload /></div>
                            <span className="text-sm font-bold">Haz clic o arrastra tu Factura (PDF/Imagen)</span>
                            <input type="file" onChange={procesarFactura} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,image/*" />
                        </div>
                        {cargandoFactura && <div className="text-center py-4"><p className="text-emerald-600 font-bold animate-pulse">Analizando documento con IA...</p></div>}
                        {productosFactura.length > 0 && (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                            <h4 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wide">Productos Detectados ({productosFactura.length})</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {productosFactura.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm bg-white p-3 rounded border border-slate-100 shadow-sm"><span className="font-medium text-slate-700">{p.nombre}</span><span className="font-bold text-emerald-600">{p.cantidad} unid.</span></div>
                                ))}
                            </div>
                            <button onClick={ingresarProductosFactura} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02]">INGRESAR TODO</button>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {/* === NUEVA SECCIÓN: LO ÚLTIMO AGREGADO (VISIBLE SIEMPRE) === */}
                <div className="bg-slate-50 border-t border-slate-200 pt-6">
                    <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 pl-2 flex items-center gap-2">
                        <IconoHistory className="w-4 h-4"/> Últimos Ingresos Registrados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                        {ultimosIngresos.length > 0 ? (
                            ultimosIngresos.map((mov, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center animate-fade-in hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 text-emerald-600 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{mov.nombre}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                                                Cargado a las: {new Date(mov.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • SKU: {mov.sku}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-emerald-600 text-sm">+{mov.cantidad} unid.</span>
                                        <span className="text-[9px] text-slate-400 uppercase font-bold bg-slate-100 px-2 py-0.5 rounded">{mov.proveedor || 'Sin Prov.'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-sm italic bg-white rounded-xl border border-dashed border-slate-300">
                                No has ingresado nada recientemente.
                            </div>
                        )}
                    </div>
                </div>
             </div>
          )}

          {menuActivo === 'Salidas' && (
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-8 text-white"><h2 className="text-2xl font-bold flex items-center gap-3"><IconoOut/> Registrar Salida</h2><p className="text-rose-100 text-sm mt-1">Despacho de materiales hacia Obra</p></div>
                    <form onSubmit={(e) => registrarMovimiento(e, 'SALIDA')} className="p-8 space-y-6">
                        <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Destino (Obra)</label>
                                <select required className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-500 transition" value={movimientoData.id_obra} onChange={(e) => setMovimientoData({...movimientoData, id_obra: e.target.value})}>
                                    <option value="">-- Seleccionar Obra --</option>
                                    {obrasReales.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                                </select>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Seleccionar Producto</label><select required className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-500 transition" onChange={(e) => setMovimientoData({...movimientoData, id_producto: e.target.value})}><option value="">-- Buscar en catálogo --</option>{materiales.map(m => (<option key={m.id} value={m.id}>{m.nombre} (Disp: {m.stock_actual})</option>))}</select></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Cantidad a Despachar</label><input type="number" required min="1" className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-500 text-lg font-bold" value={movimientoData.cantidad} onChange={(e) => setMovimientoData({...movimientoData, cantidad: e.target.value})} /></div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fecha del Despacho</label><input type="date" required className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-500" value={movimientoData.fecha} onChange={(e) => setMovimientoData({...movimientoData, fecha: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Responsable / Quién Retira</label><input type="text" required className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-500" placeholder="Nombre..." value={movimientoData.recibido_por} onChange={(e) => setMovimientoData({...movimientoData, recibido_por: e.target.value})} /></div>
                        </div>

                        <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">CONFIRMAR SALIDA</button>
                    </form>
                </div>

                {/* === NUEVA SECCIÓN: ÚLTIMAS SALIDAS (VISIBLE SIEMPRE) === */}
                <div className="bg-slate-50 border-t border-slate-200 pt-6">
                    <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 pl-2 flex items-center gap-2">
                        <IconoHistory className="w-4 h-4"/> Últimas Salidas Registradas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                        {ultimasSalidas.length > 0 ? (
                            ultimasSalidas.map((mov, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center animate-fade-in hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-rose-100 text-rose-600 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{mov.nombre}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                                                Retiró: {mov.recibido_por} • Destino: {mov.nombre_obra}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-rose-600 text-sm">-{mov.cantidad} unid.</span>
                                        <span className="text-[9px] text-slate-400 uppercase font-bold bg-slate-100 px-2 py-0.5 rounded">{new Date(mov.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-sm italic bg-white rounded-xl border border-dashed border-slate-300">
                                No has registrado salidas recientes.
                            </div>
                        )}
                    </div>
                </div>
             </div>
          )}

          {menuActivo === 'Almacén' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rolUsuario === 'ADMIN' && (<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div className="flex flex-col"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Valor Inventario</p><p className="text-2xl font-bold text-blue-600 mt-1">${kpiTotalValor.toLocaleString('es-CL')}</p></div><div className="bg-blue-50 p-3 rounded-full text-blue-600"><IconoChart/></div></div>)}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div className="flex flex-col"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Items Únicos</p><p className="text-2xl font-bold text-slate-700 mt-1">{kpiTotalItems}</p></div><div className="bg-slate-50 p-3 rounded-full text-slate-600"><IconoBox/></div></div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"><div className="flex flex-col"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Stock Crítico</p><p className={`text-2xl font-bold mt-1 ${kpiStockCritico > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{kpiStockCritico} <span className="text-xs font-normal text-slate-400">productos</span></p></div><div className={`p-3 rounded-full ${kpiStockCritico > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}><IconoFilter/></div></div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-fit relative">
                    {/* MODAL DE EDICIÓN MEJORADO */}
                    {mostrarModalEdicion && (
                        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-800 border-b pb-4"><IconoEdit/> Editar Producto</h3>
                                <form onSubmit={guardarEdicion} className="space-y-5">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Nombre del Producto</label><input className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formulario.nombre} onChange={manejarInput} name="nombre" /></div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">SKU</label><input className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50" value={formulario.sku} onChange={manejarInput} name="sku" /></div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Categoría</label><input className="w-full border border-slate-300 p-3 rounded-xl" value={formulario.categoria} onChange={manejarInput} name="categoria" list="lista-categorias" />
                                        </div>
                                    </div>
                                    
                                    {rolUsuario === 'ADMIN' && (
                                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                          <label className="text-xs font-bold text-blue-600 block mb-1 uppercase tracking-wide">Precio Costo Unitario ($)</label><input className="w-full border border-blue-200 p-3 rounded-xl font-bold text-lg bg-white" type="number" value={formulario.precio_costo} onChange={manejarInput} name="precio_costo" />
                                       </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-5 pt-2">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Proveedor (Último)</label><input className="w-full border border-slate-300 p-3 rounded-xl" placeholder="Ej: Sodimac" value={formulario.proveedor} onChange={manejarInput} name="proveedor" list="lista-proveedores" />
                                        </div>
                                        <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Recibido Por</label><input className="w-full border border-slate-300 p-3 rounded-xl" placeholder="Nombre" value={formulario.recibido_por} onChange={manejarInput} name="recibido_por" /></div>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button type="button" onClick={() => setMostrarModalEdicion(false)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold transition">Cancelar</button>
                                        <button className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition">Guardar Cambios</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4">
                      <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">Inventario General</span>
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                        <button onClick={() => window.open(`${API_URL}/reporte-pdf?busqueda=${busqueda}&categoria=${filtroCategoria}`, '_blank')} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-2 shadow-md transition-all">📄 PDF</button>
                        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="text-xs px-3 py-2.5 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-600 focus:border-blue-500"><option value="">Todas las Categorías</option>{categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                        <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all"><span className="text-slate-400"><IconoFilter className="w-4 h-4"/></span><input type="text" placeholder="Buscar producto..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="text-xs px-2 outline-none w-full md:w-48 bg-transparent" /></div>
                      </div>
                    </div>
                    
                    {/* --- VISTA MÓVIL (TARJETAS) --- */}
                    <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
                        {materialesFiltrados.map(mat => (
                            <div key={mat.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${mat.stock_actual <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{mat.nombre}</h3>
                                        <p className="text-xs text-slate-400 font-mono">{mat.sku}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => abrirEdicion(mat)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><IconoEdit /></button>
                                        <button onClick={() => eliminarProducto(mat.id, mat.nombre)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><IconoTrash /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Categoría</p>
                                        <p className="text-sm font-medium text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded mt-1">{mat.categoria || 'General'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Stock</p>
                                        <p className={`text-sm font-bold mt-1 ${mat.stock_actual <= 5 ? 'text-rose-600' : 'text-emerald-600'}`}>{mat.stock_actual} unid.</p>
                                    </div>
                                    {rolUsuario === 'ADMIN' && (
                                        <div className="col-span-2 border-t border-slate-100 pt-2 mt-1 flex justify-between items-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p>
                                            <p className="text-base font-bold text-slate-800">${(mat.stock_actual * mat.precio_costo).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- VISTA ESCRITORIO (TABLA) --- */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                          <tr><th className="px-6 py-4 font-bold tracking-wider">SKU</th><th className="px-6 py-4 font-bold tracking-wider">Producto</th><th className="px-6 py-4 font-bold tracking-wider">Categoría</th><th className="px-6 py-4 text-center font-bold tracking-wider">Estado Stock</th>{rolUsuario === 'ADMIN' && <th className="px-6 py-4 text-right font-bold tracking-wider">Costo Unit.</th>}{rolUsuario === 'ADMIN' && <th className="px-6 py-4 text-right font-bold tracking-wider">Valor Total</th>}<th className="px-6 py-4 text-center font-bold tracking-wider">Acciones</th></tr>
                        </thead>
                        <tbody>
                          {materialesFiltrados.map((mat) => (
                            <tr key={mat.id} className="hover:bg-blue-50/50 transition-colors group">
                              <td className="px-6 py-4 text-slate-500 text-xs font-mono">{mat.sku}</td>
                              <td className="px-6 py-4 font-medium text-slate-700">{mat.nombre}</td>
                              <td className="px-6 py-4"><span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">{mat.categoria || 'GENERAL'}</span></td>
                              <td className="px-6 py-4 text-center">{mat.stock_actual <= 5 ? (<span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 shadow-sm">CRÍTICO ({mat.stock_actual})</span>) : mat.stock_actual <= 20 ? (<span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">BAJO ({mat.stock_actual})</span>) : (<span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">NORMAL ({mat.stock_actual})</span>)}</td>
                              {rolUsuario === 'ADMIN' && <td className="px-6 py-4 text-right text-slate-500">${parseInt(mat.precio_costo).toLocaleString()}</td>}
                              {rolUsuario === 'ADMIN' && <td className="px-6 py-4 text-right font-bold text-slate-700">${(mat.stock_actual * mat.precio_costo).toLocaleString()}</td>}
                              <td className="px-6 py-4 text-center flex items-center justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => abrirEdicion(mat)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Editar"><IconoEdit /></button>
                                <button onClick={() => eliminarProducto(mat.id, mat.nombre)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-full transition-colors" title="Eliminar"><IconoTrash /></button>
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
            <>
              {!obraSeleccionada ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full content-start">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 h-fit overflow-hidden sticky top-24">
                    <div className="bg-slate-800 px-8 py-6 border-b border-slate-700"><h3 className="font-bold text-white text-lg uppercase flex items-center gap-2 tracking-wide"><IconoBriefcase/> Gestión de Proyectos</h3><p className="text-xs text-slate-400 mt-1">Crea centros de costos para asignar materiales.</p></div>
                    <form onSubmit={guardarObra} className="p-8 space-y-5">
                      <div><label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wide">Nombre del Proyecto</label><input required value={formObra.nombre} onChange={e=>setFormObra({...formObra, nombre: e.target.value})} type="text" className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ej: Edificio Centro" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wide">Cliente / Encargado</label><input required value={formObra.cliente} onChange={e=>setFormObra({...formObra, cliente: e.target.value})} type="text" className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ej: Constructora XYZ" /></div>
                      {rolUsuario === 'ADMIN' && (<div><label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wide">Presupuesto ($)</label><input value={formObra.presupuesto} onChange={e=>setFormObra({...formObra, presupuesto: e.target.value})} type="number" className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" /></div>)}
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]">CREAR NUEVO PROYECTO</button>
                    </form>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
                     {obrasReales.map(o => (
                       <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-xl transition-all hover:-translate-y-1">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-600 rounded-l-2xl"></div>
                          <div className="flex justify-between items-start mb-4 pl-3">
                            <div className="flex items-center gap-4">
                               <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shadow-sm"><IconoBuilding /></div>
                               <div><h3 className="font-bold text-slate-800 text-lg leading-tight">{o.nombre}</h3><p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wide">{o.cliente}</p></div>
                            </div>
                            <button onClick={() => eliminarObra(o.id, o.nombre)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-full"><IconoTrash /></button>
                          </div>
                          <div className="space-y-4 pl-3">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Estado</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">● En Ejecución</span></div>
                            {rolUsuario === 'ADMIN' && (<div className="flex justify-between items-center px-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Presupuesto</span><span className="text-sm font-bold text-slate-700">${parseInt(o.presupuesto).toLocaleString()}</span></div>)}
                            <div className="flex justify-between items-center px-1 border-t border-slate-100 pt-3"><span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2"><IconoBox/> Materiales</span><span className="text-lg font-bold text-slate-800">{calcularMaterialesEnObra(o.id)} <span className="text-xs text-slate-400 font-normal">unid.</span></span></div>
                            
                            <button onClick={() => setObraSeleccionada(o)} className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
                                VER MATERIALES EN OBRA
                            </button>
                          </div>
                       </div>
                     ))}
                     {obrasReales.length === 0 && (
                        <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 italic">No hay proyectos activos. ¡Crea uno nuevo!</div>
                     )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 h-full flex flex-col animate-fade-in">
                    <div className="bg-slate-50/80 backdrop-blur px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <button onClick={() => setObraSeleccionada(null)} className="bg-white border border-slate-300 p-3 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-500 transition-all shadow-sm">
                                ⬅
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><IconoBuilding/> {obraSeleccionada.nombre}</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{obraSeleccionada.cliente}</p>
                            </div>
                        </div>
                        <div className="text-right bg-white px-6 py-3 rounded-xl border border-slate-100 shadow-sm">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items Recibidos</p>
                             <p className="text-3xl font-extrabold text-orange-600 mt-1">{calcularMaterialesEnObra(obraSeleccionada.id)} <span className="text-sm text-slate-400 font-medium">unid.</span></p>
                        </div>
                    </div>
                    <div className="overflow-auto flex-1 p-8">
                        <h3 className="font-bold text-slate-600 mb-6 text-sm uppercase border-b border-slate-200 pb-3 tracking-wide">Lista de Materiales Entregados</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-lg">Fecha Entrega</th>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4 text-center">Cantidad</th>
                                    <th className="px-6 py-4 rounded-r-lg">Quién Recibió</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historial
                                    .filter(h => h.id_obra === obraSeleccionada.id && h.tipo === 'SALIDA')
                                    .map((mov, i) => (
                                    <tr key={i} className="hover:bg-orange-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{new Date(mov.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{mov.nombre} <span className="font-normal text-slate-400 block text-xs mt-0.5">{mov.sku}</span></td>
                                        <td className="px-6 py-4 text-center font-bold text-lg text-slate-800 bg-slate-50/50 rounded-lg mx-2">{mov.cantidad}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wide">{mov.recibido_por || 'Sin registro'}</td>
                                    </tr>
                                ))}
                                {historial.filter(h => h.id_obra === obraSeleccionada.id && h.tipo === 'SALIDA').length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-16 text-slate-400 italic">No se han enviado materiales a esta obra aún.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </>
          )}

          {menuActivo === 'Historial' && (
             <div className="bg-white rounded-2xl shadow-xl border border-slate-100 h-full flex flex-col overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-purple-500 pl-3">Bitácora de Movimientos</h3>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                    <button onClick={() => window.open(`${API_URL}/reporte-historial-pdf?busqueda=${busquedaHistorial}&tipo=${filtroTipoHistorial}`, '_blank')} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2 shadow-md transition-all">📄 PDF</button>
                    <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm"><button onClick={()=>setFiltroTipoHistorial('TODOS')} className={`px-4 py-2 text-xs font-bold transition-colors ${filtroTipoHistorial==='TODOS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Todos</button><button onClick={()=>setFiltroTipoHistorial('ENTRADA')} className={`px-4 py-2 text-xs font-bold transition-colors ${filtroTipoHistorial==='ENTRADA' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Entradas</button><button onClick={()=>setFiltroTipoHistorial('SALIDA')} className={`px-4 py-2 text-xs font-bold transition-colors ${filtroTipoHistorial==='SALIDA' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Salidas</button></div>
                    <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-400 transition-all"><IconoFilter className="text-slate-400 w-3 h-3"/><input type="text" placeholder="Buscar en historial..." value={busquedaHistorial} onChange={e=>setBusquedaHistorial(e.target.value)} className="text-xs px-2 outline-none w-full md:w-48 bg-transparent" /></div>
                  </div>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm text-left min-w-[900px]">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Fecha Evento</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Cargado En</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Producto</th>
                            <th className="px-6 py-4 text-center font-bold tracking-wider">Tipo</th>
                            <th className="px-6 py-4 text-center font-bold tracking-wider">Cant.</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Proveedor</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Responsable</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Origen / Destino</th>
                            <th className="px-6 py-4 text-center font-bold tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historialFiltrado.map((mov, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-slate-700 font-bold text-xs whitespace-nowrap">{new Date(mov.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                          
                          <td className="px-6 py-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                             {mov.fecha_registro ? new Date(mov.fecha_registro).toLocaleString() : '-'}
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-700">{mov.nombre} <span className="block text-xs text-slate-400 font-normal mt-0.5">{mov.sku}</span></td>
                          <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${mov.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{mov.tipo}</span></td>
                          <td className="px-6 py-4 text-center font-extrabold text-slate-700 text-lg">{mov.cantidad}</td>
                          
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">{mov.proveedor || '-'}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{mov.recibido_por || '-'}</td>

                          <td className="px-6 py-4 text-xs text-slate-600">{mov.tipo === 'SALIDA' ? (<span className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit"><IconoBuilding className="w-3 h-3"/> {mov.nombre_obra || 'Obra Desconocida'}</span>) : (<span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-fit">🏢 Bodega Central</span>)}</td>
                          <td className="px-6 py-4 text-center"><button onClick={() => eliminarMovimiento(mov.id)} className="text-slate-300 hover:text-rose-600 transition p-2 rounded-full hover:bg-rose-50 group-hover:text-slate-400"><IconoTrash /></button></td>
                        </tr>
                      ))}
                      {historialFiltrado.length === 0 && (<tr><td colSpan="9" className="text-center py-20 text-slate-400 italic">No se encontraron movimientos que coincidan con la búsqueda.</td></tr>)}
                    </tbody>
                  </table>
                </div>
             </div>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App