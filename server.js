const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Manejar la conexión de clientes WebSocket
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Manejar actualizaciones de posición recibidas del cliente
    socket.on('positionUpdate', (data) => {
        // Emitir la actualización de posición a todos los clientes conectados
        io.emit('positionUpdate', data);
    });

    // Manejar la desconexión de clientes WebSocket
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);
});
