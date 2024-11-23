import { createSpinner as createNanoSpinner } from 'nanospinner';

interface CustomSpinner {
  start(): CustomSpinner;
  stop(): CustomSpinner;
  succeed(text?: string): CustomSpinner;
  fail(text?: string): CustomSpinner;
  text: string;
}

export async function createSpinner(initialText: string): Promise<CustomSpinner> {
  const spinner = createNanoSpinner(initialText, {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
    color: 'cyan'
  });

  // Keep track of current text
  let currentText = initialText;

  const customSpinner: CustomSpinner = {
    start() {
      spinner.start();
      return customSpinner;
    },
    stop() {
      spinner.stop();
      return customSpinner;
    },
    succeed(text?: string) {
      const finalText = text || currentText;
      spinner.success({ text: finalText });
      currentText = finalText;
      return customSpinner;
    },
    fail(text?: string) {
      const finalText = text || currentText;
      spinner.error({ text: finalText });
      currentText = finalText;
      return customSpinner;
    },
    set text(value: string) {
      currentText = value;
      spinner.update({ text: value });
    },
    get text(): string {
      return currentText;
    }
  };

  return customSpinner;
} 