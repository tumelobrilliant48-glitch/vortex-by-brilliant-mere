/* VORTEX AI ENGINE
   Handles Vortex AI prompts,
   voice input, text-to-speech
   and AI interface actions.
*/


/* =========================
   LOCAL AI RESPONSES
========================= */

const VORTEX_AI_RESPONSES = {

  idea:
    "💡 Try a VORTEX challenge: ask users to post one creative idea in 24 hours.",

  post:
    "📝 Post idea: \"VORTEX isn't just an app — it's a place to connect, create and discover.\"",

  image:
    "🖼️ The image-generation interface is ready. Connect an image-generation API for real image creation.",

  help:
    "❓ I can help with posts, profiles, messages, games, settings, themes and other VORTEX features."

};


/* =========================
   AI QUICK ACTION
========================= */

function aiReply(type) {

  const response =
    VORTEX_AI_RESPONSES[type] ||
    VORTEX_AI_RESPONSES.help;


  const output =
    document.getElementById(
      "aiResponse"
    );


  if (!output) return;


  output.textContent =
    response;


  speakText(
    response
  );
}


/* =========================
   ASK VORTEX AI
========================= */

async function askAI() {

  const input =
    document.getElementById(
      "aiInput"
    );

  const output =
    document.getElementById(
      "aiResponse"
    );


  if (!input || !output) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {

    toast(
      "Ask Vortex AI something."
    );

    input.focus();

    return;
  }


  if (text.length > 3000) {

    toast(
      "Your question is too long."
    );

    return;
  }


  /*
    Show a temporary thinking state.
  */

  output.innerHTML = `
    <span class="aiThinking">
      Vortex AI is thinking
      <span>•</span>
      <span>•</span>
      <span>•</span>
    </span>
  `;


  const response =
    await generateLocalAIResponse(
      text
    );


  output.textContent =
    response;


  input.value = "";


  speakText(
    response
  );
}


/* =========================
   LOCAL AI FALLBACK
========================= */

async function generateLocalAIResponse(
  text
) {

  /*
    This is intentionally local for
    the current MVP.

    A real backend can later replace
    this function without changing
    the AI interface.
  */

  const q =
    text
      .toLowerCase()
      .trim();


  /*
    Small delay makes the interface
    feel more natural.
  */

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        350
      )
  );


  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("hey")
  ) {

    return (
      "Hello! 👋 I'm Vortex AI. " +
      "What would you like to create today?"
    );

  }


  if (
    q.includes("post") ||
    q.includes("caption")
  ) {

    return (
      "I can help you create a strong " +
      "VORTEX post. Tell me your topic, " +
      "audience and the style you want."
    );

  }


  if (
    q.includes("game") ||
    q.includes("gaming")
  ) {

    return (
      "🎮 VORTEX Games can include " +
      "racing, puzzles, chess, snooker " +
      "and future multiplayer experiences."
    );

  }


  if (
    q.includes("theme") ||
    q.includes("design")
  ) {

    return (
      "✨ Open Settings → Themes to " +
      "explore the VORTEX visual styles."
    );

  }


  if (
    q.includes("profile") ||
    q.includes("username")
  ) {

    return (
      "👤 You can edit your VORTEX " +
      "profile from the Profile page."
    );

  }


  if (
    q.includes("message") ||
    q.includes("chat")
  ) {

    return (
      "💬 Open Messages to start a " +
      "conversation or create a new chat."
    );

  }


  if (
    q.includes("help") ||
    q.includes("what can you do")
  ) {

    return (
      "🤖 I can help you explore VORTEX, " +
      "create content, understand features, " +
      "and plan ideas for your profile."
    );

  }


  if (
    q.includes("vortex")
  ) {

    return (
      "🌌 VORTEX is your social universe — " +
      "a place to connect, create, discover " +
      "and build your own community."
    );

  }


  return (
    "I understand your question. " +
    "This VORTEX MVP currently uses a " +
    "local AI fallback. Connect a real AI " +
    "backend to enable full AI-powered answers."
  );
}


/* =========================
   TEXT TO SPEECH
========================= */

function speakText(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    toast(
      "Text-to-speech isn't supported here."
    );

    return;
  }


  if (!text) return;


  speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      String(text)
    );


  utterance.lang =
    "en-US";

  utterance.rate =
    1;

  utterance.pitch =
    1;


  speechSynthesis.speak(
    utterance
  );
}


/* =========================
   SPEAK CURRENT RESPONSE
========================= */

function speakAI() {

  const output =
    document.getElementById(
      "aiResponse"
    );


  if (!output) return;


  const text =
    output.textContent.trim();


  if (!text) {

    toast(
      "There is no AI response to read."
    );

    return;
  }


  speakText(
    text
  );
}


/* =========================
   STOP AI VOICE
========================= */

function stopAISpeech() {

  if (
    "speechSynthesis" in window
  ) {

    speechSynthesis.cancel();

    toast(
      "Vortex AI voice stopped."
    );

  }
}


/* =========================
   VOICE INPUT
========================= */

function voiceInput() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    toast(
      "Voice input isn't supported by this browser."
    );

    return;
  }


  const input =
    document.getElementById(
      "aiInput"
    );


  if (!input) return;


  const recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-US";

  recognition.interimResults =
    false;

  recognition.continuous =
    false;

  recognition.maxAlternatives =
    1;


  recognition.onstart =
    () => {

      toast(
        "Listening 🎙️"
      );

    };


  recognition.onresult =
    event => {

      const result =
        event.results?.[0]?.[0];


      if (!result) {
        return;
      }


      input.value =
        result.transcript;


      input.focus();


      toast(
        "Voice captured ✓"
      );

    };


  recognition.onerror =
    event => {

      console.warn(
        "VORTEX voice input:",
        event.error
      );


      toast(
        "Voice input stopped."
      );

    };


  recognition.onend =
    () => {

      document.body
        .classList
        .remove(
          "voiceListening"
        );

    };


  document.body
    .classList
    .add(
      "voiceListening"
    );


  try {

    recognition.start();

  } catch (error) {

    console.warn(
      "VORTEX voice start failed:",
      error
    );

    document.body
      .classList
      .remove(
        "voiceListening"
      );

    toast(
      "Unable to start voice input."
    );

  }
}


/* =========================
   AI ENTER KEY
========================= */

function handleAIKeydown(event) {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    askAI();

  }
}


/* =========================
   AI CLEAR
========================= */

function clearAI() {

  const input =
    document.getElementById(
      "aiInput"
    );

  const output =
    document.getElementById(
      "aiResponse"
    );


  if (input) {
    input.value = "";
  }


  if (output) {

    output.textContent =
      "I'm ready to help. Ask Vortex AI anything.";

  }


  stopAISpeech();
}


/* =========================
   AI IDEA GENERATOR
========================= */

function generatePostIdea() {

  const ideas = [

    "🚀 Share one thing you want VORTEX to become in the future.",

    "💡 What is the most creative idea you've had this week?",

    "🌍 Tell the VORTEX community something interesting about your city.",

    "🎮 Share your favourite game and explain why you enjoy it.",

    "📚 Teach the VORTEX community one thing you know well.",

    "✨ Post a goal you want to accomplish before the end of the year."

  ];


  const randomIdea =
    ideas[
      Math.floor(
        Math.random() *
        ideas.length
      )
    ];


  const input =
    document.getElementById(
      "postText"
    );


  if (input) {

    input.value =
      randomIdea;

    input.focus();


    if (
      typeof updatePostCharacterCount ===
      "function"
    ) {

      updatePostCharacterCount();

    }


    toast(
      "AI generated a post idea ✨"
    );

    return;
  }


  toast(
    randomIdea
  );
}


/* =========================
   AI STATUS
========================= */

function setAIStatus(
  message
) {

  const status =
    document.getElementById(
      "aiStatus"
    );


  if (status) {

    status.textContent =
      message;

  }
}


/* =========================
   AI INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const input =
      document.getElementById(
        "aiInput"
      );


    if (input) {

      input.addEventListener(
        "keydown",
        handleAIKeydown
      );

    }


    const output =
      document.getElementById(
        "aiResponse"
      );


    if (
      output &&
      !output.textContent.trim()
    ) {

      output.textContent =
        "I'm ready to help. Ask Vortex AI anything.";

    }

  }
);
