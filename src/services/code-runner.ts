export interface ExecutionResult {
  output: string[];
  errors: string[];
  executionTimeMs: number;
  success: boolean;
}

/**
 * Sandboxed in-browser JS/TS evaluator.
 * Runs code within an isolated iframe context and intercepts console streams.
 */
export async function runSandboxedCode(
  code: string,
  timeoutMs: number = 3000
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const outputs: string[] = [];
  const errors: string[] = [];

  return new Promise((resolve) => {
    // Create sandboxed iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts');

    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({
          output: outputs,
          errors: [`Execution timed out after ${timeoutMs}ms`],
          executionTimeMs: performance.now() - startTime,
          success: false,
        });
      }
    }, timeoutMs);

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SANDBOX_RUNNER_LOG') {
        outputs.push(event.data.message);
      } else if (event.data && event.data.type === 'SANDBOX_RUNNER_ERROR') {
        errors.push(event.data.message);
      } else if (event.data && event.data.type === 'SANDBOX_RUNNER_DONE') {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            output: outputs,
            errors,
            executionTimeMs: performance.now() - startTime,
            success: errors.length === 0,
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const scriptPayload = `
      <script>
        const post = (type, message) => {
          try {
            window.parent.postMessage({ type, message: String(message) }, '*');
          } catch(e) {}
        };

        console.log = (...args) => post('SANDBOX_RUNNER_LOG', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
        console.info = console.log;
        console.warn = (...args) => post('SANDBOX_RUNNER_LOG', '[WARN] ' + args.join(' '));
        console.error = (...args) => post('SANDBOX_RUNNER_ERROR', args.join(' '));

        window.onerror = (msg, url, line) => {
          post('SANDBOX_RUNNER_ERROR', msg + ' (line ' + line + ')');
          post('SANDBOX_RUNNER_DONE', true);
        };

        try {
          const run = new Function(${JSON.stringify(code)});
          const res = run();
          if (res !== undefined) {
            console.log(res);
          }
          post('SANDBOX_RUNNER_DONE', true);
        } catch (err) {
          post('SANDBOX_RUNNER_ERROR', err.toString());
          post('SANDBOX_RUNNER_DONE', true);
        }
      </script>
    `;

    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(scriptPayload);
      doc.close();
    } else {
      cleanup();
      resolve({
        output: [],
        errors: ['Could not initialize sandboxed execution context'],
        executionTimeMs: 0,
        success: false,
      });
    }
  });
}
