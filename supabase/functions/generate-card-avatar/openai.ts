const OPENAI_BASE = "https://api.openai.com/v1";
const MODEL = "gpt-image-2";
const SIZE = "1024x1536";
const QUALITY = "medium";

export class OpenAiModerationError extends Error {}

interface GenerateArgs {
  apiKey: string;
  prompt: string;
  sourceImage?: { bytes: Uint8Array; contentType: string };
}

function isModeration(status: number, body: string): boolean {
  return (
    status === 400 &&
    /moderation|safety|content[_ ]policy|not allowed/i.test(body)
  );
}

async function readImageBytes(res: Response): Promise<Uint8Array> {
  const text = await res.text();
  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error(`gpt-image-2 returned no image: ${text.slice(0, 300)}`);
  }

  return Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
}

export async function generateAvatarImage(args: GenerateArgs): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    let res: Response;

    if (args.sourceImage) {
      const form = new FormData();
      form.append("model", MODEL);
      form.append("prompt", args.prompt);
      form.append("size", SIZE);
      form.append("quality", QUALITY);
      form.append("output_format", "png");
      form.append("n", "1");
      form.append(
        "image[]",
        new Blob([args.sourceImage.bytes], { type: args.sourceImage.contentType }),
        "source.png"
      );

      res = await fetch(`${OPENAI_BASE}/images/edits`, {
        body: form,
        headers: { Authorization: `Bearer ${args.apiKey}` },
        method: "POST",
        signal: controller.signal
      });
    } else {
      res = await fetch(`${OPENAI_BASE}/images/generations`, {
        body: JSON.stringify({
          model: MODEL,
          n: 1,
          output_format: "png",
          prompt: args.prompt,
          quality: QUALITY,
          size: SIZE
        }),
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: controller.signal
      });
    }

    if (!res.ok) {
      const body = await res.text();

      if (isModeration(res.status, body)) {
        throw new OpenAiModerationError(body.slice(0, 300));
      }

      throw new Error(`gpt-image-2 ${res.status}: ${body.slice(0, 400)}`);
    }

    return await readImageBytes(res);
  } finally {
    clearTimeout(timer);
  }
}
