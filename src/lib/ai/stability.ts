const OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images";

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
  const apiKey = overrideApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Map dimensions to aspect ratio
  const aspect_ratio = mapToAspectRatio(params.width, params.height);

  // Build enhanced prompt with style and negative prompt
  let enhancedPrompt = params.prompt;
  if (params.style_preset && params.style_preset !== "none") {
    const styleLabel = params.style_preset.replace(/-/g, " ");
    enhancedPrompt = `${styleLabel} style: ${enhancedPrompt}`;
  }
  if (params.negative_prompt) {
    enhancedPrompt += `. Avoid: ${params.negative_prompt}`;
  }

  // When reference images are supplied, gpt-image-1 uses them to keep the subject
  // (e.g. a locked character) consistent across generations.
  const input_references = (params.reference_images ?? [])
    .filter(Boolean)
    .map((url) => ({ type: "image_url", image_url: { url } }));

  const response = await fetch(OPENROUTER_IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-image-1",
      prompt: enhancedPrompt,
      n: 1,
      aspect_ratio,
      quality: "high",
      ...(input_references.length > 0 ? { input_references } : {}),
    }),
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
    const arrayBuffer = await imgResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("No image data in response");
}

function mapToAspectRatio(width: number, height: number): string {
  if (width > height) return "3:2";
  if (height > width) return "2:3";
  return "1:1";
}
