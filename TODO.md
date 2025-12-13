### Phase 1: Project Setup & Frontend Foundation

-   [x] **Create Project Directory & Files**
    -   [x] Create a new folder named `user-presence`.
    -   [x] Inside `user-presence`, create the following files:
        -   `index.html`
        -   `style.css`
        -   `script.js`
    -   [x] Create a sub-folder named `assets` for your images.

-   [x] **Populate `index.html`**
    -   [x] Open `index.html` and add the following boilerplate code. This sets up the page, links the other files, and includes the `tmi.js` library from a CDN.

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Twitch Chat Avatars</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <div id="avatar-container"></div>

        <!-- tmi.js library for Twitch integration -->
        <script src="https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js"></script>
        <!-- Your application logic -->
        <script src="script.js"></script>
    </body>
    </html>
    ```

-   [x] **Populate `style.css`**
    -   [x] Open `style.css` and add the initial styles. This makes the background transparent and sets up the container where avatars will live.

    ```css
    /* Make the entire page transparent for the OBS overlay */
    body, html {
        background-color: transparent;
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden; /* Hide scrollbars */
    }

    /* This container will hold all the avatars */
    #avatar-container {
        position: relative;
        width: 100%;
        height: 100%;
    }
    ```

-   [x] **Setup Local Web Server**
    -   [x] Open your terminal or command prompt.
    -   [x] Make sure you have Node.js installed.
    -   [x] Install the `http-server` package globally by running: `npm install --global http-server`
    -   [x] Navigate into your `user-presence` project directory: `cd path/to/user-presence`
    -   [x] Start the server: `http-server`
    -   [x] You can now access your project at `http://localhost:8080` in your browser. Keep this server running while you develop.

### Phase 2: Twitch Integration

-   [ ] **Configure `script.js` for Twitch Connection**
    -   [ ] Open `script.js` and add the following code. This will connect to a Twitch channel and log chat messages to the browser's developer console.
    -   [ ] **Important:** Change `'your_channel_name'` to the name of the Twitch channel you want to connect to.
    [tmi.js](https://tmijs.com/)

    ```javascript
    // script.js

    // Configuration - CHANGE THIS
    const channelName = 'hejnaluk';

    // This will store user data, like a reference to their avatar element
    const users = new Map();

    // Connect to Twitch chat
    const client = new tmi.Client({
        options: { debug: false }, // Set to true for more logs
        connection: {
            secure: true,
            reconnect: true
        },
        channels: [ channelName ]
    });

    client.connect().catch(console.error);

    // Listen for new messages
    client.on('message', (channel, tags, message, self) => {
        if (self) return; // Ignore messages from the bot itself

        const username = tags['display-name'] || tags.username;

        // For now, just log the message to the console to test
        console.log(`${username}: ${message}`);

        // TODO: Call avatar functions here
    });
    ```
-   [ ] **Test the Connection**
    -   [ ] Save `script.js`.
    -   [ ] Open `http://localhost:8080` in your browser and open the Developer Console (F12 or Ctrl+Shift+I).
    -   [ ] Go to the Twitch channel you specified and type a message in chat.
    -   [ ] You should see the message appear in your browser's console.

### Phase 3: Avatar Logic & Animation

-   [ ] **Get Character Assets**
    -   [x] Create or download a simple pixel art character sprite sheet. For a start, a 64x32 pixel image where the first 32x32 is the "idle" frame and the second 32x32 is the "talking" frame is perfect.
    -   [x] Save it as `character.png` inside your `assets` folder.
    -  [ ] [Universal-LPC-Spritesheet-Character-Generator](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/#sex=male&body=Body_color_amber&head=Human_male_amber&expression=Neutral_amber&hair=Plain_ash&clothes=Sleeveless_bluegray&legs=Long_Pants_black&shoes=Basic_Shoes_bluegray&weapon=Smash_pickaxe) to generate spritesheet

-   [ ] **Add Avatar Styles to `style.css`**
    -   [ ] Add the CSS for the avatars themselves. This defines their size, position, and sets up the sprite sheet.

    ```css
    /* Add this to style.css */
    .chat-avatar {
        width: 32px;
        height: 32px;
        background-image: url('assets/character.png');
        background-size: 64px 32px; /* The full size of the sprite sheet */
        background-position: 0 0; /* Start on the first frame (idle) */
        position: absolute; /* Allows us to position it freely */
        bottom: 10px; /* Start at the bottom of the screen */
        transition: transform 0.5s ease-out; /* Smooth movement */
    }

    .chat-avatar.is-talking {
        /* Animate between idle and talking frames */
        animation: talk-animation 0.2s steps(1) infinite;
    }

    @keyframes talk-animation {
        from { background-position: 0 0; }
        to { background-position: -32px 0; } /* Move to the second frame */
    }
    ```

-   [ ] **Implement Avatar Spawning in `script.js`**
    -   [ ] Create a function to spawn avatars and handle their state. Replace the `// TODO:` section with the real logic.

    ```javascript
    // Add these functions to script.js

    const avatarContainer = document.getElementById('avatar-container');

    function handleNewMessage(username) {
        // If user doesn't exist, create them
        if (!users.has(username)) {
            createAvatar(username);
        }

        const user = users.get(username);
        const avatarElement = user.element;

        // Trigger talking animation
        avatarElement.classList.add('is-talking');

        // Stop talking after a delay
        clearTimeout(user.talkTimeout); // Clear previous timeout if they chat again quickly
        user.talkTimeout = setTimeout(() => {
            avatarElement.classList.remove('is-talking');
        }, 3000); // Talk for 3 seconds
    }

    function createAvatar(username) {
        const avatarElement = document.createElement('div');
        avatarElement.classList.add('chat-avatar');

        // Set a random horizontal starting position
        const randomX = Math.random() * (window.innerWidth - 32); // -32 to keep it from going off-screen
        avatarElement.style.left = `${randomX}px`;

        // Add a name tag (optional but recommended)
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
            talkTimeout: null
        });
    }

    // Now, update the tmi.js message listener
    client.on('message', (channel, tags, message, self) => {
        if (self) return;
        const username = tags['display-name'] || tags.username;
        
        // This is the new part
        handleNewMessage(username);
    });
    ```

-   [ ] **Test Avatar Spawning**
    -   [ ] Save all your files. Your local server should auto-reload.
    -   [ ] Go back to `http://localhost:8080`.
    -   [ ] Type in the Twitch chat. An avatar with your name should appear at the bottom of the screen and animate.

### Phase 4: Deployment & OBS Integration

-   [ ] **Deploy Your Application**
    -   [ ] Choose a hosting service. **GitHub Pages** is a great free option.
        -   [ ] Create a new public repository on GitHub.
        -   [ ] Upload your `index.html`, `style.css`, `script.js`, and the `assets` folder.
        -   [ ] In the repository settings, go to the "Pages" section.
        -   [ ] Select the `main` branch as the source and click "Save".
        -   [ ] GitHub will give you a public URL (e.g., `https://your-username.github.io/user-presence/`).

-   [ ] **Add to OBS**
    -   [ ] Copy the public URL from your hosting provider.
    -   [ ] In OBS, go to the "Sources" panel and click the `+` button.
    -   [ ] Select "Browser".
    -   [ ] Give it a name (e.g., "Chat Avatars").
    -   [ ] In the properties window:
        -   Paste your URL into the "URL" field.
        -   Set "Width" to `1920` and "Height" to `1080` (or your stream resolution).
        -   Click "OK".
    -   [ ] Your avatars should now appear as an overlay on your stream preview.