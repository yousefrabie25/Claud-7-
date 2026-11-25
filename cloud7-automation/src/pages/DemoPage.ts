import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Cf7Form } from './components/Cf7Form';
import { DEMO_FIELDS, DemoData } from '../data/forms';

export class DemoPage extends BasePage {
  readonly form: Cf7Form;
  readonly demoButtons: Locator;

  constructor(page: Page) {
    super(page, '/demo/');
    this.form = new Cf7Form(page, page.locator('body'));
    this.demoButtons = page.getByRole('link', { name: /book a (live )?demo|view live demo/i });
  }

  async fillDemo(data: Partial<DemoData>): Promise<void> {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      values[DEMO_FIELDS[key as keyof DemoData]] = value as string;
    }
    await this.form.fill(values);
  }
}
