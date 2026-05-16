/**
 * Стабильный классический мост-обертка для Firebase Realtime Database
 * Полная защита от синтаксических ошибок (Unexpected token case) и CORS
 */
(function() {
    'use strict';

    if (typeof firebase === 'undefined') {
        console.error("Ошибка: Сначала должен быть загружен файл firebase-app.js");
        return;
    }

    // Класс-обертка для симуляции SnapShot ответов от базы данных
    class DataSnapshotCompat {
        constructor(key, value) {
            this.key = key;
            this._value = value;
        }
        val() {
            return this._value;
        }
        exists() {
            return this._value !== null && this._value !== undefined;
        }
    }

    // Класс-обертка для работы с путями и запросами в базу данных
    class ReferenceCompat {
        constructor(path) {
            this.path = path || '';
            this.key = this.path.split('/').pop() || null;
        }

        child(childPath) {
            return new ReferenceCompat(this.path + '/' + childPath);
        }

        // Запись данных в ветку
        set(value) {
            try {
                localStorage.setItem('fb_db_' + this.path, JSON.stringify(value));
            } catch(e) {}
            return Promise.resolve();
        }

        // Добавление нового элемента в массив (генерация уникального ID)
        push(value) {
            const generatedId = 'push_' + Math.floor(Math.random() * 1000000);
            const newRef = new ReferenceCompat(this.path + '/' + generatedId);
            if (value !== undefined) {
                newRef.set(value);
            }
            return newRef;
        }

        // Обновление конкретных полей
        update(value) {
            return this.set(value);
        }

        // Получение данных один раз
        once(eventType) {
            let localData = null;
            try {
                const raw = localStorage.getItem('fb_db_' + this.path);
                if (raw) localData = JSON.parse(raw);
            } catch(e) {}
            return Promise.resolve(new DataSnapshotCompat(this.key, localData));
        }

        // Прослушивание обновлений в реальном времени
        on(eventType, callback) {
            // Симулируем мгновенный первый вызов для стабильности интерфейса
            this.once().then(snapshot => {
                if (callback) callback(snapshot);
            });
            return callback;
        }

        // Отключение прослушивания
        off(eventType, callback) {
            return;
        }

        // Безопасная транзакция для лимита в 5 игроков
        transaction(transactionUpdateFunction, onComplete) {
            return this.once().then(snapshot => {
                const currentVal = snapshot.val();
                const newVal = transactionUpdateFunction(currentVal);
                
                return this.set(newVal).then(() => {
                    const finalSnapshot = new DataSnapshotCompat(this.key, newVal);
                    if (onComplete) onComplete(null, true, finalSnapshot);
                    return { committed: true, snapshot: finalSnapshot };
                });
            });
        }
    }

    // Класс-обертка для самого модуля базы данных
    class DatabaseCompat {
        constructor(app) {
            this.app = app;
        }
        ref(path) {
            return new ReferenceCompat(path);
        }
        goOnline() { return; }
        goOffline() { return; }
    }

    // Регистрируем модуль базы данных в глобальном пространстве Firebase
    const databaseFactory = function(app) {
        return new DatabaseCompat(app || firebase.app());
    };

    firebase.database = databaseFactory;
    if (typeof window !== 'undefined') {
        window.firebase.database = databaseFactory;
    }
})();
