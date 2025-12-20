// script.js

// Provide a factory so the logic can be unit-tested with injected dependencies.
function createUserPresence(deps = {}) {
    const {
        channelName = 'hejnaluk',
        DEBUG = true,
        tmi = (typeof global !== 'undefined' && global.tmi) || (typeof window !== 'undefined' && window.tmi),
        document: doc = (typeof document !== 'undefined' ? document : undefined),
        window: win = (typeof window !== 'undefined' ? window : undefined),
        autoStart = true
    } = deps;

    function log(...args) {
        if (!DEBUG) return;
        // guard for environments without console
        if (typeof console !== 'undefined' && console.log) console.log('[user-presence]', ...args);
    }

    // This will store user data
    const users = new Map();
    const avatarContainer = doc && doc.getElementById('avatar-container');

    // --- TMI.js Connection ---
    let client;
    if (tmi && typeof tmi.Client === 'function') {
        client = new tmi.Client({
            options: { debug: false },
            connection: { secure: true, reconnect: true },
            channels: [ channelName ]
        });

        client.connect()
            .then(() => log('Connected to Twitch channel', channelName))
            .catch(err => {
                log('connect error', err);
                if (typeof console !== 'undefined' && console.error) console.error(err);
            });

        client.on && client.on('message', (channel, tags, message, self) => {
            if (self) return;
            const username = tags && (tags['display-name'] || tags.username);
            if (!username) return;
            log('message received', { channel, username, message });
            handleNewMessage(username);
        });
    }

    // Dump a compact snapshot of the current internal state (users map)
    function debugState() {
        if (!DEBUG) return;
        const snapshot = {};
        for (const [k, v] of users.entries()) {
            snapshot[k] = {
                direction: v.direction,
                state: v.element.classList.contains('is-walking') ? 'walking' : 'idle',
                hasAuto: !!v._autoBehavior,
                hasAnimationTimeout: !!v.animationTimeout
            };
        }
        log('STATE SNAPSHOT', snapshot);
    }

    // --- Avatar Logic ---
    function handleNewMessage(username) {
        if (!users.has(username)) {
            createAvatar(username);
        }

        const user = users.get(username);
        const avatarElement = user.element;

        log('handleNewMessage', { username, direction: user.direction });

        avatarElement.classList.remove('idle');
        avatarElement.classList.add('is-walking');

        applyAnimationName(avatarElement, user.direction || 'left');

        clearTimeout(user.animationTimeout);
        user.animationTimeout = setTimeout(() => {
            avatarElement.classList.remove('is-walking');
            avatarElement.classList.add('idle');
            applyAnimationName(avatarElement, user.direction || 'left');
            log('returned to idle', { username, direction: user.direction });
        }, 5000);
    }

    function createAvatar(username) {
        if (!doc || !avatarContainer) return null;
        const avatarElement = doc.createElement('div');
        avatarElement.classList.add('chat-avatar', 'idle');

        const randomX = (win && win.innerWidth ? Math.random() * (win.innerWidth - 64) : 0);
        avatarElement.style.left = `${randomX}px`;

        const nameTag = doc.createElement('span');
        nameTag.textContent = username;
        nameTag.style.color = 'white';
        nameTag.style.textShadow = '1px 1px 2px black';
        nameTag.style.position = 'absolute';
        nameTag.style.top = '-15px';
        nameTag.style.width = 'max-content';
        avatarElement.appendChild(nameTag);

        avatarContainer.appendChild(avatarElement);

        log('created avatar', { username, left: avatarElement.style.left });

        users.set(username, {
            element: avatarElement,
            animationTimeout: null,
            direction: 'left'
        });

        applyAnimationName(avatarElement, 'left');
        return avatarElement;
    }

    function applyAnimationName(avatarElement, direction) {
        const isWalking = avatarElement.classList.contains('is-walking');
        const prefix = isWalking ? 'walk-animation' : 'idle-animation';
        const dir = ['left', 'right', 'up', 'down'].includes(direction) ? direction : 'left';
        const animationName = `${prefix}-${dir}`;
        avatarElement.style.animationName = animationName;
        log('applyAnimationName', { animationName, direction, isWalking });
    }

    // Public API
    function setUserDirection(username, direction) {
        const user = users.get(username);
        if (!user) return false;
        user.direction = direction;
        applyAnimationName(user.element, direction);
        log('setUserDirection', { username, direction });
        return true;
    }

    function setAllDirections(direction) {
        for (const [, user] of users.entries()) {
            user.direction = direction;
            applyAnimationName(user.element, direction);
        }
        log('setAllDirections', { direction });
    }

    function setUserState(username, state) {
        const user = users.get(username);
        if (!user) return false;
        const el = user.element;
        clearTimeout(user.animationTimeout);

        if (state === 'walking') {
            el.classList.remove('idle');
            el.classList.add('is-walking');
        } else {
            el.classList.remove('is-walking');
            el.classList.add('idle');
        }
        applyAnimationName(el, user.direction || 'left');
        log('setUserState', { username, state });
        return true;
    }

    function setAllStates(state) {
        for (const [username] of users.entries()) setUserState(username, state);
        log('setAllStates', { state });
    }

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
            log('startUserWalking completed', { username });
        }, duration);
        log('startUserWalking', { username, duration });
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
        log('stopUserWalking', { username });
        return true;
    }

    function startAutoBehavior(username, opts = {}) {
        const user = users.get(username);
        if (!user) return false;
        stopAutoBehavior(username);

        const {
            minInterval = 2000,
            maxInterval = 8000,
            walkChance = 0.5,
            minWalk = 1000,
            maxWalk = 5000
        } = opts;

        const directions = ['left', 'right', 'up', 'down'];

        function randBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

        function scheduleNext() {
            const wait = randBetween(minInterval, maxInterval);
            user.autoTimeout = setTimeout(() => {
                if (!users.has(username)) return;
                const dir = directions[Math.floor(Math.random() * directions.length)];
                user.direction = dir;
                applyAnimationName(user.element, dir);
                const doWalk = Math.random() < walkChance;
                if (doWalk) {
                    const walkDur = randBetween(minWalk, maxWalk);
                    startUserWalking(username, walkDur);
                } else {
                    stopUserWalking(username);
                }
                scheduleNext();
            }, wait);
        }

        user._autoBehavior = true;
        log('startAutoBehavior', { username, opts });
        scheduleNext();
        return true;
    }

    function stopAutoBehavior(username) {
        const user = users.get(username);
        if (!user) return false;
        if (user.autoTimeout) {
            clearTimeout(user.autoTimeout);
            user.autoTimeout = null;
        }
        user._autoBehavior = false;
        log('stopAutoBehavior', { username });
        return true;
    }

    function startAllAuto(opts = {}) { for (const [username] of users.entries()) startAutoBehavior(username, opts); log('startAllAuto', { opts }); }
    function stopAllAuto() { for (const [username] of users.entries()) stopAutoBehavior(username); log('stopAllAuto'); }

    // Expose to provided window for external usage (backwards compatible)
    if (win) {
        win.setUserDirection = setUserDirection;
        win.setAllDirections = setAllDirections;
        win.setUserState = setUserState;
        win.setAllStates = setAllStates;
        win.startUserWalking = startUserWalking;
        win.stopUserWalking = stopUserWalking;
        win.startAutoBehavior = startAutoBehavior;
        win.stopAutoBehavior = stopAutoBehavior;
        win.startAllAuto = startAllAuto;
        win.stopAllAuto = stopAllAuto;
    }

    // Optionally run initial actions to match former top-level behavior
    if (autoStart) {
        // create an initial user to match previous script behavior
        handleNewMessage(channelName);
        setUserDirection(channelName, 'down');
        startAutoBehavior(channelName);
    }

    return {
        // internals useful for tests
        users,
        createAvatar,
        handleNewMessage,
        setUserDirection,
        setAllDirections,
        setUserState,
        setAllStates,
        startUserWalking,
        stopUserWalking,
        startAutoBehavior,
        stopAutoBehavior,
        startAllAuto,
        stopAllAuto,
        debugState,
        client
    };
}

// Backwards-compatible default initialization when script is included normally in a browser
const defaultInstance = createUserPresence({});

// Export for CommonJS tests and modules
if (typeof module !== 'undefined' && module.exports) module.exports = createUserPresence;