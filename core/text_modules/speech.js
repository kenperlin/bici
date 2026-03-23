export class SpeechDetector {
  constructor() {
    this.currentUnit = null;
    this.isRunning = false;
    this.isInitialized = false;

    const recognition = new SpeechRecognition();

    const phraseData = [
      { phrase: "sentence", boost: 3.0 },
      { phrase: "word", boost: 3.0 },
      { phrase: "paragraph", boost: 3.0 }
    ].map((p) => new SpeechRecognitionPhrase(p.phrase, p.boost));

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.processLocally = true;
    recognition.phrases = phraseData;

    recognition.onstart = (e) => {
      console.log("started");
      this.isRunning = true;
    };
    recognition.onend = (e) => {
      console.log("ended");

      this.isRunning = false;
    };

    recognition.onresult = (ev) => {
      for (const result of ev.results) {
        for (let i = 0; i < result.length; i++) {
          const transcript = result.item(i).transcript.toLowerCase();
          console.log(transcript);

          const sentenceIdx = transcript.indexOf("sentence");
          const wordIdx = transcript.indexOf("word");
          const paragraphIdx = transcript.indexOf("paragraph");

          if (sentenceIdx != -1) this.currentUnit = "sentence";
          if (wordIdx > sentenceIdx) this.currentUnit = "word";
          if (paragraphIdx > sentenceIdx && paragraphIdx > wordIdx) this.currentUnit = "paragraph";
        }
      }
    };
    this.recognition = recognition;
  }

  init() {
    if (this.isInitialized) return;

    SpeechRecognition.install({ langs: ["en-US"], processLocally: true }).then(() => {
      this.isInitialized = true;
    });
  }

  update() {
    if (!this.isRunning) {
      try {
        this.recognition.start();
      } catch {}
    }
  }
}
