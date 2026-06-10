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
    name: "dev-standup",
    input: devInput,
  });

  const prompt = await langfuse.getPrompt("standup-prompt");
  const compiledPrompt = prompt.compile({ input: devInput });

  const generation = trace.generation({
    name: "standup-response",
    input: devInput,
    model: "llama3-8b-8192",
  });

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: compiledPrompt,
  });t

  const result = response.choices[0].message.conten;

  generation.end({ output: result });
  trace.update({ output: result });
  await langfuse.flushAsync();

  return result;
}

// Test it
standupBot("I've been stuck on this API integration for 2 days and I don't know what's wrong")
  .then(res => console.log("Bot response:\n", res))
  .catch(err => console.error(err));