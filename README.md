# SISTEMA FACTURACION LB-E-CF

Este proyecto es un **Prototipo Funcional (MVP)** de un sistema SaaS de Facturación Electrónica para República Dominicana.

## Stack Tecnológico

*   **Frontend:** React + Vite
*   **Lenguaje:** TypeScript
*   **Base de Datos Local (Cliente):** Dexie.js (IndexedDB) para almacenamiento Offline-First.
*   **Estilos:** Tailwind CSS
*   **Iconos:** Lucide-React

## Arquitectura y Funcionalidades Clave

### 1. Offline-First
El sistema utiliza `Dexie.js` para almacenar todos los datos (Productos, Clientes, Facturas) localmente en el navegador.
*   Las facturas se crean con estado `pending`.
*   Un proceso en segundo plano (simulado en `App.tsx`) detecta la conexión a internet y sincroniza las facturas pendientes.

### 2. Reglas Fiscales (DGII)
*   **Validación de RNC:** Implementación del Algoritmo Módulo 11 en `src/utils/fiscalUtils.ts`.
*   **Secuencias NCF:** Manejo local de secuencias de Comprobantes Fiscales (Serie E).
*   **Impuestos:** Cálculo de ITBIS (18%, 16%, 0%).

### 3. Interfaz de Usuario
Diseñada para uso en escritorio (Teclado y Mouse), permitiendo búsqueda rápida de productos y gestión eficiente del carrito de compras.

**Atajos de Teclado:**
*   `F2`: Enfocar campo de búsqueda de productos.
*   `Enter` (en campo Cantidad): Agregar producto al carrito.

**Funciones de QA (Testing):**
*   **Simular Offline:** Botón en la cabecera para desconectar artificialmente la app de la "red" y probar la cola de sincronización.

## Instalación y Uso

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

3.  Ejecutar pruebas (QA):
    ```bash
    npm test
    ```

## Estructura del Proyecto

*   `src/db`: Configuración de la base de datos local (Dexie).
*   `src/types`: Definiciones de tipos TypeScript estrictos.
*   `src/utils/fiscalUtils.ts`: Lógica de negocio fiscal.
*   `src/App.tsx`: Componente principal y lógica de UI.

## Estado del Proyecto

*   [x] Configuración inicial y dependencias.
*   [x] Base de datos local funcional.
*   [x] Validación de RNC y Cálculos Fiscales.
*   [x] UI de Facturación (Desktop).
*   [x] Simulación de Sincronización Offline/Online.
