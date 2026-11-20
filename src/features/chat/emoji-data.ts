/**
 * Curated emoji set for the chat picker and reactions (client and server).
 * Limited to Emoji 13 or older so they render on Windows 10, Android and iOS.
 * The server only accepts reactions from this list.
 */

export type EmojiCategory = { id: string; label: string; icon: string; emojis: readonly string[] };

const list = (value: string) => value.trim().split(/\s+/);

export const EMOJI_CATEGORIES: readonly EmojiCategory[] = [
  {
    id: "rostos",
    label: "Rostos",
    icon: "😀",
    emojis: list(`
      😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 🤐
      🤨 😐 😑 😶 😏 😒 🙄 😬 😌 😔 😪 🤤 😴 😷 🤒 🤕 🥵 🥶 🥴 😵 🤯 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯
      😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 💀 🤡 👻 🤖 😺 😸 😻
    `),
  },
  {
    id: "gestos",
    label: "Gestos e pessoas",
    icon: "👍",
    emojis: list(`
      👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 👏 🙌 👐 🤲 🤝 🙏 💪 ✍️ 🧠 👀 👁️ 👂
      🙋 🙆 🙅 🤷 🤦 💁 🙇 🧘 🏃 💃 🕺 👪 👶 🧒 👧 🧑 👩 👨 🧓 👵 👴
    `),
  },
  {
    id: "coracoes",
    label: "Corações e sentimentos",
    icon: "❤️",
    emojis: list(`
      ❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💋 💯 💢 💥 💫 💦 💨 💤 🕊️ 🫂
    `),
  },
  {
    id: "natureza",
    label: "Natureza e animais",
    icon: "🌿",
    emojis: list(`
      🌱 🌿 🍀 🌳 🌲 🌴 🌵 🌷 🌸 🌹 🌺 🌻 🌼 🍁 🍂 🍃 🌎 🌙 ⭐ 🌟 ✨ ⚡ 🔥 🌈 ☀️ ⛅ ☁️ 🌧️ ❄️ 🌊
      🐶 🐱 🐭 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦋 🐢 🐬 🐳 🦄
    `),
  },
  {
    id: "comida",
    label: "Comida e bebida",
    icon: "🍕",
    emojis: list(`
      ☕ 🍵 🧃 🥤 🍷 🍺 🥂 🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥑 🥕 🌽 🥦 🍞 🧀 🍳 🍕 🍔 🍟 🌮 🍝 🍣 🍰
      🎂 🍪 🍫 🍩 🍿 🍦
    `),
  },
  {
    id: "atividades",
    label: "Atividades",
    icon: "⚽",
    emojis: list(`
      ⚽ 🏀 🏐 🎾 🚴 🏊 🧗 🎮 🎲 🧩 🎨 🎭 🎬 🎤 🎧 🎵 🎶 🎸 🎹 📚 📖 ✏️ 🎉 🎊 🎈 🎁 🏆 🥇 🏅 🎯
    `),
  },
  {
    id: "objetos",
    label: "Objetos e símbolos",
    icon: "💡",
    emojis: list(`
      💡 📌 📎 📝 📅 ⏰ ⌛ 💬 💭 📣 🔔 🔒 🔑 🧭 🩺 💊 🛋️ 🏠 ✈️ 🚗 📷 📱 💻 ✅ ❌ ❓ ❗ ⚠️ ♻️ ➕
      ➖ ✔️ 🆗 🆒 🔴 🟢 🔵 ⭕ 🎗️ ☮️
    `),
  },
];

/** Shown first in the reaction bar. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

const ALLOWED = new Set<string>(EMOJI_CATEGORIES.flatMap((c) => c.emojis));

export function isAllowedEmoji(value: string) {
  return ALLOWED.has(value);
}
