// automation/useAITransferHandler.js
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const FormData = require("form-data");
const logger = require("../utils/logger");

// ── Velix session store (sessions.json lives next to this file) ───────────────
const VELIX_SESSION_FILE = path.join(__dirname, "usevelix_sessions.json");
const VELIX_BASE = "https://usevelix.com"; // update if different

function velixReadSessions() {
  try {
    if (!fs.existsSync(VELIX_SESSION_FILE)) {
      fs.writeFileSync(VELIX_SESSION_FILE, JSON.stringify({}), "utf-8");
    }
    return JSON.parse(fs.readFileSync(VELIX_SESSION_FILE, "utf-8") || "{}");
  } catch {
    return {};
  }
}

function velixWriteSessions(data) {
  try {
    fs.writeFileSync(
      VELIX_SESSION_FILE,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  } catch (err) {
    logger.error("velixWriteSessions error:", err.message);
  }
}

function velixGetConvoId(chatKey) {
  return velixReadSessions()[chatKey] || null;
}

function velixSaveConvoId(chatKey, conversationUid) {
  const s = velixReadSessions();
  s[chatKey] = conversationUid;
  velixWriteSessions(s);
}

function velixDeleteConvoId(chatKey) {
  const s = velixReadSessions();
  if (s[chatKey]) {
    delete s[chatKey];
    velixWriteSessions(s);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function returnCheck(data) {
  if (data?.assignedToAi && data?.model?.id?.includes("gpt")) {
    return true;
  }
  if (data?.assignedToAi && data?.model?.id?.includes("gemini")) {
    return true;
  }
  return false;
}

// ── Hoisted here so both processOpenAI and processDeepSeek can access it ──
const usesCompletionTokens = (modelId = "") =>
  modelId.startsWith("gpt-4.1") ||
  modelId.startsWith("gpt-5") ||
  modelId.startsWith("o1") ||
  modelId.startsWith("o3") ||
  modelId.startsWith("o4");

const aiTransferHandler = async (inputData, conversationHistory) => {
  const imageAndAudioUnderstand =
    inputData?.knowMedia && returnCheck(inputData);
  const config = { messageReferenceCount: 10, ...inputData };

  const validateInput = (input) => {
    if (!input?.provider?.id || !input?.model?.id || !input?.apiKey) {
      logger.error(
        "Validation Error: Missing provider.id, model.id, or apiKey",
      );
      return false;
    }
    return true;
  };

  const getLocalFilePath = (url) => {
    if (!url) return null;
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    return path.join(__dirname, "../client/public/meta-media", filename);
  };

  const readFileAsBase64 = async (filePath) => {
    try {
      await fs.promises.access(filePath);
      const fileBuffer = await fs.promises.readFile(filePath);
      return fileBuffer.toString("base64");
    } catch (error) {
      logger.error(`Error reading file or file not found: ${error.message}`);
      return null;
    }
  };

  const getMimeType = (filePath) => {
    return mime.lookup(filePath) || "application/octet-stream";
  };

  const transcribeAudioWithOpenAI = async (filePath, apiKey) => {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("model", "whisper-1");

      const response = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
        },
      );

      return response.data.text;
    } catch (error) {
      logger.error(
        "Audio transcription error:",
        error.response?.data || error.message,
      );
      return "[Audio transcription failed]";
    }
  };

  const formatConversationHistory = async (history, msgRefCount) => {
    if (!history || !Array.isArray(history)) return [];

    const formattedPromises = history.map(async (msg) => {
      try {
        const context =
          typeof msg.msgContext === "string"
            ? JSON.parse(msg.msgContext)
            : msg.msgContext;

        if (msg.type === "text" && context?.text?.body) {
          return {
            role: msg.route === "INCOMING" ? "user" : "assistant",
            content: context.text.body,
          };
        } else if (
          imageAndAudioUnderstand &&
          msg.type === "image" &&
          context?.image?.link
        ) {
          const imageUrl = context.image.link;
          const caption = context.image.caption || "";
          const localFilePath = getLocalFilePath(imageUrl);

          if (inputData.provider.id.toLowerCase() === "openai") {
            const content = [];

            if (caption) {
              content.push({ type: "text", text: caption });
            }

            if (localFilePath) {
              const base64Image = await readFileAsBase64(localFilePath);
              const mimeType = getMimeType(localFilePath);

              if (base64Image) {
                content.push({
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                });
              }
            }

            return {
              role: msg.route === "INCOMING" ? "user" : "assistant",
              content:
                content.length > 0 ? content : caption || "Image received",
            };
          } else if (inputData.provider.id.toLowerCase() === "gemini") {
            return {
              role: msg.route === "INCOMING" ? "user" : "assistant",
              content: {
                type: "image",
                localPath: localFilePath,
                caption: caption,
              },
            };
          } else {
            return {
              role: msg.route === "INCOMING" ? "user" : "assistant",
              content: caption || "Image received",
            };
          }
        } else if (
          imageAndAudioUnderstand &&
          msg.type === "audio" &&
          context?.audio?.link
        ) {
          const audioUrl = context.audio.link;
          const localFilePath = getLocalFilePath(audioUrl);

          if (
            inputData.provider.id.toLowerCase() === "openai" &&
            localFilePath
          ) {
            const transcription = await transcribeAudioWithOpenAI(
              localFilePath,
              inputData.apiKey,
            );

            return {
              role: msg.route === "INCOMING" ? "user" : "assistant",
              content: transcription
                ? `[Audio transcription]: ${transcription}`
                : "Audio message received but could not be transcribed.",
            };
          } else {
            return {
              role: msg.route === "INCOMING" ? "user" : "assistant",
              content: "Audio message received",
            };
          }
        }

        return null;
      } catch (e) {
        logger.error("Error parsing msgContext:", msg.msgContext, e);
        return null;
      }
    });

    const formatted = (await Promise.all(formattedPromises)).filter(Boolean);

    if (msgRefCount > 0) {
      return formatted.slice(-msgRefCount);
    }
    return formatted;
  };

  const generateOpenAITools = (functions) => {
    if (!functions || functions.length === 0) return undefined;
    return functions.map((func) => ({
      type: "function",
      function: {
        name: func.id,
        description: func.name,
        parameters: func.parameters || {
          type: "object",
          properties: {},
          required: [],
        },
      },
    }));
  };

  const generateGeminiTools = (functions) => {
    if (!functions || functions.length === 0) return undefined;
    return [
      {
        functionDeclarations: functions.map((func) => ({
          name: func.id,
          description: func.name,
          parameters: func.parameters || {
            type: "OBJECT",
            properties: {},
          },
        })),
      },
    ];
  };

  const generateDeepSeekFunctions = (functions) => {
    if (!functions || functions.length === 0) return undefined;
    return functions.map((func) => ({
      name: func.id,
      description: func.name,
      parameters: func.parameters || {
        type: "object",
        properties: {},
        required: [],
      },
    }));
  };

  const processOpenAI = async (currentInputData, history) => {
    const messages = [
      { role: "system", content: currentInputData.systemPrompt },
    ];

    for (const msg of history) {
      if (Array.isArray(msg.content) || typeof msg.content === "string") {
        messages.push({ role: msg.role, content: msg.content });
      } else if (msg.content?.type === "image") {
        const localPath = msg.content.localPath;
        const caption = msg.content.caption || "Image:";

        if (localPath) {
          const base64Image = await readFileAsBase64(localPath);
          const mimeType = getMimeType(localPath);

          if (base64Image) {
            const content = [];
            if (caption) content.push({ type: "text", text: caption });
            content.push({
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            });
            messages.push({ role: msg.role, content });
          } else {
            messages.push({ role: msg.role, content: caption });
          }
        } else {
          messages.push({ role: msg.role, content: caption });
        }
      }
    }

    const body = {
      model: currentInputData.model.id,
      messages,
      temperature: currentInputData.temperature,
      ...(usesCompletionTokens(currentInputData.model.id)
        ? { max_completion_tokens: currentInputData.maxTokens }
        : { max_tokens: currentInputData.maxTokens }),
    };

    if (
      currentInputData.aiTask?.active &&
      currentInputData.aiTask.functions?.length > 0
    ) {
      const tools = generateOpenAITools(currentInputData.aiTask.functions);
      if (tools) {
        body.tools = tools;
        body.tool_choice = "auto";
      }
    }

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        body,
        {
          headers: {
            Authorization: `Bearer ${currentInputData.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const choice = response.data.choices[0].message;
      const result = {
        content: choice.content || "",
        functionCalls: [],
      };

      if (choice.tool_calls) {
        result.functionCalls = choice.tool_calls.map((toolCall) => {
          const originalFunction = currentInputData.aiTask.functions.find(
            (f) => f.id === toolCall.function.name,
          );
          return {
            tool_call_id: toolCall.id,
            id: originalFunction ? originalFunction.id : toolCall.function.name,
            name: originalFunction ? originalFunction.name : "Unknown Function",
            arguments: JSON.parse(toolCall.function.arguments),
          };
        });
      }
      return result;
    } catch (error) {
      logger.error("OpenAI API Error:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "OpenAI API request failed";
      return { content: null, functionCalls: [], error: true, errorMessage };
    }
  };

  const processGemini = async (currentInputData, history) => {
    const genAI = new GoogleGenerativeAI(currentInputData.apiKey);
    const geminiTools =
      currentInputData.aiTask?.active &&
      currentInputData.aiTask.functions?.length > 0
        ? generateGeminiTools(currentInputData.aiTask.functions)
        : undefined;

    const modelParams = {
      model: currentInputData.model.id,
      generationConfig: {
        temperature: currentInputData.temperature,
        maxOutputTokens: currentInputData.maxTokens,
      },
      systemInstruction: {
        parts: [{ text: currentInputData.systemPrompt }],
        role: "system",
      },
    };

    if (geminiTools) {
      modelParams.tools = geminiTools;
    }

    const model = genAI.getGenerativeModel(modelParams);

    const geminiHistory = [];
    for (const msg of history) {
      if (typeof msg.content === "string") {
        geminiHistory.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      } else if (Array.isArray(msg.content)) {
        const parts = [];
        let textContent = "";

        for (const part of msg.content) {
          if (part.type === "text") {
            textContent += part.text + " ";
          } else if (part.type === "image_url" && part.image_url) {
            const dataUrl = part.image_url.url;
            if (dataUrl.startsWith("data:")) {
              const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                parts.push({
                  inlineData: {
                    data: matches[2],
                    mimeType: matches[1],
                  },
                });
              }
            }
          }
        }

        if (textContent) {
          parts.unshift({ text: textContent.trim() });
        }

        geminiHistory.push({
          role: msg.role === "user" ? "user" : "model",
          parts,
        });
      } else if (msg.content?.type === "image") {
        const parts = [];
        if (msg.content.caption) {
          parts.push({ text: msg.content.caption });
        }

        if (msg.content.localPath) {
          const base64Image = await readFileAsBase64(msg.content.localPath);
          const mimeType = getMimeType(msg.content.localPath);

          if (base64Image) {
            parts.push({
              inlineData: {
                data: base64Image,
                mimeType,
              },
            });
          }
        }

        if (parts.length > 0) {
          geminiHistory.push({
            role: msg.role === "user" ? "user" : "model",
            parts,
          });
        }
      }
    }

    const lastUserMessage =
      geminiHistory.length > 0
        ? geminiHistory[geminiHistory.length - 1].role === "user"
          ? geminiHistory[geminiHistory.length - 1]
          : null
        : null;

    try {
      const chat = model.startChat({
        history: lastUserMessage ? geminiHistory.slice(0, -1) : geminiHistory,
      });

      let response;
      if (lastUserMessage) {
        response = await chat.sendMessage(lastUserMessage.parts);
      } else {
        response = await chat.sendMessage(currentInputData.systemPrompt);
      }

      let textContent = "";
      const calledFunctions = [];
      const fullResponse = response.response;

      if (fullResponse.candidates && fullResponse.candidates.length > 0) {
        const candidate = fullResponse.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              textContent += part.text;
            }
            if (part.functionCall) {
              const originalFunction = currentInputData.aiTask.functions.find(
                (f) => f.id === part.functionCall.name,
              );
              calledFunctions.push({
                id: originalFunction
                  ? originalFunction.id
                  : part.functionCall.name,
                name: originalFunction
                  ? originalFunction.name
                  : "Unknown Function",
                arguments: part.functionCall.args,
              });
            }
          }
        }
      } else {
        textContent = fullResponse.text?.() || "";
      }

      return {
        content: textContent.trim(),
        functionCalls: calledFunctions,
      };
    } catch (error) {
      logger.error("Gemini API Error:", error.message, error.stack);
      const errorMessage = error.message || "Gemini API request failed";
      return { content: null, functionCalls: [], error: true, errorMessage };
    }
  };

  const processDeepSeek = async (currentInputData, history) => {
    const messages = [
      { role: "system", content: currentInputData.systemPrompt },
    ];

    history.forEach((msg) => {
      if (typeof msg.content === "string") {
        messages.push({ role: msg.role, content: msg.content });
      } else if (Array.isArray(msg.content)) {
        let textContent = "";
        let hasImage = false;

        for (const part of msg.content) {
          if (part.type === "text") {
            textContent += part.text + " ";
          } else if (part.type === "image_url") {
            hasImage = true;
          }
        }

        messages.push({
          role: msg.role,
          content: textContent.trim() + (hasImage ? " [Image attached]" : ""),
        });
      } else if (msg.content?.type === "image") {
        messages.push({
          role: msg.role,
          content: (msg.content.caption || "Image:") + " [Image attached]",
        });
      }
    });

    const noTemperatureSupport = (modelId = "") =>
      modelId.startsWith("o1") ||
      modelId.startsWith("o3") ||
      modelId.startsWith("o4");

    const body = {
      model: currentInputData.model.id,
      messages,
      ...(!noTemperatureSupport(currentInputData.model.id) && {
        temperature: currentInputData.temperature,
      }),
      ...(usesCompletionTokens(currentInputData.model.id)
        ? { max_completion_tokens: currentInputData.maxTokens }
        : { max_tokens: currentInputData.maxTokens }),
    };

    if (
      currentInputData.aiTask?.active &&
      currentInputData.aiTask.functions?.length > 0
    ) {
      const dsFunctions = generateDeepSeekFunctions(
        currentInputData.aiTask.functions,
      );
      if (dsFunctions) {
        body.functions = dsFunctions;
      }
    }

    try {
      const response = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        body,
        {
          headers: {
            Authorization: `Bearer ${currentInputData.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const choice = response.data.choices[0].message;
      const result = {
        content: choice.content || "",
        functionCalls: [],
      };

      if (choice.function_call) {
        const originalFunction = currentInputData.aiTask.functions.find(
          (f) => f.id === choice.function_call.name,
        );
        result.functionCalls = [
          {
            id: originalFunction
              ? originalFunction.id
              : choice.function_call.name,
            name: originalFunction ? originalFunction.name : "Unknown Function",
            arguments: JSON.parse(choice.function_call.arguments),
          },
        ];
      }
      return result;
    } catch (error) {
      logger.error(
        "DeepSeek API Error:",
        error.response?.data || error.message,
      );
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "DeepSeek API request failed";
      return { content: null, functionCalls: [], error: true, errorMessage };
    }
  };

  const processVelix = async (currentInputData, history, chatKey) => {
    const apiKey = currentInputData.apiKey;
    const modelKey = currentInputData.model?.id || "claude_4_6_sonnet";
    const webAccess = currentInputData.webAccess || false;

    // ── Get last user message ─────────────────────────────────────────────
    const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
    const userMessage =
      typeof lastUserMsg?.content === "string" && lastUserMsg.content.trim()
        ? lastUserMsg.content.trim()
        : "Hello";

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // ── Parse Velix reply ─────────────────────────────────────────────────
    const parseVelixReply = (replyData) => {
      logger.log("Velix raw reply:", JSON.stringify(replyData));

      // ← Check tool_calls directly — finish_reason may not be present
      if (replyData.tool_calls?.length > 0) {
        const functionCalls = replyData.tool_calls.map((tc) => {
          const originalFunction = currentInputData.aiTask?.functions?.find(
            (f) => f.id === tc.function.name,
          );
          return {
            tool_call_id: tc.id,
            id: originalFunction ? originalFunction.id : tc.function.name,
            name: originalFunction ? originalFunction.name : tc.function.name,
            arguments:
              typeof tc.function.arguments === "string"
                ? (() => {
                    try {
                      return JSON.parse(tc.function.arguments);
                    } catch {
                      return {};
                    }
                  })()
                : tc.function.arguments || {},
          };
        });

        logger.log(
          `Velix: tool_calls detected:`,
          JSON.stringify(functionCalls),
        );
        return { content: replyData.content || "", functionCalls };
      }

      const content =
        typeof replyData.content === "string"
          ? replyData.content
          : replyData.content != null
            ? JSON.stringify(replyData.content)
            : "";

      return { content, functionCalls: [] };
    };

    // ── Start new conversation ────────────────────────────────────────────
    // KEY FIX: system prompt goes as a SEPARATE first assistant-primed message
    // by using the conversation title trick — or better, just send system prompt
    // as the very first user message, get a reply, THEN send the real message.
    // But the CLEANEST way: Velix /api/chat/conversations accepts `systemPrompt`
    // if your backend supports it — add it there. If not, use the two-shot approach.
    const startNewConversation = async (msgText) => {
      const body = {
        message: msgText,
        modelKey,
        webAccess,
        ...(currentInputData.systemPrompt?.trim() && {
          systemPrompt: currentInputData.systemPrompt.trim(),
        }),
      };

      logger.log(
        `Velix: POST /api/chat/conversations body:`,
        JSON.stringify({
          ...body,
          message: body.message?.slice(0, 80),
        }),
      );

      const res = await axios.post(
        `${VELIX_BASE}/api/chat/conversations`,
        body,
        { headers },
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Velix start conversation failed");
      }

      const newUid = res.data.data.conversation_uid;
      velixSaveConvoId(chatKey, newUid);
      logger.log(`Velix: new conversation created uid=${newUid}`);
      return res.data.data.reply;
    };

    // ── Send follow-up ────────────────────────────────────────────────────
    const sendToExistingConversation = async (convoUid, msgText) => {
      const body = {
        message: msgText,
        modelKey,
        webAccess,
      };

      logger.log(
        `Velix: POST /api/chat/conversations/${convoUid}/messages body:`,
        JSON.stringify({ ...body, message: body.message?.slice(0, 80) }),
      );

      return axios.post(
        `${VELIX_BASE}/api/chat/conversations/${convoUid}/messages`,
        body,
        { headers },
      );
    };

    try {
      let conversationUid = velixGetConvoId(chatKey);
      let replyData = null;

      if (!conversationUid) {
        logger.log(`Velix: starting new conversation for chatKey=${chatKey}`);
        replyData = await startNewConversation(userMessage); // ← NO system prompt injection
      } else {
        logger.log(
          `Velix: continuing uid=${conversationUid} for chatKey=${chatKey}`,
        );
        try {
          const res = await sendToExistingConversation(
            conversationUid,
            userMessage,
          );
          if (!res.data?.success) {
            logger.warn(`Velix: convo error, resetting.`);
            velixDeleteConvoId(chatKey);
            replyData = await startNewConversation(userMessage);
          } else {
            replyData = res.data.data.reply;
          }
        } catch (httpErr) {
          logger.warn(
            `Velix: HTTP error, resetting. Error: ${httpErr.message}`,
          );
          velixDeleteConvoId(chatKey);
          replyData = await startNewConversation(userMessage);
        }
      }

      if (!replyData) throw new Error("Velix: no reply data received");
      return parseVelixReply(replyData);
    } catch (error) {
      logger.error("Velix API Error:", error.response?.data || error.message);
      return {
        content: null,
        functionCalls: [],
        error: true,
        errorMessage:
          error.response?.data?.message ||
          error.message ||
          "Velix API request failed",
      };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────

  // --- Main Handler Logic ---
  if (!validateInput(inputData)) {
    return {
      success: false,
      message: "Invalid input data: Missing provider, model, or API key.",
    };
  }

  const messageCount =
    typeof inputData.messageReferenceCount === "number"
      ? inputData.messageReferenceCount
      : config.messageReferenceCount;

  const formattedHistory = await formatConversationHistory(
    conversationHistory,
    messageCount,
  );

  // chatKey for Velix session tracking — passed in from functions.js
  const chatKey = inputData._chatKey || "default";

  let result;
  try {
    switch (inputData.provider.id.toLowerCase()) {
      case "openai":
        result = await processOpenAI(inputData, formattedHistory);
        break;
      case "gemini":
        result = await processGemini(inputData, formattedHistory);
        break;
      case "deepseek":
        result = await processDeepSeek(inputData, formattedHistory);
        break;
      case "velix":
        result = await processVelix(inputData, formattedHistory, chatKey);
        break;
      default:
        return { success: false, message: "Unsupported AI provider" };
    }

    if (result.error) {
      return {
        success: false,
        message: result.errorMessage || "AI processing failed.",
      };
    }

    return {
      success: true,
      data: {
        message: result.content,
        function:
          result.functionCalls?.length > 0 ? result.functionCalls : null,
      },
    };
  } catch (e) {
    logger.error("General aiTransferHandler Error:", e);
    return {
      success: false,
      message: `An unexpected error occurred: ${e.message}`,
    };
  }
};

module.exports = { aiTransferHandler };
