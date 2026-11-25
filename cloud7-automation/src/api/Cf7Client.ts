import { APIRequestContext, APIResponse } from '@playwright/test';
import { fieldName } from '../pages/components/Cf7Form';

export interface Cf7FormMeta {
  id: string;
  unitTag: string;
  containerPost: string;
  version: string;
  locale: string;
}

export interface Cf7Response {
  http: number;
  status?: string;
  message?: string;
  code?: string;
  invalidFields: string[];
  raw: unknown;
}

/** Client for the Contact Form 7 REST endpoint used by the demo and contact forms. */
export class Cf7Client {
  constructor(private readonly request: APIRequestContext) {}

  static feedbackPath(formId: string): string {
    return `/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`;
  }

  /** Reads the form's hidden CF7 inputs from a page, so IDs never go stale. */
  async discover(pagePath: string): Promise<Cf7FormMeta> {
    const html = await (await this.request.get(pagePath)).text();
    const hidden = (name: string) =>
      html.match(new RegExp(`name="${name}"\\s+value="([^"]*)"`))?.[1] ??
      html.match(new RegExp(`value="([^"]*)"\\s+name="${name}"`))?.[1] ??
      '';
    const meta = {
      id: hidden('_wpcf7'),
      unitTag: hidden('_wpcf7_unit_tag'),
      containerPost: hidden('_wpcf7_container_post'),
      version: hidden('_wpcf7_version'),
      locale: hidden('_wpcf7_locale') || 'en_US',
    };
    if (!meta.id || !meta.unitTag) throw new Error(`No Contact Form 7 form found on ${pagePath}`);
    return meta;
  }

  async submit(
    form: Cf7FormMeta,
    fields: Record<string, string>,
    opts: { recaptchaToken?: string; formIdOverride?: string } = {},
  ): Promise<Cf7Response> {
    const multipart: Record<string, string> = {
      _wpcf7: opts.formIdOverride ?? form.id,
      _wpcf7_version: form.version,
      _wpcf7_locale: form.locale,
      _wpcf7_unit_tag: form.unitTag,
      _wpcf7_container_post: form.containerPost,
      ...fields,
    };
    if (opts.recaptchaToken) {
      // CF7 Simple Recaptcha (v2) reads g-recaptcha-response; CF7's own v3 integration reads the other.
      multipart['g-recaptcha-response'] = opts.recaptchaToken;
      multipart._wpcf7_recaptcha_response = opts.recaptchaToken;
    }
    const res = await this.request.post(Cf7Client.feedbackPath(opts.formIdOverride ?? form.id), { multipart });
    return Cf7Client.parse(res);
  }

  static async parse(res: APIResponse): Promise<Cf7Response> {
    const raw = (await res.json().catch(() => null)) as {
      status?: string;
      message?: string;
      code?: string;
      invalid_fields?: Array<{ field?: string; into?: string }>;
    } | null;
    return {
      http: res.status(),
      status: raw?.status,
      message: raw?.message,
      code: raw?.code,
      invalidFields: (raw?.invalid_fields ?? []).map(fieldName),
      raw,
    };
  }
}
