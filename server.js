const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// El navegador debe revalidar el código en cada visita: servir un script.js
// viejo junto a un index.html nuevo deja la página a medias
app.use(express.static('public', {
    etag: true,
    maxAge: 0,
    setHeaders: (res, ruta) => {
        if (/\.(html|js|css)$/i.test(ruta)) res.setHeader('Cache-Control', 'no-cache');
    }
}));
app.use('/uploads', express.static('uploads'));

// Crear carpeta de uploads si no existe
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const MAX_SUBIDA = 25 * 1024 * 1024;

class SubidaInvalida extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.status = 400;
    }
}

// La foto se procesa en memoria antes de escribirla, así que multer no toca el disco
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SUBIDA },
    fileFilter: (req, file, cb) => {
        const extensionValida = /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.originalname);
        // Algunos móviles mandan el HEIC sin mimetype reconocible, así que basta con que acierte uno de los dos
        if (extensionValida || /^image\//i.test(file.mimetype)) return cb(null, true);
        cb(new SubidaInvalida('Ese archivo no es una foto. Sube un jpg, png, webp, gif o heic.'));
    }
});

async function normalizarFoto(file) {
    const esHeic = /heic|heif/i.test(file.mimetype) || /\.(heic|heif)$/i.test(file.originalname);
    const esGif = /gif/i.test(file.mimetype) || /\.gif$/i.test(file.originalname);

    // El GIF se guarda tal cual: pasarlo por JPEG le quitaría la animación
    if (esGif) return { buffer: file.buffer, extension: '.gif' };

    let origen = file.buffer;
    if (esHeic) {
        try {
            origen = await heicConvert({ buffer: file.buffer, format: 'JPEG', quality: 0.92 });
        } catch (err) {
            throw new SubidaInvalida('No se pudo leer esa foto HEIC. Prueba a exportarla como JPG desde el móvil.');
        }
    }

    try {
        const buffer = await sharp(origen)
            .rotate()
            .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
        return { buffer, extension: '.jpg' };
    } catch (err) {
        throw new SubidaInvalida('Esa imagen está dañada o en un formato que no se puede abrir.');
    }
}

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
            titulo TEXT NOT NULL DEFAULT 'Nuestro Momento',
            descripcion TEXT,
            fecha_recuerdo DATE,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `, () => {
        // Agregar columnas si no existen (para bases de datos antiguas)
        db.run('ALTER TABLE historias ADD COLUMN titulo TEXT NOT NULL DEFAULT "Nuestro Momento"', (err) => {
            if (!err) console.log('Columna titulo agregada a historias');
        });
        db.run('ALTER TABLE historias ADD COLUMN fecha_recuerdo DATE', (err) => {
            if (!err) console.log('Columna fecha_recuerdo agregada a historias');
        });
        db.run("ALTER TABLE historias ADD COLUMN tipo TEXT NOT NULL DEFAULT 'foto'", (err) => {
            if (!err) console.log('Columna tipo agregada a historias');
        });
    });

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

app.post('/api/subir', upload.single('foto'), async (req, res, next) => {
    const { usuario_id, usuario_nombre, titulo, fecha_recuerdo, descripcion } = req.body;
    const tipo = req.body.tipo === 'carta' ? 'carta' : 'foto';

    if (!usuario_id || !titulo || !fecha_recuerdo) {
        return res.status(400).json({ error: 'Usuario, título y fecha requeridos' });
    }

    // Una carta puede ser solo texto; una foto sin imagen no es nada
    if (tipo === 'foto' && !req.file) {
        return res.status(400).json({ error: 'Falta la foto' });
    }

    if (tipo === 'carta' && !req.file && !(descripcion || '').trim()) {
        return res.status(400).json({ error: 'Escribe la carta o adjunta una foto de ella' });
    }

    try {
        let fotoUrl = '';
        if (req.file) {
            const { buffer, extension } = await normalizarFoto(req.file);
            const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}${extension}`;
            await fs.promises.writeFile(path.join('uploads', nombre), buffer);
            fotoUrl = `/uploads/${nombre}`;
        }

        db.run(
            'INSERT INTO historias (usuario_id, usuario_nombre, foto_url, titulo, fecha_recuerdo, descripcion, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [usuario_id, usuario_nombre, fotoUrl, titulo, fecha_recuerdo, descripcion || '', tipo],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error guardando la foto' });
                }

                res.json({
                    success: true,
                    id: this.lastID,
                    foto_url: fotoUrl,
                    titulo: titulo,
                    descripcion: descripcion || ''
                });
            }
        );
    } catch (err) {
        next(err);
    }
});

// Sin esto, cualquier rechazo de multer acaba en el handler por defecto de Express y sale como un 500 sin explicación
app.use('/api/subir', (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return err.code === 'LIMIT_FILE_SIZE'
            ? res.status(413).json({ error: 'La foto pesa más de 25 MB. Prueba con una más ligera.' })
            : res.status(400).json({ error: `No se pudo leer el archivo (${err.code}).` });
    }

    if (err instanceof SubidaInvalida) {
        return res.status(err.status).json({ error: err.message });
    }

    console.error('Error inesperado subiendo foto:', err);
    res.status(500).json({ error: 'Error guardando la foto' });
});

app.get('/api/historia', (req, res) => {
    db.all(
        'SELECT id, usuario_id, usuario_nombre, foto_url, titulo, descripcion, fecha_recuerdo, fecha, tipo FROM historias ORDER BY fecha_recuerdo ASC',
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error obteniendo la historia' });
            }

            res.json({ momentos: rows || [] });
        }
    );
});

app.get('/api/mi-historia/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;

    db.all(
        'SELECT id, usuario_id, usuario_nombre, foto_url, titulo, descripcion, fecha_recuerdo, fecha, tipo FROM historias WHERE usuario_id = ? ORDER BY fecha_recuerdo ASC',
        [usuario_id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error obteniendo tu historia' });
            }

            res.json({ momentos: rows || [] });
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
