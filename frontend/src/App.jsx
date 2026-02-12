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

  // --- FILTRO DE OBRAS REALES (Excluye Bodega Central) ---
  const obrasReales = obras.filter(o => o.nombre !== 'Bodega Central');

  const kpiTotalValor = materiales.reduce((acc, m) => acc + (m.stock_actual * m.precio_costo), 0)
  const kpiTotalItems = materiales.length
  const kpiStockCritico = materiales.filter(m => m.stock_actual < 5).length
  // Modificado: Ahora cuenta solo las obras reales
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
      
      // Si la obra seleccionada por defecto es Bodega Central, intentamos cambiarla
      if (dObras.length > 0) {
         // Filtramos para que no autoseleccione Bodega Central
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
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="relative z-10"><h1 className="text-white text-4xl font-bold flex items-center gap-3"><span className="text-blue-500">●</span> ObraLink</h1></div>
          <div className="relative z-10"><blockquote className="text-2xl text-slate-300 font-medium leading-relaxed">"El éxito de una obra comienza con un inventario ordenado."</blockquote><p className="mt-6 text-slate-500 text-sm tracking-widest uppercase">Sistema de Gestión Integral v3.0</p></div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-none lg:shadow-none sm:shadow-xl">
            <div className="text-center mb-10"><h2 className="text-3xl font-bold text-slate-800">Bienvenido</h2></div>
            <form onSubmit={manejarLogin} className="space-y-6">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Correo</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><IconoMail /></div><input type="email" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg" value={loginData.email} onChange={e=>setLoginData({...loginData, email:e.target.value})} /></div></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><IconoLock /></div><input type="password" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg" value={loginData.password} onChange={e=>setLoginData({...loginData, password:e.target.value})} /></div></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="recordar" checked={recordarSesion} onChange={(e) => setRecordarSesion(e.target.checked)}/><label htmlFor="recordar" className="text-sm text-slate-600 cursor-pointer">Mantener sesión iniciada</label></div>
              {errorLogin && (<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex justify-center"><span>⚠️</span> {errorLogin}</div>)}
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg">INGRESAR AL SISTEMA</button>
            </form>
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
          <datalist id="lista-categorias">{categoriasUnicas.map((cat, i) => <option key={i} value={cat} />)}</datalist>
          <datalist id="lista-proveedores">{proveedoresUnicos.map((prov, i) => <option key={i} value={prov} />)}</datalist>

          {menuActivo === 'Inicio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-blue-600 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Almacén')}><div><h3 className="text-3xl font-bold">${kpiTotalValor.toLocaleString('es-CL')}</h3><p className="text-blue-100 text-xs font-bold uppercase mt-1">Inversión Stock</p></div></div>
                <div className="bg-red-500 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Almacén')}><div><h3 className="text-3xl font-bold">{kpiStockCritico}</h3><p className="text-red-100 text-xs font-bold uppercase mt-1">Stock Crítico (!)</p></div></div>
                {/* MODIFICADO: Muestra kpiObrasActivas sin bodega central */}
                <div className="bg-orange-500 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Obras')}><div><h3 className="text-3xl font-bold">{kpiObrasActivas}</h3><p className="text-orange-100 text-xs font-bold uppercase mt-1">Obras Activas</p></div></div>
                <div className="bg-green-600 text-white p-4 rounded shadow-lg h-32 flex flex-col justify-between cursor-pointer hover:scale-105 transition" onClick={()=>cambiarMenu('Ingresos')}><div><h3 className="text-3xl font-bold">{kpiTotalItems}</h3><p className="text-green-100 text-xs font-bold uppercase mt-1">Total Ítems</p></div></div>
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-sm uppercase mb-3 flex items-center gap-2">Accesos Rápidos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button onClick={()=>cambiarMenu('Ingresos')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-green-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-green-100 text-green-600 p-3 rounded-full group-hover:bg-green-600 group-hover:text-white transition"><IconoIn /></div><span className="text-xs font-bold text-slate-600">Ingresos</span></button>
                    <button onClick={()=>cambiarMenu('Salidas')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-red-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-red-100 text-red-600 p-3 rounded-full group-hover:bg-red-600 group-hover:text-white transition"><IconoOut /></div><span className="text-xs font-bold text-slate-600">Salidas</span></button>
                    <button onClick={()=>cambiarMenu('Almacén')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-blue-100 text-blue-600 p-3 rounded-full group-hover:bg-blue-600 group-hover:text-white transition"><IconoBox /></div><span className="text-xs font-bold text-slate-600">Inventario</span></button>
                    <button onClick={()=>cambiarMenu('Obras')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-orange-100 text-orange-600 p-3 rounded-full group-hover:bg-orange-600 group-hover:text-white transition"><IconoBuilding /></div><span className="text-xs font-bold text-slate-600">Obras</span></button>
                    <button onClick={()=>cambiarMenu('Historial')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"><div className="bg-purple-100 text-purple-600 p-3 rounded-full group-hover:bg-purple-600 group-hover:text-white transition"><IconoHistory /></div><span className="text-xs font-bold text-slate-600">Historial</span></button>
                </div>
              </div>
            </div>
          )}

          {menuActivo === 'Ingresos' && (
             <div className="max-w-2xl mx-auto bg-white rounded shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                   <div><h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><IconoIn/> Registrar Ingreso</h2><p className="text-green-100 text-sm">Entrada de mercadería a Bodega</p></div>
                   <div className="flex bg-green-700 rounded-lg p-1 gap-1">
                      <button onClick={()=>setTabIngreso('MANUAL')} className={`px-3 py-1 rounded text-xs font-bold transition ${tabIngreso==='MANUAL' ? 'bg-white text-green-700' : 'text-green-200 hover:text-white'}`}>Manual</button>
                      <button onClick={()=>setTabIngreso('FACTURA')} className={`px-3 py-1 rounded text-xs font-bold transition ${tabIngreso==='FACTURA' ? 'bg-white text-green-700' : 'text-green-200 hover:text-white'}`}>Subir Factura</button>
                   </div>
                </div>

                {tabIngreso === 'MANUAL' ? (
                  <form onSubmit={registrarIngresoCompleto} className="p-6 md:p-8 space-y-4">
                     <div className="flex items-center gap-2 mb-4 bg-slate-100 p-3 rounded">
                        <input type="checkbox" id="esNuevo" className="w-5 h-5 accent-green-600" checked={ingresoManual.esNuevo} onChange={(e) => setIngresoManual({...ingresoManual, esNuevo: e.target.checked})} />
                        <label htmlFor="esNuevo" className="font-bold text-slate-700 cursor-pointer">¿Es un Producto Nuevo?</label>
                     </div>
                     {ingresoManual.esNuevo ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500">Nombre del Producto *</label><input required className="w-full border p-2 rounded" type="text" placeholder="Ej: Martillo" value={ingresoManual.nombre_nuevo} onChange={e=>setIngresoManual({...ingresoManual, nombre_nuevo: e.target.value})} /></div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Categoría</label>
                                <input className="w-full border p-2 rounded" type="text" placeholder="Ej: Herramientas" list="lista-categorias" value={ingresoManual.categoria} onChange={e=>setIngresoManual({...ingresoManual, categoria: e.target.value})} />
                            </div>
                        </div>
                     ) : (
                        <div>
                            <label className="text-xs font-bold text-slate-500">Seleccionar Producto Existente *</label>
                            <select required className="w-full border p-2 rounded bg-white" value={ingresoManual.id_producto} onChange={(e) => setIngresoManual({...ingresoManual, id_producto: e.target.value})}>
                                <option value="">-- Buscar en catálogo --</option>
                                {materiales.map(m => (<option key={m.id} value={m.id}>{m.nombre} (SKU: {m.sku})</option>))}
                            </select>
                        </div>
                     )}
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500">Fecha Real del Ingreso *</label><input required className="w-full border p-2 rounded" type="date" value={ingresoManual.fecha} onChange={e=>setIngresoManual({...ingresoManual, fecha: e.target.value})} /></div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Empresa / Proveedor</label>
                            <input className="w-full border p-2 rounded" type="text" placeholder="Ej: Sodimac" list="lista-proveedores" value={ingresoManual.proveedor} onChange={e=>setIngresoManual({...ingresoManual, proveedor: e.target.value})} />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500">Cantidad *</label><input required className="w-full border p-2 rounded font-bold text-lg" type="number" min="1" placeholder="0" value={ingresoManual.cantidad} onChange={e=>setIngresoManual({...ingresoManual, cantidad: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500">Precio Unitario ($) *</label><input required className="w-full border p-2 rounded font-bold text-lg" type="number" min="0" placeholder="0" value={ingresoManual.precio_unitario} onChange={e=>setIngresoManual({...ingresoManual, precio_unitario: e.target.value})} /></div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Recibido Por (En Bodega)</label>
                        <input className="w-full border p-2 rounded" type="text" placeholder="Nombre del responsable" value={ingresoManual.recibido_por} onChange={e=>setIngresoManual({...ingresoManual, recibido_por: e.target.value})} />
                     </div>
                     <div className="bg-slate-50 p-4 rounded text-right border border-slate-200">
                        <span className="text-sm text-slate-500 font-bold block">PRECIO TOTAL ESTIMADO</span>
                        <span className="text-2xl font-bold text-slate-800">${((ingresoManual.cantidad || 0) * (ingresoManual.precio_unitario || 0)).toLocaleString('es-CL')}</span>
                     </div>
                     <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded text-lg transition shadow-lg">CONFIRMAR INGRESO</button>
                  </form>
                ) : (
                  <div className="p-6 md:p-8 space-y-6">
                     <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-slate-400 gap-3 hover:border-green-500 hover:bg-green-50 transition cursor-pointer relative">
                        <IconoUpload />
                        <span className="text-sm font-bold">Haz clic o arrastra tu Factura (PDF/Imagen)</span>
                        <input type="file" onChange={procesarFactura} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,image/*" />
                     </div>
                     {cargandoFactura && <p className="text-center text-slate-500 animate-pulse">Analizando documento con IA...</p>}
                     {productosFactura.length > 0 && (
                        <div className="bg-slate-50 rounded border border-slate-200 p-4">
                           <h4 className="font-bold text-slate-700 text-sm mb-3">Productos Detectados ({productosFactura.length})</h4>
                           <div className="space-y-2 max-h-40 overflow-y-auto">
                              {productosFactura.map((p, i) => (
                                 <div key={i} className="flex justify-between text-xs border-b border-slate-200 pb-1"><span>{p.nombre}</span><span className="font-bold">{p.cantidad} unid.</span></div>
                              ))}
                           </div>
                           <button onClick={ingresarProductosFactura} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded shadow">INGRESAR TODO</button>
                        </div>
                     )}
                  </div>
                )}
             </div>
          )}

          {menuActivo === 'Salidas' && (
             <div className="max-w-2xl mx-auto bg-white rounded shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-red-600 p-6 text-white"><h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><IconoOut/> Registrar Salida</h2><p className="text-red-100 text-sm">Despacho de materiales hacia Obra</p></div>
                <form onSubmit={(e) => registrarMovimiento(e, 'SALIDA')} className="p-6 md:p-8 space-y-6">
                   {/* MODIFICADO: Filtramos obrasReales para que no aparezca Bodega Central */}
                   <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Destino (Obra)</label>
                        <select required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500" value={movimientoData.id_obra} onChange={(e) => setMovimientoData({...movimientoData, id_obra: e.target.value})}>
                            <option value="">-- Seleccionar Obra --</option>
                            {obrasReales.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                        </select>
                   </div>
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Seleccionar Producto</label><select required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500" onChange={(e) => setMovimientoData({...movimientoData, id_producto: e.target.value})}><option value="">-- Buscar en catálogo --</option>{materiales.map(m => (<option key={m.id} value={m.id}>{m.nombre} (Disp: {m.stock_actual})</option>))}</select></div>
                   <div><label className="block text-sm font-bold text-slate-600 mb-2">Cantidad a Despachar</label><input type="number" required min="1" className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500 text-lg font-bold" value={movimientoData.cantidad} onChange={(e) => setMovimientoData({...movimientoData, cantidad: e.target.value})} /></div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-slate-600 mb-2">Fecha del Despacho</label><input type="date" required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500" value={movimientoData.fecha} onChange={(e) => setMovimientoData({...movimientoData, fecha: e.target.value})} /></div>
                      <div><label className="block text-sm font-bold text-slate-600 mb-2">Responsable / Quién Retira</label><input type="text" required className="w-full border p-3 rounded bg-slate-50 outline-none focus:border-red-500" placeholder="Nombre..." value={movimientoData.recibido_por} onChange={(e) => setMovimientoData({...movimientoData, recibido_por: e.target.value})} /></div>
                   </div>

                   <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded text-lg transition shadow-lg">CONFIRMAR SALIDA</button>
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
                
                <div className="bg-white rounded shadow-sm border border-slate-200 h-fit relative">
                    {mostrarModalEdicion && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-y-auto max-h-[90vh]">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><IconoEdit/> Editar Producto</h3>
                                <form onSubmit={guardarEdicion} className="space-y-4">
                                    <div><label className="text-xs font-bold text-slate-500">Nombre del Producto</label><input className="w-full border p-2 rounded" value={formulario.nombre} onChange={manejarInput} name="nombre" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500">SKU</label><input className="w-full border p-2 rounded bg-slate-50" value={formulario.sku} onChange={manejarInput} name="sku" /></div>
                                        <div><label className="text-xs font-bold text-slate-500">Categoría</label><input className="w-full border p-2 rounded" value={formulario.categoria} onChange={manejarInput} name="categoria" list="lista-categorias" /></div>
                                    </div>
                                    {rolUsuario === 'ADMIN' && (
                                       <div className="bg-blue-50 p-3 rounded border border-blue-100"><label className="text-xs font-bold text-blue-600 block mb-1">Precio Costo Unitario ($)</label><input className="w-full border border-blue-200 p-2 rounded font-bold text-lg" type="number" value={formulario.precio_costo} onChange={manejarInput} name="precio_costo" /></div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                        <div><label className="text-xs font-bold text-slate-500">Proveedor (Último)</label><input className="w-full border p-2 rounded" placeholder="Ej: Sodimac" value={formulario.proveedor} onChange={manejarInput} name="proveedor" list="lista-proveedores" /></div>
                                        <div><label className="text-xs font-bold text-slate-500">Recibido Por</label><input className="w-full border p-2 rounded" placeholder="Nombre" value={formulario.recibido_por} onChange={manejarInput} name="recibido_por" /></div>
                                    </div>
                                    <div className="flex gap-2 mt-6">
                                        <button type="button" onClick={() => setMostrarModalEdicion(false)} className="w-1/2 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded font-bold transition">Cancelar</button>
                                        <button className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold shadow transition">Guardar Cambios</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

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
                                <button onClick={() => abrirEdicion(mat)} className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-blue-50" title="Editar"><IconoEdit /></button>
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
            <>
              {/* VISTA 1: LISTADO DE OBRAS (Ahora FILTRADO sin Bodega Central) */}
              {!obraSeleccionada ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full content-start">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 border-b border-slate-700"><h3 className="font-bold text-white text-lg uppercase flex items-center gap-2"><IconoBriefcase/> Gestión de Proyectos</h3><p className="text-xs text-slate-400 mt-1">Crea centros de costos para asignar materiales.</p></div>
                    <form onSubmit={guardarObra} className="p-6 space-y-4">
                      <div><label className="text-xs font-bold text-slate-500 block mb-1">Nombre del Proyecto</label><input required value={formObra.nombre} onChange={e=>setFormObra({...formObra, nombre: e.target.value})} type="text" className="w-full border border-slate-300 p-3 rounded bg-slate-50 focus:bg-white transition" placeholder="Ej: Edificio Centro" /></div>
                      <div><label className="text-xs font-bold text-slate-500 block mb-1">Cliente / Encargado</label><input required value={formObra.cliente} onChange={e=>setFormObra({...formObra, cliente: e.target.value})} type="text" className="w-full border border-slate-300 p-3 rounded bg-slate-50 focus:bg-white transition" placeholder="Ej: Constructora XYZ" /></div>
                      {rolUsuario === 'ADMIN' && (<div><label className="text-xs font-bold text-slate-500 block mb-1">Presupuesto ($)</label><input value={formObra.presupuesto} onChange={e=>setFormObra({...formObra, presupuesto: e.target.value})} type="number" className="w-full border border-slate-300 p-3 rounded bg-slate-50 focus:bg-white transition" /></div>)}
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded shadow-md transition active:scale-95">CREAR NUEVO PROYECTO</button>
                    </form>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                     {/* MODIFICADO: Iteramos sobre obrasReales para NO mostrar Bodega Central */}
                     {obrasReales.map(o => (
                       <div key={o.id} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group hover:shadow-md transition border-l-4 border-l-orange-500`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                               <div className="p-3 rounded-lg bg-orange-100 text-orange-600"><IconoBuilding /></div>
                               <div><h3 className="font-bold text-slate-800 text-lg leading-tight">{o.nombre}</h3><p className="text-xs text-slate-500 font-medium uppercase mt-1">{o.cliente}</p></div>
                            </div>
                            <button onClick={() => eliminarObra(o.id, o.nombre)} className="text-slate-300 hover:text-red-500 transition"><IconoTrash /></button>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase">Estado</span><span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">● En Ejecución</span></div>
                            {rolUsuario === 'ADMIN' && (<div className="flex justify-between items-center px-1"><span className="text-xs font-bold text-slate-400 uppercase">Presupuesto</span><span className="text-sm font-bold text-slate-700">${parseInt(o.presupuesto).toLocaleString()}</span></div>)}
                            <div className="flex justify-between items-center px-1 border-t border-slate-100 pt-2 mt-2"><span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><IconoBox/> Materiales Recibidos</span><span className="text-lg font-bold text-slate-800">{calcularMaterialesEnObra(o.id)} <span className="text-xs text-slate-400 font-normal">unid.</span></span></div>
                            
                            <button onClick={() => setObraSeleccionada(o)} className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded transition">
                                VER MATERIALES EN OBRA
                            </button>
                          </div>
                       </div>
                     ))}
                     {obrasReales.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400 italic">No hay proyectos activos. ¡Crea uno nuevo!</div>
                     )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded shadow-sm border border-slate-200 h-full flex flex-col">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setObraSeleccionada(null)} className="bg-white border border-slate-300 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
                                ⬅
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><IconoBuilding/> {obraSeleccionada.nombre}</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase">{obraSeleccionada.cliente}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold text-slate-400 uppercase">Total Items Recibidos</p>
                             <p className="text-2xl font-bold text-orange-600">{calcularMaterialesEnObra(obraSeleccionada.id)} <span className="text-sm text-slate-400">unid.</span></p>
                        </div>
                    </div>
                    <div className="overflow-auto flex-1 p-6">
                        <h3 className="font-bold text-slate-600 mb-4 text-sm uppercase border-b pb-2">Lista de Materiales Entregados</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3">Fecha Entrega</th>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-center">Cantidad</th>
                                    <th className="px-4 py-3">Quién Recibió</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historial
                                    .filter(h => h.id_obra === obraSeleccionada.id && h.tipo === 'SALIDA')
                                    .map((mov, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{new Date(mov.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{mov.nombre} <span className="font-normal text-slate-400 block text-xs">{mov.sku}</span></td>
                                        <td className="px-4 py-3 text-center font-bold text-lg text-slate-800">{mov.cantidad}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{mov.recibido_por || 'Sin registro'}</td>
                                    </tr>
                                ))}
                                {historial.filter(h => h.id_obra === obraSeleccionada.id && h.tipo === 'SALIDA').length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-8 text-slate-400 italic">No se han enviado materiales a esta obra aún.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </>
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
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Fecha Evento</th>
                            <th className="px-4 py-3">Cargado En</th>
                            <th className="px-4 py-3">Producto</th>
                            <th className="px-4 py-3 text-center">Tipo</th>
                            <th className="px-4 py-3 text-center">Cantidad</th>
                            <th className="px-4 py-3">Proveedor</th>
                            <th className="px-4 py-3">Responsable</th>
                            <th className="px-4 py-3">Origen / Destino</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historialFiltrado.map((mov, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-slate-700 font-bold text-xs whitespace-nowrap">{new Date(mov.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                          
                          <td className="px-4 py-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                             {mov.fecha_registro ? new Date(mov.fecha_registro).toLocaleString() : '-'}
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-700">{mov.nombre} <span className="block text-xs text-slate-400 font-normal">{mov.sku}</span></td>
                          <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{mov.tipo}</span></td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700 text-lg">{mov.cantidad}</td>
                          
                          <td className="px-4 py-3 text-xs text-slate-500">{mov.proveedor || '-'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{mov.recibido_por || '-'}</td>

                          <td className="px-4 py-3 text-xs text-slate-600">{mov.tipo === 'SALIDA' ? (<span className="flex items-center gap-1 font-bold text-orange-600"><IconoBuilding className="w-3 h-3"/> {mov.nombre_obra || 'Obra Desconocida'}</span>) : (<span className="flex items-center gap-1 text-slate-400">🏢 Bodega Central</span>)}</td>
                          <td className="px-4 py-3 text-center"><button onClick={() => eliminarMovimiento(mov.id)} className="text-slate-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"><IconoTrash /></button></td>
                        </tr>
                      ))}
                      {historialFiltrado.length === 0 && (<tr><td colSpan="9" className="text-center py-12 text-slate-400 italic">No se encontraron movimientos que coincidan con la búsqueda.</td></tr>)}
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