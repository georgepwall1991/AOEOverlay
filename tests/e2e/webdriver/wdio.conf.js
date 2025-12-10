const { platform } = require('os');
const { spawn } = require('child_process');
const kill = require('tree-kill');

// Determine application path based on platform
function getAppPath() {
  const basePath = '../../../src-tauri/target/debug/';

  switch (platform()) {
    case 'win32':
      return basePath + 'aoe4-overlay.exe';
    case 'linux':
      return basePath + 'aoe4-overlay';
    case 'darwin':
      throw new Error('macOS WebDriver testing is not supported for desktop Tauri apps');
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }
}

let tauriDriver;

exports.config = {
  runner: 'local',

  specs: [
    './specs/**/*.spec.js'
  ],

  exclude: [],

  maxInstances: 1,

  // tauri-driver listens on port 4444 by default
  hostname: 'localhost',
  port: 4444,

  capabilities: [{
    maxInstances: 1,
    // Required for WebdriverIO to work with tauri-driver
    browserName: 'wry',
    'tauri:options': {
      application: getAppPath()
    }
  }],

  logLevel: 'info',

  bail: 0,

  baseUrl: 'http://localhost',

  waitforTimeout: 10000,

  connectionRetryTimeout: 120000,

  connectionRetryCount: 3,

  framework: 'mocha',

  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  /**
   * Gets executed once before all workers get launched.
   */
  onPrepare: function (config, capabilities) {
    console.log('Platform:', platform());

    // Verify platform support
    if (platform() === 'darwin') {
      throw new Error(
        'macOS WebDriver testing is not supported for desktop Tauri apps.\n' +
        'Please use Playwright tests instead for cross-platform testing.'
      );
    }

    console.log('Application path:', getAppPath());
  },

  /**
   * Gets executed before a worker process is spawned.
   */
  onWorkerStart: function (cid, caps, specs, args, execArgv) {
    console.log('Starting tauri-driver...');

    // Start tauri-driver process
    tauriDriver = spawn('tauri-driver', [], {
      stdio: 'inherit'
    });

    // Give tauri-driver time to start
    return new Promise(resolve => setTimeout(resolve, 2000));
  },

  /**
   * Gets executed after all workers got shut down and the process is about to exit.
   */
  onComplete: function(exitCode, config, capabilities, results) {
    console.log('Stopping tauri-driver...');

    if (tauriDriver) {
      return new Promise((resolve) => {
        kill(tauriDriver.pid, 'SIGTERM', (err) => {
          if (err) {
            console.error('Error stopping tauri-driver:', err);
          }
          resolve();
        });
      });
    }
  },

  /**
   * Gets executed just before initializing the webdriver session.
   */
  before: function (capabilities, specs) {
    // Additional setup if needed
  },

  /**
   * Gets executed after all tests are done.
   */
  after: function (result, capabilities, specs) {
    // Cleanup if needed
  }
};
