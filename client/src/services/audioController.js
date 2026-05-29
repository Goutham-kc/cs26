// services/audioController.js — Web Speech API, zero library weight
export function executeOAQAudioTrackSync(rawTextBodyString) {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(rawTextBodyString);
  utterance.rate  = 1.0;
  utterance.pitch = 1.0;
  utterance.lang  = 'en-IN';
  window.speechSynthesis.speak(utterance);
}

export function stopAudio() {
  if (window.speechSynthesis?.speaking) {
    window.speechSynthesis.cancel();
  }
}

export function isSupported() {
  return !!window.speechSynthesis;
}
