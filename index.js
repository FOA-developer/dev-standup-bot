require('dotenv').config();
const Groq = require('groq-sdk');
const { Langfuse } = require('langfuse');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

async function standupBot(devInput) {
  // Create a trace in LangFuse
  const trace = langfuse.trace({
    name: "bot prompt",
    input: devInput,
  });

  const prompt = await langfuse.getPrompt("bot prompt");
  const compiledPrompt = prompt.compile({ input: devInput });

  const generation = trace.generation({
    name: "standup-response",
    input: devInput,
    model: "llama-3.3-70b-versatile",
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: compiledPrompt,
  });

  const result = response.choices[0].message.content;

  generation.end({ output: result });
  trace.update({ output: result });
  await langfuse.flushAsync();

  return result;
}

// Test it
standupBot("I just finished the authentication module and feeling good about today")
  .then(res => console.log("Bot response:\n", res))
  .catch(err => console.error(err));