// __tests__/script.test.js

// Use fake timers to control timeouts in script.js
jest.useFakeTimers();

// Prepare a minimal global tmi mock before loading the script so it won't attempt real connections
global.tmi = {
  Client: function () {
    return {
      connect: () => Promise.resolve(),
      on: () => {}
    };
  }
};

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '<div id="avatar-container"></div>';
  // Clear any globals that may persist between tests
  delete global.window.__TEST_LOADED_SCRIPT__;
  // Reset module registry so requiring the script re-runs its top-level code each test
  jest.resetModules();
});

test('script creates avatar for initial user and exposes API', async () => {
  // Load the script (it runs on load)
  require('../script.js');

  // The script calls handleNewMessage('hejnaluk') on load, which should create an avatar
  const container = document.getElementById('avatar-container');
  expect(container).not.toBeNull();
  expect(container.children.length).toBeGreaterThanOrEqual(1);

  // setUserDirection should be exposed and return true for existing user
  expect(typeof window.setUserDirection).toBe('function');
  const result = window.setUserDirection('hejnaluk', 'right');
  expect(result).toBe(true);

  // Find the avatar element for hejnaluk
  const avatars = Array.from(document.querySelectorAll('.chat-avatar'));
  const avatar = avatars.find(a => a.querySelector('span') && a.querySelector('span').textContent === 'hejnaluk');
  expect(avatar).toBeDefined();
});

test('startUserWalking sets walking class and reverts after duration', () => {
  require('../script.js');

  // Start walking for a short duration
  const ok = window.startUserWalking('hejnaluk', 50);
  expect(ok).toBe(true);

  // Avatar should have is-walking class immediately
  const avatar = Array.from(document.querySelectorAll('.chat-avatar')).find(a => a.querySelector('span').textContent === 'hejnaluk');
  expect(avatar.classList.contains('is-walking')).toBe(true);

  // Fast-forward timers past the walk duration
  jest.advanceTimersByTime(60);

  // Now the avatar should be idle
  expect(avatar.classList.contains('idle')).toBe(true);
  expect(avatar.classList.contains('is-walking')).toBe(false);
});
