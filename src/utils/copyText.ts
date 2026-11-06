// Copy all text from the screen the user is looking at.
// Input values and table rows are included, so dataset names and numbers come out as plain text
// (one row per line, columns separated by tabs, so it pastes cleanly into Excel).

const isModal = (el: Element) => el.classList.contains('fixed') && el.classList.contains('inset-0');

/** The open dialog if there is one, otherwise the main workspace. */
function currentScreen(): HTMLElement | null {
  const modals = [...document.querySelectorAll<HTMLElement>('body *')].filter(isModal);
  return modals[modals.length - 1] ?? document.querySelector<HTMLElement>('.workspace-content');
}

const cleanCell = (text: string) => text.replace(/\s+/g, ' ').trim();

function fieldValue(cell: Element): string {
  const field = cell.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
  return cleanCell(field ? field.value : cell.textContent ?? '');
}

function tableToText(table: HTMLTableElement): string {
  return [...table.rows]
    .map(row => [...row.cells].map(fieldValue).filter((value, i, all) => value || i < all.length - 1).join('\t').trimEnd())
    .filter(Boolean)
    .join('\n');
}

export function collectScreenText(root: HTMLElement): string {
  const copy = root.cloneNode(true) as HTMLElement;
  const originalTables = root.querySelectorAll('table');
  copy.querySelectorAll('table').forEach((table, i) => {
    const block = document.createElement('div');
    block.textContent = tableToText(originalTables[i]);
    table.replaceWith(block);
  });
  copy.querySelectorAll<HTMLElement>('textarea').forEach((area, i) => {
    const block = document.createElement('div');
    block.textContent = root.querySelectorAll('textarea')[i]?.value ?? '';
    area.replaceWith(block);
  });
  copy.querySelectorAll('button, svg, script, style').forEach(node => node.remove());

  // innerText only follows the layout rules (line breaks between blocks) when the node is attached.
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:900px;white-space:pre-wrap;';
  holder.appendChild(copy);
  document.body.appendChild(holder);
  const text = holder.innerText;
  holder.remove();
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

export async function writeClipboard(text: string) {
  if (window.electronAPI?.copyText) window.electronAPI.copyText(text);
  else await navigator.clipboard.writeText(text);
}

/** Copies the current screen's text. Returns the number of lines copied, or 0 if there was nothing. */
export async function copyScreenText(): Promise<number> {
  const root = currentScreen();
  if (!root) return 0;
  const text = collectScreenText(root);
  if (!text) return 0;
  await writeClipboard(text);
  return text.split('\n').length;
}
