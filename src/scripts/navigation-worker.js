// navigation-worker.js
const CACHE_NAME = 'cart-navigation-cache-v1';
const TRACKING_INTERVAL = 10000; // 10 segundos entre actualizaciones en segundo plano

// Variables de estado de navegación
let navigationData = null;
let isTracking = false;
let trackingInterval = null;

// Función para mostrar una notificación
function showNotification(title, message) {
    if (self.registration && self.Notification.permission === 'granted') {
        self.registration.showNotification(title, {
            body: message,
            icon: '/icon.png'
        });
    }
}

// Inicializar el rastreo en segundo plano
function startBackgroundTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }
    
    isTracking = true;
    console.log('[Service Worker] Iniciando rastreo en segundo plano');
    
    // Mostrar notificación
    showNotification('Rastreo de Carrito', 'El rastreo en segundo plano está activo');
    
    // Iniciar intervalo de rastreo
    trackingInterval = setInterval(() => {
        if (!isTracking) {
            clearInterval(trackingInterval);
            return;
        }
        
        // Intentar usar sensores en segundo plano (limitado por el navegador)
        // Esta parte es conceptual ya que los navegadores limitan el acceso a sensores en SW
        
        // Actualizamos la marca de tiempo para saber que el SW sigue funcionando
        if (navigationData) {
            navigationData.lastUpdated = Date.now();
        }
        
        // Notificar al cliente que hay datos actualizados
        notifyClients();
        
    }, TRACKING_INTERVAL);
}

// Detener el rastreo en segundo plano
function stopBackgroundTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    
    isTracking = false;
    console.log('[Service Worker] Deteniendo rastreo en segundo plano');
    
    // Mostrar notificación
    showNotification('Rastreo de Carrito', 'El rastreo en segundo plano se ha detenido');
}

// Notificar a todos los clientes sobre la actualización
function notifyClients() {
    if (!navigationData) return;
    
    self.clients.matchAll()
        .then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'BACKGROUND_UPDATE',
                    data: navigationData
                });
            });
        });
}

// Evento de instalación - almacenar en caché los recursos estáticos
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/carrito.html',
                    '/icon.png',
                    '/styles.css'
                ]);
            })
            .then(() => {
                console.log('[Service Worker] Recursos almacenados en caché');
                return self.skipWaiting();
            })
    );
});

// Evento de activación - limpiar cachés antiguos
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activando...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => {
                        return cacheName !== CACHE_NAME;
                    }).map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activación completada');
                return self.clients.claim();
            })
    );
});

// Evento de recuperación - interceptar solicitudes de red
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request);
            })
    );
});

// Evento de mensaje - recibir mensajes desde el cliente
self.addEventListener('message', event => {
    console.log('[Service Worker] Mensaje recibido:', event.data);
    
    switch (event.data.type) {
        case 'START_TRACKING':
            startBackgroundTracking();
            break;
            
        case 'STOP_TRACKING':
            stopBackgroundTracking();
            break;
            
        case 'UPDATE_NAVIGATION':
            navigationData = event.data.data;
            isTracking = navigationData.isTracking;
            
            // Si el rastreo está activo pero el intervalo no está configurado
            if (isTracking && !trackingInterval) {
                startBackgroundTracking();
            } else if (!isTracking && trackingInterval) {
                stopBackgroundTracking();
            }
            break;
            
        case 'REQUEST_UPDATE':
            // Enviar datos de navegación al cliente
            if (event.source) {
                event.source.postMessage({
                    type: 'BACKGROUND_UPDATE',
                    data: navigationData
                });
            }
            break;
    }
});

// Evento de sincronización en segundo plano
self.addEventListener('sync', event => {
    if (event.tag === 'sync-navigation-data') {
        console.log('[Service Worker] Sincronizando datos de navegación...');
        
        // Aquí se pueden implementar operaciones de sincronización
        // como enviar datos a un servidor
    }
});

// Evento de notificación al hacer clic
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        self.clients.openWindow('/index.html')
    );
});

console.log('[Service Worker] Service Worker cargado correctamente');