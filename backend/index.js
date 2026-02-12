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

// 11. GENERAR PDF DE HISTORIAL (CORREGIDO - 1 PÁGINA)
app.get('/reporte-historial-pdf', async (req, res) => {
  const { busqueda, tipo } = req.query;
  
  try {
    // 1. Consulta SQL
    let query = `
      SELECT m.fecha, m.tipo, m.cantidad, p.nombre as producto, p.sku, o.nombre as obra 
      FROM movimientos m
      JOIN productos p ON m.id_producto = p.id
      LEFT JOIN obras o ON m.id_obra = o.id
    `;
    
    const params = [];
    const conditions = [];

    if (busqueda) {
      conditions.push(`(p.nombre ILIKE $${params.length + 1} OR p.sku ILIKE $${params.length + 1} OR o.nombre ILIKE $${params.length + 1})`);
      params.push(`%${busqueda}%`);
    }

    if (tipo && tipo !== 'TODOS') {
      conditions.push(`m.tipo = $${params.length + 1}`);
      params.push(tipo);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.fecha DESC';

    const { rows } = await pool.query(query, params);

    // 2. Cálculos Resumen
    const totalEntradas = rows.filter(r => r.tipo === 'ENTRADA').reduce((acc, r) => acc + r.cantidad, 0);
    const totalSalidas = rows.filter(r => r.tipo === 'SALIDA').reduce((acc, r) => acc + r.cantidad, 0);

    // 3. Generar PDF
    const PDFDocument = require('pdfkit');
    // IMPORTANTE: Margen inferior más pequeño (30) para que quepan las firmas
    const doc = new PDFDocument({ margin: 30, size: 'A4' }); 

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=historial_premium.pdf');
    doc.pipe(res);

    // --- CABECERA AZUL ---
    doc.rect(0, 0, doc.page.width, 100).fill('#2563eb'); 
    
    doc.fontSize(28).fillColor('white').text('ObraLink', 50, 30);
    doc.fontSize(10).text('HISTORIAL DE MOVIMIENTOS Y TRAZABILIDAD', 50, 65);

    doc.roundedRect(doc.page.width - 200, 20, 150, 60, 5).fill('white');
    doc.fillColor('black').fontSize(10).font('Helvetica-Bold').text('REPORTE', doc.page.width - 185, 30);
    doc.font('Helvetica').fontSize(9).text(new Date().toLocaleDateString(), doc.page.width - 185, 45);
    doc.text(new Date().toLocaleTimeString(), doc.page.width - 185, 58);

    // --- TABLA DE DATOS ---
    const tableTop = 130;
    const colFecha = 50;
    const colHora = 120;
    const colTipo = 180;
    const colProd = 260;
    const colCant = 400;
    const colDest = 460;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#2563eb');
    doc.text('FECHA', colFecha, tableTop);
    doc.text('HORA', colHora, tableTop);
    doc.text('TIPO', colTipo, tableTop);
    doc.text('PRODUCTO / SKU', colProd, tableTop);
    doc.text('CANT.', colCant, tableTop);
    doc.text('ORIGEN / DESTINO', colDest, tableTop);
    
    doc.strokeColor('#2563eb').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let position = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor('black');

    rows.forEach((row) => {
      // Control de salto de página (Dejamos 150px libres abajo para firmas)
      if (position > doc.page.height - 150) {
        doc.addPage();
        position = 50; // Reiniciar posición arriba
      }

      const fecha = new Date(row.fecha).toLocaleDateString();
      const hora = new Date(row.fecha).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
      const esEntrada = row.tipo === 'ENTRADA';
      const colorTipo = esEntrada ? '#16a34a' : '#dc2626';

      doc.text(fecha, colFecha, position);
      doc.text(hora, colHora, position);
      
      doc.fillColor(colorTipo).font('Helvetica-Bold').text(row.tipo, colTipo, position);
      doc.fillColor('black').font('Helvetica');

      doc.text(row.producto, colProd, position, { width: 130, lineBreak: false, ellipsis: true });
      doc.fontSize(7).fillColor('gray').text(row.sku, colProd, position + 10);
      doc.fontSize(9).fillColor('black');

      doc.text(row.cantidad, colCant, position);
      
      const destinoTexto = esEntrada ? 'Bodega Central' : row.obra;
      doc.text(destinoTexto, colDest, position, { width: 90, lineBreak: false, ellipsis: true });

      position += 30;
    });

    // --- RESUMEN EJECUTIVO ---
    // Si no cabe el resumen, nueva página
    if (position > doc.page.height - 200) { doc.addPage(); position = 50; }
    
    const boxTop = position + 20;
    doc.fillColor('#eff6ff').roundedRect(350, boxTop, 200, 80, 5).fill();
    
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(10).text('RESUMEN DEL PERIODO', 365, boxTop + 10);
    doc.fillColor('black').fontSize(9).font('Helvetica');
    doc.text('Total Entradas (Unid):', 365, boxTop + 30);
    doc.font('Helvetica-Bold').fillColor('#16a34a').text(totalEntradas, 500, boxTop + 30, { align: 'right', width: 40 });
    doc.fillColor('black').font('Helvetica').text('Total Salidas (Unid):', 365, boxTop + 50);
    doc.font('Helvetica-Bold').fillColor('#dc2626').text(totalSalidas, 500, boxTop + 50, { align: 'right', width: 40 });

    // --- FIRMAS (FIX: Subidas para no crear pagina nueva) ---
    // Posición fija segura desde abajo (100px desde el final)
    const firmaY = doc.page.height - 100;

    doc.strokeColor('black').lineWidth(1);
    
    // Firma 1
    doc.moveTo(50, firmaY).lineTo(200, firmaY).stroke();
    doc.fontSize(8).fillColor('gray').text('Firma Jefe de Bodega', 50, firmaY + 5, { width: 150, align: 'center' });

    // Firma 2
    doc.moveTo(350, firmaY).lineTo(500, firmaY).stroke();
    doc.text('Firma Administrador', 350, firmaY + 5, { width: 150, align: 'center' });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generando PDF');
  }
});

// ==========================================
// 4. INICIO DEL SERVIDOR
// ==========================================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});
