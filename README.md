# CrediULEP - Plataforma de Gestión de Créditos y Banca Digital

Aplicación web completa para la administración de clientes, solicitudes de crédito, pagos de cuotas y monitoreo de seguridad con CAPTCHA en tiempo real.

## 🚀 Características
- **Panel de Cliente**: Visualización de saldo, tarjetas virtuales, cajitas de ahorro, solicitudes de crédito y pagos de cuotas directa vía WhatsApp/SPEI.
- **Panel Administrativo**: Gestión completa de clientes (alta, edición, bloqueo, cambio de límite y eliminación con borrado en cascada), aprobación/rechazo de solicitudes de préstamo, control de capital administrativo y auditoría de seguridad CAPTCHA.
- **Base de Datos en Tiempo Real con Firebase Firestore**: Sincronización automática e instantánea de usuarios, préstamos, transacciones, tarjetas, cajitas y configuración de seguridad.

---

## 🛠️ Configuración para GitHub y Despliegue

### 1. Clonar e Instalar Dependencias
```bash
git clone <URL_DE_TU_REPOSITORIO>
cd crediulep
npm install
```

### 2. Variables de Entorno (Firebase)
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
VITE_FIREBASE_API_KEY="tu_api_key"
VITE_FIREBASE_AUTH_DOMAIN="tu_proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu_proyecto_id"
VITE_FIREBASE_STORAGE_BUCKET="tu_proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="tu_sender_id"
VITE_FIREBASE_APP_ID="tu_app_id"
```

> **Nota**: Si las variables de entorno no están configuradas, la aplicación utiliza una configuración fallback segura sin interrumpir el funcionamiento de la app.

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

### 4. Compilación y Despliegue en GitHub Pages
Para desplegar automáticamente en **GitHub Pages**:
1. Ve a tu repositorio en GitHub: **Settings > Pages**.
2. En **Build and deployment > Source**, selecciona **GitHub Actions**.
3. Al hacer `git push` a tu rama principal (`main` o `master`), el flujo automatizado `.github/workflows/deploy.yml` construirá y publicará la aplicación automáticamente.

> **Nota importante**: La configuración `base: './'` ya ha sido agregada a `vite.config.ts` para asegurar que las rutas relativas de los scripts y estilos carguen correctamente en subdominios de GitHub Pages sin pantalla blanca.

---

## 🔒 Reglas de Seguridad Recomendadas para Firestore (`firestore.rules`)
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

Desarrollado para GROUP ULEP S.A.S © 2026.
