import type { Ora, Options, PersistOptions } from 'ora';

let oraPromise: Promise<typeof import('ora')> | null = null;

export async function createSpinner(text: string): Promise<Ora> {
  if (!oraPromise) {
    oraPromise = import('ora');
  }

  try {
    const oraModule = await oraPromise;
    const spinner = oraModule.default({
      text,
      color: 'blue',
      spinner: 'dots'
    } as Options);

    return spinner;
  } catch (error) {
    // Fallback spinner implementing the full Ora interface
    const fallbackSpinner: Ora = {
      text,
      prefixText: '',
      suffixText: '',
      color: 'blue' as const,
      indent: 0,
      spinner: { interval: 80, frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] },
      isSpinning: false,
      start(text?: string) {
        this.text = text ?? this.text;
        console.log(`${this.text}...`);
        return this;
      },
      stop() {
        return this;
      },
      succeed(text?: string) {
        console.log(`✓ ${text || this.text}`);
        return this;
      },
      fail(text?: string) {
        console.error(`✗ ${text || this.text}`);
        return this;
      },
      warn(text?: string) {
        console.warn(`⚠ ${text || this.text}`);
        return this;
      },
      info(text?: string) {
        console.info(`ℹ ${text || this.text}`);
        return this;
      },
      clear() {
        return this;
      },
      render() {
        return this;
      },
      frame() {
        return '';
      },
      interval: 0,
      stopAndPersist: function(options?: PersistOptions): Ora {
        console.log(`${options?.symbol || '⚡'} ${options?.text || this.text}`);
        return this;
      }
    };

    return fallbackSpinner;
  }
} 