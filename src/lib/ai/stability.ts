// Text-to-image via OpenAI's Images API (direct, not through OpenRouter).
//   - no reference images -> POST /v1/images/generations
//   - with reference images (character lock) -> POST /v1/images/edits (multipart)
// Model defaults to gpt-image-2; override with OPENAI_IMAGE_MODEL.

const OPENAI_IMAGES_GENERATIONS = "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGES_EDITS = "https://api.openai.com/v1/images/edits";

interface ImageGenParams {
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  style_preset?: string;
  /** Reference image URL(s) to guide generation (character lock / img2img). */
  reference_images?: string[];
}

export async function generateImage(params: ImageGenParams, overrideApiKey?: string): Promise<Buffer> {
  const apiKey = overrideApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "high";
  const size = mapToSize(params.width, params.height);

  // Build enhanced prompt with style and negative prompt.
  let enhancedPrompt = params.prompt;
  if (params.style_preset && params.style_preset !== "none") {
    const styleLabel = params.style_preset.replace(/-/g, " ");
    enhancedPrompt = `${styleLabel} style: ${enhancedPrompt}`;
  }
  if (params.negative_prompt) {
    enhancedPrompt += `. Avoid: ${params.negative_prompt}`;
  }

  const refs = (params.reference_images ?? []).filter(Boolean);

  const response = refs.length > 0
    ? await editWithReferences({ apiKey, model, quality, size, prompt: enhancedPrompt, refs })
    : await fetch(OPENAI_IMAGES_GENERATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, prompt: enhancedPrompt, n: 1, size, quality }),
      });

  if (!response.ok) {
    let message = `Image generation error: ${response.status}`;
    try {
      const error = await response.json();
      message = error.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  const imageData = data.data?.[0];
  if (!imageData) {
    throw new Error("No image data in response");
  }

  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, "base64");
  }
  if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    if (!imgResponse.ok) {
      throw new Error("Failed to download generated image");
    }
    return Buffer.from(await imgResponse.arrayBuffer());
  }
  throw new Error("No image data in response");
}

// Character lock: download the reference image(s) and send them to the edits
// endpoint so the model preserves the subject across generations.
async function editWithReferences(opts: {
  apiKey: string;
  model: string;
  quality: string;
  size: string;
  prompt: string;
  refs: string[];
}): Promise<Response> {
  const form = new FormData();
  form.append("model", opts.model);
  form.append("prompt", opts.prompt);
  form.append("n", "1");
  form.append("size", opts.size);
  form.append("quality", opts.quality);

  for (let i = 0; i < opts.refs.length; i++) {
    const r = await fetch(opts.refs[i]);
    if (!r.ok) continue;
    const type = r.headers.get("content-type") || "image/png";
    const blob = new Blob([await r.arrayBuffer()], { type });
    form.append("image[]", blob, `reference-${i}.png`);
  }

  return fetch(OPENAI_IMAGES_EDITS, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}` }, // let fetch set multipart boundary
    body: form,
  });
}

// OpenAI gpt-image sizes: 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait).
function mapToSize(width: number, height: number): string {
  if (width > height) return "1536x1024";
  if (height > width) return "1024x1536";
  return "1024x1024";
}
