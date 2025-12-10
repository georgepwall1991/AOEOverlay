# WebdriverIO Tests for AOE4 Overlay

This directory contains WebdriverIO tests for the native Tauri application using the WebDriver protocol.

## What These Tests Do

WebdriverIO tests interact with the **native desktop application** through the WebDriver protocol using `tauri-driver`. These tests:

- Launch the actual compiled Tauri application
- Test native window behavior, menus, and system integrations
- Verify the application works correctly as a native desktop app
- Complement Playwright tests by testing the final bundled application

## Platform Support

**⚠️ Important:** WebDriver testing for desktop Tauri apps is **only supported on Windows and Linux**.

- ✅ **Windows** - Fully supported
- ✅ **Linux** - Fully supported
- ❌ **macOS** - Not supported (Tauri limitation for WebDriver on desktop)

For cross-platform testing including macOS, use the Playwright tests in `../playwright/` instead.

## Prerequisites

### 1. Install tauri-driver

You must have `tauri-driver` installed on your system:

```bash
cargo install tauri-driver
```

Verify installation:

```bash
tauri-driver --version
```

### 2. Build the Tauri Application

The tests require a compiled debug build of the application:

```bash
# From the project root
cd src-tauri
cargo build
```

This will create the application binary at:
- **Windows:** `src-tauri/target/debug/aoe4-overlay.exe`
- **Linux:** `src-tauri/target/debug/aoe4-overlay`

### 3. Install Node Dependencies

```bash
# From this directory
npm install
```

## Running Tests Locally

### Run all tests

```bash
npm test
```

### Run specific test file

```bash
npx wdio run wdio.conf.js --spec ./specs/example.spec.js
```

## Writing Tests

Create test files in the `specs/` directory with the `.spec.js` extension.

Example test structure:

```javascript
describe('AOE4 Overlay Application', () => {
  it('should launch the application', async () => {
    // Get the main window
    const windows = await browser.getWindowHandles();
    expect(windows.length).toBeGreaterThan(0);
  });

  it('should have the correct title', async () => {
    const title = await browser.getTitle();
    expect(title).toContain('AOE4 Overlay');
  });

  it('should display main UI elements', async () => {
    const heading = await $('h1');
    await heading.waitForDisplayed({ timeout: 5000 });
    expect(await heading.getText()).toBeTruthy();
  });
});
```

## CI Usage

The GitHub Actions workflow should:

1. **Skip on macOS runners** - These tests cannot run on macOS
2. **Install tauri-driver** on Windows/Linux runners:
   ```yaml
   - name: Install tauri-driver
     if: runner.os != 'macOS'
     run: cargo install tauri-driver
   ```
3. **Build the Tauri app** before running tests:
   ```yaml
   - name: Build Tauri app
     if: runner.os != 'macOS'
     run: |
       cd src-tauri
       cargo build
   ```
4. **Run tests** only on supported platforms:
   ```yaml
   - name: Run WebdriverIO tests
     if: runner.os != 'macOS'
     run: |
       cd tests/e2e/webdriver
       npm install
       npm test
   ```

## Configuration

The WebdriverIO configuration (`wdio.conf.js`) handles:

- ✅ Automatic platform detection
- ✅ Correct application path for Windows/Linux
- ✅ Automatic startup/shutdown of tauri-driver
- ✅ macOS detection and error throwing
- ✅ 60-second timeout for tests
- ✅ Spec reporter for clear output

## Troubleshooting

### "tauri-driver: command not found"

Make sure `tauri-driver` is installed and in your PATH:

```bash
cargo install tauri-driver
```

### "Application not found"

Ensure you've built the Tauri application:

```bash
cd src-tauri
cargo build
```

### "Platform not supported" on macOS

This is expected. Use Playwright tests for macOS testing instead.

### Tests timeout

If tests are timing out, you may need to:
1. Increase the timeout in `wdio.conf.js` (`mochaOpts.timeout`)
2. Check if the application is building correctly
3. Verify tauri-driver is running (`ps aux | grep tauri-driver`)

## Relationship to Other Tests

The AOE4 Overlay project uses multiple testing strategies:

1. **Unit Tests** (`src/`) - Component and function tests with Vitest
2. **Playwright Tests** (`tests/e2e/playwright/`) - Cross-platform browser-based tests (including macOS)
3. **WebdriverIO Tests** (this directory) - Native app tests on Windows/Linux only

Each test type serves a different purpose and they complement each other for comprehensive coverage.

## Resources

- [WebdriverIO Documentation](https://webdriver.io/docs/gettingstarted)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/webdriver/introduction)
- [tauri-driver Documentation](https://github.com/tauri-apps/tauri/tree/dev/tooling/webdriver)
