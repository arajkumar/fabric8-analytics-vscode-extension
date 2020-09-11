import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';
import { join } from 'path';

async function setupCoverage() {
  const NYC = require('nyc');
  const { loadNycConfig } = require('@istanbuljs/load-nyc-config');
  const config = await loadNycConfig();
  const nyc = new NYC(config);
  nyc.reset();
  nyc.wrap();

  return nyc;
}

export async function run(testsRoot: string): Promise<void> {
  const nyc = await setupCoverage();
	const mocha = new Mocha({
		ui: 'tdd',
		useColors: true,
		timeout: 1 * 60 * 1000, /*ms*/
	});
  const sourceRoot = join(
    testsRoot,
    "..",
    "src"
  );
  // Glob source files
  const srcFiles = glob.sync('**/**.js', {
    cwd: sourceRoot,
  });

  // Create a match function - taken from the run-with-cover.js in istanbul.
  const decache = require('decache');
  const fileMap: any = {};
  srcFiles.forEach(file => {
    const fullPath = join(sourceRoot, file);
    fileMap[fullPath] = true;

    // On Windows, extension is loaded pre-test hooks and this mean we lose
    // our chance to hook the Require call. In order to instrument the code
    // we have to decache the JS file so on next load it gets instrumented.
    // This doesn't impact tests, but is a concern if we had some integration
    // tests that relied on VSCode accessing our module since there could be
    // some shared global state that we lose.
    decache(fullPath);
  });

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				e(err);
			} finally {
        if (nyc) {
          nyc.writeCoverageFile();
          nyc.report();
        }
      }
		});
	});
}
