export function mountApp(root: HTMLElement): void {
  const header = document.createElement('header');
  header.textContent = 'MiniGames';
  root.append(header);
}
