# Deploy en Railway

## Pasos rápidos

### 1. Crear cuenta
- Ve a [railway.app](https://railway.app)
- Login con GitHub

### 2. Crear proyecto
- Click en **"Create a new project"**
- Selecciona **"Deploy from GitHub repo"**
- Autoriza Railway para acceder a tu GitHub
- Selecciona el repositorio `gab95249/gab95249`
- Selecciona la rama `claude/sorpresa-digital-qr-j0vq64`

### 3. Railway configura automáticamente
- Detecta Node.js
- Lee `package.json` y `Procfile`
- Instala dependencias
- Corre `npm start`
- Genera URL pública automáticamente

### 4. ¡Listo!
- Recibirás una URL como `https://nombredelapp-production.up.railway.app`
- Ambos pueden acceder desde cualquier dispositivo
- Las fotos se guardan en la base de datos de Railway

## Detalles técnicos

Railway proporciona automáticamente:
- ✅ Servidor Node.js
- ✅ Almacenamiento persistente para `historia.db`
- ✅ Carpeta `uploads/` para las fotos
- ✅ Variables de entorno (PORT, etc)
- ✅ Redeploy automático cuando pushes cambios

## URL compartible

Una vez deployado:
1. Copia la URL de Railway
2. Comparte con tu novia
3. Ambos accesan desde sus celulares/compu
4. Se sincroniza automáticamente

## Troubleshooting

**"Deployment failed"**
- Revisa los logs en Railway
- Verifica que `package.json` tenga todas las dependencias

**"Cannot find module"**
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**Photos no se guardan**
- Railway guarda en disco ephemeral (se pierde cada deploy)
- Solución: usar PostgreSQL (Railway ofrece gratis)
- O cambiar a Supabase/Firebase

## Upgrades futuros

- Usar PostgreSQL en lugar de SQLite (más robusto)
- Agregar notificaciones en tiempo real
- Autenticación con Google/Facebook
- Backup automático de fotos

---

¿Necesitas ayuda con algo? 🚀
