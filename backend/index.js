const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const PDFDocument = require('pdfkit'); 
const multer = require('multer');
const pdf = require('pdf-parse');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:portega321@localhost:5432/inventario_db',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ==========================================
// 🔧 AUTO-REPARACIÓN DE BASE DE DATOS
// ==========================================
const iniciarBaseDeDatos = async () => {
  try {
    const client = await pool.connect();
    console.log("🔧 Verificando estructura de la Base de Datos...");

    // Tablas base
    await client.query(`CREATE TABLE IF NOT EXISTS productos (id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, sku VARCHAR(100) UNIQUE NOT NULL, categoria VARCHAR(100), precio_costo INTEGER DEFAULT 0, precio_venta INTEGER DEFAULT 0, stock_actual INTEGER DEFAULT 0);`);
    await client.query(`CREATE TABLE IF NOT EXISTS obras (id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, cliente VARCHAR(255), presupuesto INTEGER DEFAULT 0);`);
    await client.query(`CREATE TABLE IF NOT EXISTS movimientos (id SERIAL PRIMARY KEY, id_producto INTEGER REFERENCES productos(id) ON DELETE CASCADE, tipo VARCHAR(50), cantidad INTEGER, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, id_obra INTEGER, nombre_obra VARCHAR(255));`);

    // Columnas extra (Migraciones)
    await client.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS ultimo_proveedor VARCHAR(255)");
    await client.query("ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS recibido_por VARCHAR(255)");
    await client.query("ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255)");
    
    // NUEVO: Columna para auditoría (Fecha real de carga vs Fecha del evento)
    await client.query("ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    console.log("✅ Base de datos lista y actualizada.");
    client.release();
  } catch (err) {
    console.error("❌ Error al iniciar base de datos:", err);
  }
};
iniciarBaseDeDatos();

// ==========================================
// 2. RUTAS DEL SISTEMA (PRODUCTOS, OBRAS)
// ==========================================

// --- PRODUCTOS ---
app.get('/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).send('Error al obtener productos'); }
});

app.post('/productos', async (req, res) => {
  try {
    const { nombre, sku, precio_costo, precio_venta, stock_actual, categoria } = req.body;
    const nuevoProducto = await pool.query(
      "INSERT INTO productos (nombre, sku, precio_costo, precio_venta, stock_actual, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [nombre, sku, precio_costo, precio_venta, stock_actual, categoria]
    );
    res.json(nuevoProducto.rows[0]);
  } catch (err) { res.status(500).send('Error al guardar producto'); }
});

app.put('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, precio_costo, proveedor } = req.body;
  try {
    await pool.query(
      'UPDATE productos SET nombre = $1, categoria = $2, precio_costo = $3, ultimo_proveedor = $4 WHERE id = $5',
      [nombre, categoria, precio_costo, proveedor, id]
    );
    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (err) { res.status(500).send('Error al actualizar producto'); }
});

app.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM movimientos WHERE id_producto = $1', [id]);
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) { res.status(500).send('Error al eliminar producto'); }
});

// --- MOVIMIENTOS Y STOCK (LÓGICA MEJORADA) ---

app.get('/movimientos', async (req, res) => {
  try {
    const query = `
      SELECT m.*, p.nombre, p.sku, o.nombre as nombre_obra
      FROM movimientos m
      JOIN productos p ON m.id_producto = p.id
      LEFT JOIN obras o ON m.id_obra = o.id
      ORDER BY m.fecha DESC, m.fecha_registro DESC
    `;
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (err) { res.status(500).send('Error al obtener historial'); }
});

// ... (código anterior igual)

// Registrar SALIDA (Con fecha manual y RESPONSABLE)
app.post('/movimientos', async (req, res) => {
  // AHORA RECIBIMOS 'recibido_por'
  const { id_producto, tipo, cantidad, id_obra, fecha, recibido_por } = req.body; 
  try {
    const fechaEvento = fecha || new Date();

    // INSERTAMOS EL NOMBRE DE QUIEN RETIRA EN 'recibido_por'
    await pool.query(
        "INSERT INTO movimientos (id_producto, tipo, cantidad, id_obra, fecha, fecha_registro, recibido_por) VALUES ($1, $2, $3, $4, $5, NOW(), $6)", 
        [id_producto, tipo, cantidad, id_obra, fechaEvento, recibido_por]
    );
    
    const operacion = tipo === 'ENTRADA' ? '+' : '-';
    await pool.query(`UPDATE productos SET stock_actual = stock_actual ${operacion} $1 WHERE id = $2`, [cantidad, id_producto]);
    res.json({ mensaje: "Stock actualizado correctamente" });
  } catch (err) { res.status(500).send('Error al actualizar stock'); }
});

// ... (resto del código igual)

// 🔄 ELIMINAR MOVIMIENTO (CON REVERSIÓN DE STOCK) - CRÍTICO
app.delete('/movimientos/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Transacción segura

    // 1. Obtener detalles
    const resMov = await client.query('SELECT * FROM movimientos WHERE id = $1', [id]);
    if (resMov.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }

    const movimiento = resMov.rows[0];
    const { id_producto, tipo, cantidad } = movimiento;

    // 2. Calcular reversión
    let ajusteStock = 0;
    if (tipo === 'ENTRADA') {
      ajusteStock = -cantidad; // Si entró, restamos
    } else if (tipo === 'SALIDA') {
      ajusteStock = cantidad;  // Si salió, devolvemos (sumamos)
    }

    // 3. Ajustar Stock
    if (id_producto) {
      await client.query(
        'UPDATE productos SET stock_actual = stock_actual + $1 WHERE id = $2',
        [ajusteStock, id_producto]
      );
    }

    // 4. Borrar registro
    await client.query('DELETE FROM movimientos WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ mensaje: "Registro eliminado y stock corregido exitosamente." });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error al anular movimiento:", err);
    res.status(500).send('Error al anular el movimiento');
  } finally {
    client.release();
  }
});

// --- OBRAS ---
app.get('/obras', async (req, res) => {
  const obras = await pool.query('SELECT * FROM obras ORDER BY id ASC');
  res.json(obras.rows);
});

app.post('/obras', async (req, res) => {
  const { nombre, cliente, presupuesto } = req.body;
  await pool.query("INSERT INTO obras (nombre, cliente, presupuesto) VALUES ($1, $2, $3)", [nombre, cliente, presupuesto]);
  res.json({ mensaje: "Obra creada" });
});

app.delete('/obras/:id', async (req, res) => {
  const { id } = req.params;
  if (id == 1) return res.status(403).json({ message: "⛔ Error Crítico: No puedes eliminar la Bodega Central." });
  try {
    await pool.query('DELETE FROM movimientos WHERE id_obra = $1', [id]);
    await pool.query('DELETE FROM obras WHERE id = $1', [id]);
    res.json({ mensaje: "Obra eliminada" });
  } catch (err) { res.status(500).send('Error al eliminar obra'); }
});

// --- AUTENTICACIÓN ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@obralink.cl' && password === 'admin123') return res.json({ success: true, nombre: 'Administrador', rol: 'ADMIN' });
  
  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
    if (resultado.rows.length > 0) {
      const usuario = resultado.rows[0];
      res.json({ success: true, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
    } else {
      res.status(401).json({ success: false, mensaje: "Credenciales incorrectas" });
    }
  } catch (error) { res.status(500).send('Error en el servidor'); }
});

// ==========================================
// 3. FUNCIONES AVANZADAS E INFORMES
// ==========================================

// ==========================================
// 4. REPORTES PDF (DISEÑO PROFESIONAL RECUPERADO)
// ==========================================

// --- REPORTE DE INVENTARIO (Estilo Azul/Tabla) ---
app.get('/reporte-pdf', async (req, res) => {
  try {
    const { busqueda, categoria } = req.query; 
    let queryText = 'SELECT * FROM productos';
    const queryParams = [];
    const conditions = [];

    if (busqueda) { conditions.push(`(nombre ILIKE $${queryParams.length + 1} OR sku ILIKE $${queryParams.length + 1})`); queryParams.push(`%${busqueda}%`); }
    if (categoria && categoria !== '') { conditions.push(`categoria = $${queryParams.length + 1}`); queryParams.push(categoria); }
    if (conditions.length > 0) { queryText += ' WHERE ' + conditions.join(' AND '); }
    queryText += ' ORDER BY categoria ASC, nombre ASC';

    const resultado = await pool.query(queryText, queryParams);
    const productos = resultado.rows;

    // Cálculos para el resumen
    const totalItems = productos.reduce((sum, p) => sum + p.stock_actual, 0);
    const valorTotal = productos.reduce((sum, p) => sum + (p.stock_actual * p.precio_costo), 0);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario_obralink.pdf');
    doc.pipe(res);

    // --- ENCABEZADO AZUL ---
    doc.rect(0, 0, 595, 100).fill('#2563eb'); // Fondo Azul
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('ObraLink', 50, 30);
    doc.fontSize(10).font('Helvetica').text('SISTEMA DE CONTROL INTELIGENTE', 50, 60, { characterSpacing: 2 });

    // CAJA BLANCA CON FECHA
    doc.roundedRect(400, 30, 150, 40, 5).fill('white');
    doc.fillColor('#333').fontSize(8).font('Helvetica-Bold').text('REPORTE GENERADO', 410, 38);
    doc.fontSize(10).font('Helvetica').text(new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL'), 410, 52);

    doc.moveDown(4);

    // --- TABLA DE PRODUCTOS ---
    let y = 130;
    
    // Encabezados de Tabla
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#2563eb');
    doc.text('PRODUCTO / SKU', 50, y);
    doc.text('CATEGORÍA', 220, y);
    doc.text('STOCK', 350, y, { width: 50, align: 'center' });
    doc.text('COSTO UNIT.', 410, y, { width: 70, align: 'right' });
    doc.text('VALOR TOTAL', 490, y, { width: 60, align: 'right' });
    
    // Línea separadora
    doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#2563eb').lineWidth(2).stroke();
    y += 25;

    // Filas
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    
    productos.forEach((p, i) => {
      // Fondo alternado para filas
      if (i % 2 === 0) {
        doc.rect(50, y - 5, 500, 20).fillColor('#f8fafc').fill();
        doc.fillColor('#334155'); // Reset color texto
      }

      // Check de nueva página
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.font('Helvetica-Bold').text(p.nombre, 50, y);
      doc.font('Helvetica').fontSize(7).text(p.sku, 50, y + 10);
      
      doc.fontSize(9).text(p.categoria || 'General', 220, y);
      
      // Stock en rojo si es 0
      if (p.stock_actual <= 0) doc.fillColor('red');
      doc.text(p.stock_actual, 350, y, { width: 50, align: 'center' });
      doc.fillColor('#334155'); // Reset

      doc.text('$' + p.precio_costo.toLocaleString('es-CL'), 410, y, { width: 70, align: 'right' });
      doc.font('Helvetica-Bold').text('$' + (p.stock_actual * p.precio_costo).toLocaleString('es-CL'), 490, y, { width: 60, align: 'right' });
      doc.font('Helvetica'); // Reset font

      y += 25;
    });

    // --- RESUMEN EJECUTIVO (Cuadro lateral) ---
    y += 20;
    if (y > 650) { doc.addPage(); y = 50; }

    doc.roundedRect(350, y, 200, 70, 5).fill('#eff6ff'); // Fondo azul claro
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(10).text('RESUMEN EJECUTIVO', 365, y + 10);
    
    doc.fillColor('#334155').font('Helvetica').fontSize(9);
    doc.text('Total Unidades:', 365, y + 30);
    doc.text(totalItems.toLocaleString('es-CL'), 480, y + 30, { align: 'right', width: 50 });
    
    doc.text('Valorización Total:', 365, y + 45);
    doc.fillColor('#16a34a').font('Helvetica-Bold'); // Verde
    doc.text('$' + valorTotal.toLocaleString('es-CL'), 450, y + 45, { align: 'right', width: 80 });

    // --- FIRMAS ---
    const yFirma = 750; // Posición fija abajo
    doc.moveTo(50, yFirma).lineTo(200, yFirma).strokeColor('#333').lineWidth(1).stroke();
    doc.fontSize(8).fillColor('#666').text('Firma Jefe de Bodega', 50, yFirma + 5, { width: 150, align: 'center' });

    doc.moveTo(350, yFirma).lineTo(500, yFirma).stroke();
    doc.text('Firma Administrador', 350, yFirma + 5, { width: 150, align: 'center' });

    doc.end();
  } catch (err) { res.status(500).send('Error PDF'); }
});

// --- REPORTE DE HISTORIAL (Estilo Azul/Tabla) ---
app.get('/reporte-historial-pdf', async (req, res) => {
  const { busqueda, tipo } = req.query;
  try {
    let query = `
      SELECT m.fecha, m.tipo, m.cantidad, m.recibido_por, m.proveedor, p.nombre, p.sku, o.nombre as nombre_obra 
      FROM movimientos m 
      JOIN productos p ON m.id_producto = p.id 
      LEFT JOIN obras o ON m.id_obra = o.id
      ORDER BY m.fecha DESC
    `;
    const { rows } = await pool.query(query);
    
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=historial_movimientos.pdf');
    doc.pipe(res);

    // --- ENCABEZADO AZUL ---
    doc.rect(0, 0, 595, 100).fill('#2563eb');
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('ObraLink', 50, 30);
    doc.fontSize(10).font('Helvetica').text('HISTORIAL DE MOVIMIENTOS Y TRAZABILIDAD', 50, 60, { characterSpacing: 1 });

    // CAJA BLANCA
    doc.roundedRect(400, 30, 150, 40, 5).fill('white');
    doc.fillColor('#333').fontSize(8).font('Helvetica-Bold').text('FECHA REPORTE', 410, 38);
    doc.fontSize(10).font('Helvetica').text(new Date().toLocaleDateString('es-CL'), 410, 52);

    doc.moveDown(5);

    // --- TABLA ---
    let y = 130;

    // Headers
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#2563eb');
    doc.text('FECHA', 50, y);
    doc.text('TIPO', 120, y);
    doc.text('PRODUCTO / SKU', 180, y);
    doc.text('CANT.', 350, y, { width: 40, align: 'center' });
    doc.text('RESPONSABLE / PROV.', 400, y);
    
    doc.moveTo(50, y + 12).lineTo(550, y + 12).lineWidth(1).strokeColor('#2563eb').stroke();
    y += 20;

    doc.font('Helvetica').fontSize(8).fillColor('#333');

    rows.forEach((r, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        
        // Alternar color fila
        if (i % 2 === 0) { doc.rect(50, y - 4, 500, 18).fillColor('#f8fafc').fill(); doc.fillColor('#333'); }

        // Fecha
        doc.text(new Date(r.fecha).toLocaleDateString('es-CL', {timeZone: 'UTC'}), 50, y);
        
        // Tipo (Color)
        if (r.tipo === 'ENTRADA') doc.fillColor('#16a34a').font('Helvetica-Bold').text('ENTRADA', 120, y);
        else doc.fillColor('#dc2626').font('Helvetica-Bold').text('SALIDA', 120, y);
        
        // Producto
        doc.fillColor('#333').font('Helvetica').text(r.nombre, 180, y, { width: 160, lineBreak: false, ellipsis: true });
        doc.fontSize(7).fillColor('#666').text(r.sku, 180, y + 9);
        
        // Cantidad
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(r.cantidad, 350, y, { width: 40, align: 'center' });
        
        // Responsable
        doc.fontSize(8).font('Helvetica').fillColor('#333');
        const detalle = r.tipo === 'ENTRADA' ? (r.proveedor || 'Sin Prov.') : (r.recibido_por || 'En Obra');
        doc.text(detalle, 400, y, { width: 140, ellipsis: true });

        y += 25;
    });

    // --- RESUMEN DEL PERIODO ---
    y += 10;
    if (y > 650) { doc.addPage(); y = 50; }
    
    // Contamos entradas y salidas
    const totalEntradas = rows.filter(r => r.tipo === 'ENTRADA').reduce((a, b) => a + b.cantidad, 0);
    const totalSalidas = rows.filter(r => r.tipo === 'SALIDA').reduce((a, b) => a + b.cantidad, 0);

    doc.roundedRect(350, y, 200, 60, 5).fill('#eff6ff');
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(9).text('RESUMEN DEL PERIODO', 365, y + 10);
    
    doc.fillColor('#333').font('Helvetica').text('Total Entradas (Unid):', 365, y + 25);
    doc.fillColor('#16a34a').text(totalEntradas, 500, y + 25, { align: 'right' });
    
    doc.fillColor('#333').text('Total Salidas (Unid):', 365, y + 40);
    doc.fillColor('#dc2626').text(totalSalidas, 500, y + 40, { align: 'right' });

    // --- FIRMAS ---
    const yFirma = 750; 
    doc.moveTo(50, yFirma).lineTo(200, yFirma).strokeColor('#333').lineWidth(1).stroke();
    doc.fontSize(8).fillColor('#666').text('Firma Jefe de Bodega', 50, yFirma + 5, { width: 150, align: 'center' });

    doc.moveTo(350, yFirma).lineTo(500, yFirma).stroke();
    doc.text('Firma Administrador', 350, yFirma + 5, { width: 150, align: 'center' });

    doc.end();
  } catch (err) { 
      console.error(err);
      res.status(500).send('Error PDF Historial'); 
  }
});

// Registrar Ingreso Completo (Manual) con DOBLE FECHA
app.post('/registrar-ingreso-completo', async (req, res) => {
  const { esNuevo, id_producto, nombre, categoria, cantidad, precio_unitario, fecha, proveedor, recibido_por } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let finalId = id_producto;

    if (esNuevo) {
      const nombreFinal = nombre || "Producto Sin Nombre"; 
      const skuAuto = nombreFinal.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 10000);
      const resInsert = await client.query(
        `INSERT INTO productos (nombre, sku, categoria, precio_costo, stock_actual, ultimo_proveedor) 
         VALUES ($1, $2, $3, $4, 0, $5) RETURNING id`,
        [nombreFinal, skuAuto, categoria || 'General', precio_unitario, proveedor]
      );
      finalId = resInsert.rows[0].id;
    } else {
      await client.query(
        `UPDATE productos SET precio_costo = $1, ultimo_proveedor = $2 WHERE id = $3`,
        [precio_unitario, proveedor, finalId]
      );
    }

     await client.query(`UPDATE productos SET stock_actual = stock_actual + $1 WHERE id = $2`, [cantidad, finalId]);

    // Insertamos 'fecha' (manual) y 'fecha_registro' (NOW)
    const fechaEvento = fecha ? new Date(fecha) : new Date();
     await client.query(
      `INSERT INTO movimientos (id_producto, tipo, cantidad, fecha, fecha_registro, id_obra, proveedor, recibido_por) 
       VALUES ($1, 'ENTRADA', $2, $3, NOW(), NULL, $4, $5)`,
      [finalId, cantidad, fecha || new Date(), proveedor, recibido_por]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Subir Factura (Sin cambios)
app.post('/subir-factura', upload.single('factura'), async (req, res) => {
  if (!req.file) return res.status(400).send('No se subió ningún archivo');

  try {
    const dataBuffer = req.file.buffer;
    const data = await pdf(dataBuffer);
    const text = data.text; 

    const productosDetectados = [];
    const regexFila = /"(\d+)\s*"\s*,\s*"([^"]*)"\s*,\s*"([\s\S]*?)"\s*,\s*"(\d+)\s*"\s*,\s*"([\d\.]+,\d+)\s*"/g;

    let match;
    while ((match = regexFila.exec(text)) !== null) {
      const descripcionLimpia = match[3].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const cantidad = parseInt(match[4].trim());
      const precioSucio = match[5].trim(); 
      const precioLimpio = parseInt(precioSucio.replace(/\./g, '').split(',')[0]);

      if (descripcionLimpia && !isNaN(cantidad)) {
        productosDetectados.push({
          sku: match[2].replace(/\n/g, '').trim() || 'NUEVO',
          nombre: descripcionLimpia,
          cantidad: cantidad,
          precio_costo: precioLimpio,
          categoria: 'Importación'
        });
      }
    }
    res.json({ success: true, productos: productosDetectados });
  } catch (err) {
    res.status(500).send('Error procesando factura');
  }
});

app.post('/ingreso-masivo', async (req, res) => {
  const { productos } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of productos) {
      // Nota: Si usas Promise.all aquí sería más rápido, pero así es seguro secuencial
      const checkRes = await client.query('SELECT id FROM productos WHERE nombre ILIKE $1', [p.nombre]);
      let idProducto;
      if (checkRes.rows.length > 0) {
        idProducto = checkRes.rows[0].id;
        await client.query('UPDATE productos SET stock_actual = stock_actual + $1, precio_costo = $2 WHERE id = $3', [p.cantidad, p.precio_costo, idProducto]);
      } else {
        const insertRes = await client.query(
          'INSERT INTO productos (nombre, sku, categoria, precio_costo, stock_actual, ultimo_proveedor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [p.nombre, p.sku, 'Importación', p.precio_costo, p.cantidad, 'Factura Importación']
        );
        idProducto = insertRes.rows[0].id;
      }
      await client.query('INSERT INTO movimientos (id_producto, tipo, cantidad, fecha, fecha_registro, proveedor) VALUES ($1, $2, $3, NOW(), NOW(), $4)', [idProducto, 'ENTRADA', p.cantidad, 'Factura Importación']);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).send('Error'); } finally { client.release(); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});