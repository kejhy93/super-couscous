// script.js

// Configuration - CHANGE THIS
const channelName = 'liveoliverr';

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

    // After a delay, return to idle
    clearTimeout(user.animationTimeout);
    user.animationTimeout = setTimeout(() => {
        avatarElement.classList.remove('is-walking');
        avatarElement.classList.add('idle');
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
        animationTimeout: null
    });
}