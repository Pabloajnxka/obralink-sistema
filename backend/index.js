const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const PDFDocument = require('pdfkit'); // Importamos PDFKit al inicio

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. CONFIGURACIÓN DE BASE DE DATOS (CLOUD READY ☁️)
// ==========================================
const pool = new Pool({
  // Si existe la variable de entorno (Nube), usa esa URL. 
  // Si no (Local), usa tus credenciales locales (puedes dejarlas fijas o configurar variables locales).
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:portega321@localhost:5432/inventario_db',
  
  // Lógica SSL: Obligatorio para Render, falso para Localhost
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// PRUEBA DE CONEXIÓN
pool.connect((err) => {
  if (err) {
    console.error('❌ Error de conexión:', err.stack);
  } else {
    console.log('✅ ¡Conectado a la Base de Datos exitosamente!');
  }
});

// ==========================================
// 2. RUTAS DEL SISTEMA
// ==========================================

// --- PRODUCTOS ---

// Obtener todos
app.get('/productos', async (req, res) => {
  try {
    const todosLosProductos = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(todosLosProductos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// Crear producto
app.post('/productos', async (req, res) => {
  try {
    const { nombre, sku, precio_costo, precio_venta, stock_actual, categoria } = req.body;
    
    const nuevoProducto = await pool.query(
      "INSERT INTO productos (nombre, sku, precio_costo, precio_venta, stock_actual, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [nombre, sku, precio_costo, precio_venta, stock_actual, categoria]
    );

    res.json(nuevoProducto.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al guardar producto');
  }
});

// Eliminar producto (Cascada manual)
app.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM movimientos WHERE id_producto = $1', [id]);
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar producto');
  }
});

// --- MOVIMIENTOS Y STOCK ---

// Registrar movimiento (Entrada/Salida)
app.post('/movimientos', async (req, res) => {
  const { id_producto, tipo, cantidad, id_obra } = req.body; 
  
  try {
    // 1. Guardar movimiento
    await pool.query(
      "INSERT INTO movimientos (id_producto, tipo, cantidad, id_obra) VALUES ($1, $2, $3, $4)",
      [id_producto, tipo, cantidad, id_obra]
    );

    // 2. Actualizar Stock
    const operacion = tipo === 'ENTRADA' ? '+' : '-';
    await pool.query(
      `UPDATE productos SET stock_actual = stock_actual ${operacion} $1 WHERE id = $2`,
      [cantidad, id_producto]
    );

    res.json({ mensaje: "Stock actualizado correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al actualizar stock');
  }
});

// Ver historial completo
app.get('/movimientos', async (req, res) => {
  try {
    const query = `
      SELECT m.id, m.tipo, m.cantidad, m.fecha, p.nombre, p.sku, o.nombre as nombre_obra
      FROM movimientos m
      JOIN productos p ON m.id_producto = p.id
      LEFT JOIN obras o ON m.id_obra = o.id
      ORDER BY m.fecha DESC
    `;
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener historial');
  }
});

// Eliminar movimiento
app.delete('/movimientos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM movimientos WHERE id = $1', [id]);
    res.json({ mensaje: "Registro de historial eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar movimiento');
  }
});

// --- OBRAS ---

// Obtener obras
app.get('/obras', async (req, res) => {
  const obras = await pool.query('SELECT * FROM obras ORDER BY id ASC');
  res.json(obras.rows);
});

// Crear obra
app.post('/obras', async (req, res) => {
  const { nombre, cliente, presupuesto } = req.body;
  await pool.query("INSERT INTO obras (nombre, cliente, presupuesto) VALUES ($1, $2, $3)", [nombre, cliente, presupuesto]);
  res.json({ mensaje: "Obra creada" });
});

// Eliminar obra (Protegida)
app.delete('/obras/:id', async (req, res) => {
  const { id } = req.params;

  if (id == 1) { 
    return res.status(403).json({ message: "⛔ Error Crítico: No puedes eliminar la Bodega Central." });
  }

  try {
    await pool.query('DELETE FROM movimientos WHERE id_obra = $1', [id]);
    await pool.query('DELETE FROM obras WHERE id = $1', [id]);
    res.json({ mensaje: "Obra eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar obra');
  }
});

// --- AUTENTICACIÓN ---

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND password = $2', 
      [email, password]
    );

    if (resultado.rows.length > 0) {
      const usuario = resultado.rows[0];
      res.json({ success: true, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
    } else {
      res.status(401).json({ success: false, mensaje: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
});

// ==========================================
// 3. GENERACIÓN DE REPORTES PDF
// ==========================================
app.get('/reporte-pdf', async (req, res) => {
  try {
    const { busqueda, categoria } = req.query; 
    
    let queryText = 'SELECT * FROM productos';
    const queryParams = [];
    const conditions = [];

    if (busqueda) {
      conditions.push(`(nombre ILIKE $${queryParams.length + 1} OR sku ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${busqueda}%`);
    }
    if (categoria && categoria !== '') {
      conditions.push(`categoria = $${queryParams.length + 1}`);
      queryParams.push(categoria);
    }
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    queryText += ' ORDER BY categoria ASC, nombre ASC';

    const productos = await pool.query(queryText, queryParams);

    // Configuración PDF
    const doc = new PDFDocument({ margin: 40, margins: { top: 40, bottom: 30, left: 40, right: 40 }, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario_ejecutivo.pdf');
    doc.pipe(res);

    const colorPrincipal = '#2563eb'; 
    const colorSecundario = '#64748b';
    const colorFondoTabla = '#f8fafc';

    // Cabecera
    doc.rect(0, 0, 600, 85).fill(colorPrincipal);
    doc.fontSize(24).fillColor('white').text('ObraLink', 40, 25);
    doc.fontSize(10).text('SISTEMA DE CONTROL INTELIGENTE', 40, 52, { characterSpacing: 2 });

    doc.roundedRect(420, 20, 140, 45, 4).fill('white');
    doc.fillColor('black').fontSize(9).font('Helvetica-Bold').text('REPORTE', 430, 30);
    doc.font('Helvetica').fontSize(8).text(new Date().toLocaleDateString('es-CL'), 430, 45);
    doc.text(new Date().toLocaleTimeString('es-CL'), 510, 45);

    doc.moveDown(3.5);

    // Tabla
    let y = 100;
    const colProd = 40; const colCat = 220; const colStock = 320; const colCosto = 380; const colTotal = 460;

    const dibujarEncabezados = () => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(colorPrincipal);
        doc.text('PRODUCTO / SKU', colProd, y);
        doc.text('CATEGORÍA', colCat, y);
        doc.text('STOCK', colStock, y, { width: 50, align: 'center' });
        doc.text('COSTO UNIT.', colCosto, y, { width: 70, align: 'right' });
        doc.text('VALOR TOTAL', colTotal, y, { width: 70, align: 'right' });
        doc.moveTo(colProd, y + 12).lineTo(550, y + 12).lineWidth(1).stroke(colorPrincipal);
        y += 22;
    };

    dibujarEncabezados();

    let totalItems = 0;
    let valorTotalBodega = 0;

    doc.font('Helvetica').fontSize(9);

    productos.rows.forEach((prod, index) => {
        if (y > 720) { 
            doc.addPage(); 
            y = 50; 
            dibujarEncabezados(); 
            doc.font('Helvetica').fontSize(9); 
        }
        
        if (index % 2 === 0) { doc.rect(30, y - 4, 540, 22).fill(colorFondoTabla); }

        const valorItem = prod.stock_actual * prod.precio_costo;
        totalItems += parseInt(prod.stock_actual);
        valorTotalBodega += valorItem;

        doc.fillColor('black');
        doc.font('Helvetica-Bold').text(prod.nombre, colProd, y, { width: 170, ellipsis: true });
        doc.font('Helvetica').fontSize(7).fillColor(colorSecundario).text(prod.sku, colProd, y + 10);
        
        doc.fontSize(8).fillColor('black').text(prod.categoria || 'General', colCat, y + 4);
        
        if (prod.stock_actual < 10) doc.fillColor('#dc2626').font('Helvetica-Bold');
        else doc.fillColor('black').font('Helvetica');
        
        doc.text(prod.stock_actual, colStock, y + 4, { width: 50, align: 'center' });

        doc.fillColor('black').font('Helvetica');
        doc.text('$' + parseInt(prod.precio_costo).toLocaleString('es-CL'), colCosto, y + 4, { width: 70, align: 'right' });
        doc.font('Helvetica-Bold').text('$' + valorItem.toLocaleString('es-CL'), colTotal, y + 4, { width: 70, align: 'right' });

        y += 22;
    });

    // Resumen y Firmas
    if (y > 650) { doc.addPage(); y = 50; }
    else { y += 10; }

    doc.rect(340, y, 210, 60).fill('#f1f5f9').stroke('#cbd5e1');
    doc.fillColor(colorPrincipal).font('Helvetica-Bold').fontSize(10).text('RESUMEN EJECUTIVO', 350, y + 10);
    
    doc.fillColor('black').fontSize(9).font('Helvetica');
    doc.text('Total Unidades:', 350, y + 30);
    doc.text(totalItems.toLocaleString('es-CL'), 500, y + 30, { align: 'right', width: 40 });
    
    doc.font('Helvetica-Bold').text('Valorización Total:', 350, y + 45);
    doc.fillColor('#16a34a').text('$' + valorTotalBodega.toLocaleString('es-CL'), 460, y + 45, { align: 'right', width: 80 });

    const bottomY = doc.page.height - 70;
    
    doc.moveTo(50, bottomY).lineTo(200, bottomY).stroke('black');
    doc.fontSize(8).fillColor('#64748b').text('Firma Jefe de Bodega', 50, bottomY + 5, { width: 150, align: 'center' });

    doc.moveTo(350, bottomY).lineTo(500, bottomY).stroke('black');
    doc.text('Firma Administrador', 350, bottomY + 5, { width: 150, align: 'center' });

    doc.text('Página 1 de 1', 0, bottomY + 20, { align: 'center', width: 600 });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al generar PDF');
  }
});

// 10. EDITAR PRODUCTO (PUT)
app.put('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, precio_costo } = req.body;
  
  try {
    await pool.query(
      'UPDATE productos SET nombre = $1, categoria = $2, precio_costo = $3 WHERE id = $4',
      [nombre, categoria, precio_costo, id]
    );
    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar producto');
  }
});

// ==========================================
// 4. INICIO DEL SERVIDOR
// ==========================================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});
