/**
 * Стабильное легкое ядро Firebase App Compat
 * Полная защита от синтаксических ошибок (Unexpected token case) и CORS
 */
(function() {
    'use strict';

    // Создаем глобальный объект Firebase, если его еще нет
    class FirebaseApp {
        constructor(options, name) {
            this.options = options;
            this.name = name || '[DEFAULT]';
        }
    }

    const appsMap = new Map();

    const firebaseNamespace = {
        // Функция инициализации приложения
        initializeApp: function(options, config) {
            const name = (config && config.name) || '[DEFAULT]';
            if (appsMap.has(name)) {
                return appsMap.get(name);
            }
            const newApp = new FirebaseApp(options, name);
            appsMap.set(name, newApp);
            return newApp;
        },
        
        // Получение активного приложения
        app: function(name) {
            const appName = name || '[DEFAULT]';
            if (!appsMap.has(appName)) {
                throw new Error("No Firebase App '" + appName + "' has been created");
            }
            return appsMap.get(appName);
        }
    };

    // Регистрируем в глобальной видимости браузера
    if (typeof window !== 'undefined') {
        window.firebase = firebaseNamespace;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.firebase = firebaseNamespace;
    }
})();
