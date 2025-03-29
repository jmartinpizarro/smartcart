document.addEventListener('DOMContentLoaded', function() {
    // Map dimensions
    const mapWidth = 600;
    const mapHeight = 400;
    
    // Initial user position (center of the map)
    let userPosition = {
        x: 10,
        y: 390
    };
    
    // Step size in pixels
    const stepSize = 10;
    
    // Get DOM elements
    const userDot = document.getElementById('user-dot');
    const positionDisplay = document.getElementById('position-display');
    const supermarketMap = document.getElementById('supermarket-map');
    
    // Array to store shelf boundaries for collision detection
    const obstacles = [];
    
    // Create supermarket aisles (that will act as obstacles)
    function createAisles() {
        // Horizontal aisles
        for (let i = 0; i < 3; i++) {
            const aisle = document.createElement('div');
            aisle.className = 'aisle';
            aisle.style.width = '480px';
            aisle.style.height = '30px';
            const leftPos = 60;
            const topPos = 100 + i * 100;
            aisle.style.left = leftPos + 'px';
            aisle.style.top = topPos + 'px';
            supermarketMap.appendChild(aisle);
            
            // Store obstacle boundaries (x1, y1, x2, y2)
            obstacles.push({
                x1: leftPos,
                y1: topPos,
                x2: leftPos + 480,
                y2: topPos + 30
            });
        }
    }
    
    // Check if a position would collide with any obstacle
    function isColliding(x, y) {
        const dotRadius = 7.5; // Half of the dot's size
        
        for (const obstacle of obstacles) {
            if (x + dotRadius > obstacle.x1 && 
                x - dotRadius < obstacle.x2 && 
                y + dotRadius > obstacle.y1 && 
                y - dotRadius < obstacle.y2) {
                return true;
            }
        }
        return false;
    }
    
    // Update user position on the map
    function updateUserPosition() {
        userDot.style.left = (userPosition.x - 7.5) + 'px';
        userDot.style.top = (userPosition.y - 7.5) + 'px';
        positionDisplay.textContent = `(${Math.round(userPosition.x)}, ${Math.round(userPosition.y)})`;
    }
    
    // Move the user dot with obstacle detection
    function moveUser(dx, dy) {
        // Calculate new position
        const newX = userPosition.x + dx;
        const newY = userPosition.y + dy;
        
        // Check map boundaries first
        if (newX < 10 || newX > mapWidth - 10 || 
            newY < 10 || newY > mapHeight - 10) {
            return; // Don't move outside map
        }
        
        // Check for collisions with obstacles
        if (!isColliding(newX, newY)) {
            userPosition.x = newX;
            userPosition.y = newY;
            updateUserPosition();
        }
    }
    
    // Initialize the map
    function init() {
        createAisles();
        updateUserPosition();
        
        // Add event listeners for buttons
        document.getElementById('step-left').addEventListener('click', () => moveUser(-stepSize, 0));
        document.getElementById('step-right').addEventListener('click', () => moveUser(stepSize, 0));
        document.getElementById('step-up').addEventListener('click', () => moveUser(0, -stepSize));
        document.getElementById('step-down').addEventListener('click', () => moveUser(0, stepSize));
        
        // Add keyboard controls for easier testing
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': moveUser(-stepSize, 0); break;
                case 'ArrowRight': moveUser(stepSize, 0); break;
                case 'ArrowUp': moveUser(0, -stepSize); break;
                case 'ArrowDown': moveUser(0, stepSize); break;
            }
        });
    }
    
    init();
});