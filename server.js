const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Crear carpeta de uploads si no existe
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configurar multer para subida de fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
        }
    }
});

// Base de datos
const db = new sqlite3.Database('./historia.db', (err) => {
    if (err) console.error('Error abriendo BD:', err);
    else console.log('BD conectada');
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY,
            nombre TEXT UNIQUE NOT NULL,
            contrasena TEXT NOT NULL,
            color TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS historias (
            id INTEGER PRIMARY KEY,
            usuario_id INTEGER NOT NULL,
            usuario_nombre TEXT NOT NULL,
            foto_url TEXT NOT NULL,
            descripcion TEXT,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

    // Insertar usuarios de ejemplo si no existen
    const usuarios = [
        { nombre: 'yo', contrasena: '1234', color: '#667eea' },
        { nombre: 'mi_novia', contrasena: '5678', color: '#f06292' }
    ];

    usuarios.forEach(user => {
        db.run(`INSERT OR IGNORE INTO usuarios (nombre, contrasena, color) VALUES (?, ?, ?)`,
            [user.nombre, user.contrasena, user.color],
            (err) => {
                if (!err) console.log(`Usuario ${user.nombre} listo`);
            }
        );
    });
});

// Rutas
app.post('/api/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    db.get(
        'SELECT id, nombre, color FROM usuarios WHERE nombre = ? AND contrasena = ?',
        [usuario, contrasena],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Error en la BD' });
            }

            if (row) {
                res.json({
                    success: true,
                    usuario_id: row.id,
                    usuario_nombre: row.nombre,
                    color: row.color
                });
            } else {
                res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            }
        }
    );
});

app.post('/api/subir', upload.single('foto'), (req, res) => {
    const { usuario_id, usuario_nombre, descripcion } = req.body;

    if (!usuario_id || !req.file) {
        return res.status(400).json({ error: 'Foto y usuario requeridos' });
    }

    const fotoUrl = `/uploads/${req.file.filename}`;

    db.run(
        'INSERT INTO historias (usuario_id, usuario_nombre, foto_url, descripcion) VALUES (?, ?, ?, ?)',
        [usuario_id, usuario_nombre, fotoUrl, descripcion || ''],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error guardando la foto' });
            }

            res.json({
                success: true,
                id: this.lastID,
                foto_url: fotoUrl,
                descripcion: descripcion || ''
            });
        }
    );
});

app.get('/api/historia', (req, res) => {
    db.all(
        'SELECT id, usuario_nombre, foto_url, descripcion, fecha FROM historias ORDER BY fecha DESC',
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error obteniendo la historia' });
            }

            res.json({ historias: rows || [] });
        }
    );
});

app.get('/api/mi-historia/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;

    db.all(
        'SELECT id, usuario_nombre, foto_url, descripcion, fecha FROM historias WHERE usuario_id = ? ORDER BY fecha DESC',
        [usuario_id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error obteniendo tu historia' });
            }

            res.json({ historias: rows || [] });
        }
    );
});

app.delete('/api/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.body;

    db.get('SELECT usuario_id, foto_url FROM historias WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'Foto no encontrada' });
        }

        if (row.usuario_id !== parseInt(usuario_id)) {
            return res.status(403).json({ error: 'No puedes eliminar fotos de otros' });
        }

        // Eliminar archivo
        const filePath = path.join(__dirname, 'public', row.foto_url);
        fs.unlink(filePath, (err) => {
            if (err) console.log('Error eliminando archivo:', err);
        });

        // Eliminar de BD
        db.run('DELETE FROM historias WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error eliminando' });
            }
            res.json({ success: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});
