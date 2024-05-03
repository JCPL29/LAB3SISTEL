// Conectar al servidor WebSocket
const socket = io();

// Obtener referencia al punto
const point = document.getElementById('point');

// Escuchar actualizaciones de posición desde el servidor
socket.on('positionUpdate', (data) => {
    const { x, y } = data;
    // Actualizar la posición del punto en el cuadrado
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;
});
