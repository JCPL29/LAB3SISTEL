document.addEventListener("DOMContentLoaded", function() {
    var user = document.getElementById("user");
    
    // Definir las coordenadas específicas
    var newX = 279; // Nueva coordenada X en píxeles
    var newY = 120; // Nueva coordenada Y en píxeles
    
    // Mover el usuario a las coordenadas específicas
    user.style.left = newX + "px";
    user.style.top = newY + "px";
});
