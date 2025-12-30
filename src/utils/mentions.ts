export const parseMentions = (text: string) => {
  const regex = /@(\w+)/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};
