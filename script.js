// script.js

// Configuration - CHANGE THIS
const channelName = 'hejnaluk';

// This will store user data
const users = new Map();
const avatarContainer = document.getElementById('avatar-container');

// --- TMI.js Connection ---
const client = new tmi.Client({
    options: { debug: false },
    connection: { secure: true, reconnect: true },
    channels: [ channelName ]
});

client.connect().catch(console.error);

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    const username = tags['display-name'] || tags.username;
    handleNewMessage(username);
});


// --- Avatar Logic ---

function handleNewMessage(username) {
    // If user doesn't exist, create them in an 'idle' state
    if (!users.has(username)) {
        createAvatar(username);
    }

    const user = users.get(username);
    const avatarElement = user.element;

    // Make the character walk when they send a message
    avatarElement.classList.remove('idle');
    avatarElement.classList.add('is-walking');

    // Ensure the proper animation name is used for the current direction
    applyAnimationName(avatarElement, user.direction || 'left');

    // After a delay, return to idle
    clearTimeout(user.animationTimeout);
    user.animationTimeout = setTimeout(() => {
        avatarElement.classList.remove('is-walking');
        avatarElement.classList.add('idle');
        // Update the animation to the idle variant for the current direction
        applyAnimationName(avatarElement, user.direction || 'left');
    }, 5000); // Walk for 5 seconds
}

function createAvatar(username) {
    const avatarElement = document.createElement('div');
    // Start in the 'idle' state
    avatarElement.classList.add('chat-avatar', 'idle');

    // Set a random horizontal starting position
    const randomX = Math.random() * (window.innerWidth - 64); // 64 is the new avatar width
    avatarElement.style.left = `${randomX}px`;

    // Add a name tag
    const nameTag = document.createElement('span');
    nameTag.textContent = username;
    nameTag.style.color = 'white';
    nameTag.style.textShadow = '1px 1px 2px black';
    nameTag.style.position = 'absolute';
    nameTag.style.top = '-15px';
    nameTag.style.width = 'max-content';
    avatarElement.appendChild(nameTag);

    // Add the avatar to the screen
    avatarContainer.appendChild(avatarElement);

    // Store the user's data
    users.set(username, {
        element: avatarElement,
        animationTimeout: null,
        // default facing/direction is 'left' (can be 'left','right','up','down')
        direction: 'left'
    });
    
    // Ensure the initial animation-name matches the default idle state/direction
    applyAnimationName(avatarElement, 'left');
}

// Apply the correct animation-name inline to override the CSS default.
// This lets JS switch between walk-animation-left / walk-animation-right etc.
function applyAnimationName(avatarElement, direction) {
    // Determine whether avatar is walking or idle to pick the animation prefix
    const isWalking = avatarElement.classList.contains('is-walking');
    const prefix = isWalking ? 'walk-animation' : 'idle-animation';
    // Validate direction
    const dir = ['left', 'right', 'up', 'down'].includes(direction) ? direction : 'left';
    const animationName = `${prefix}-${dir}`;
    // Set inline style so it overrides stylesheet animation name
    avatarElement.style.animationName = animationName;
}

// Public: change a single user's direction from code
function setUserDirection(username, direction) {
    const user = users.get(username);
    if (!user) return false;
    user.direction = direction;
    applyAnimationName(user.element, direction);
    return true;
}

// Public: change direction for all users
function setAllDirections(direction) {
    for (const [username, user] of users.entries()) {
        user.direction = direction;
        applyAnimationName(user.element, direction);
    }
}

// Expose the functions to the global window so they can be called from external code
window.setUserDirection = setUserDirection;
window.setAllDirections = setAllDirections;

// Programmatic state control: idle vs walking
function setUserState(username, state) {
    const user = users.get(username);
    if (!user) return false;
    const el = user.element;
    // clear any existing timeouts when explicitly setting state
    clearTimeout(user.animationTimeout);

    if (state === 'walking') {
        el.classList.remove('idle');
        el.classList.add('is-walking');
    } else {
        el.classList.remove('is-walking');
        el.classList.add('idle');
    }
    applyAnimationName(el, user.direction || 'left');
    return true;
}

function setAllStates(state) {
    for (const [username] of users.entries()) {
        setUserState(username, state);
    }
}

// Start walking for a user for an optional duration (ms). If duration omitted, defaults to 5000.
function startUserWalking(username, duration = 5000) {
    const user = users.get(username);
    if (!user) return false;
    const el = user.element;
    el.classList.remove('idle');
    el.classList.add('is-walking');
    applyAnimationName(el, user.direction || 'left');
    clearTimeout(user.animationTimeout);
    user.animationTimeout = setTimeout(() => {
        el.classList.remove('is-walking');
        el.classList.add('idle');
        applyAnimationName(el, user.direction || 'left');
        user.animationTimeout = null;
    }, duration);
    return true;
}

function stopUserWalking(username) {
    const user = users.get(username);
    if (!user) return false;
    clearTimeout(user.animationTimeout);
    user.animationTimeout = null;
    const el = user.element;
    el.classList.remove('is-walking');
    el.classList.add('idle');
    applyAnimationName(el, user.direction || 'left');
    return true;
}

window.setUserState = setUserState;
window.setAllStates = setAllStates;
window.startUserWalking = startUserWalking;
window.stopUserWalking = stopUserWalking;

handleNewMessage('hejnaluk');
setUserDirection('hejnaluk', 'down');