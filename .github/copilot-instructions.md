# Copilot instructions

Project context Copilot should apply to every session in this repository.

## Stack

- Framework: Astro (static output).
- Language: TypeScript.
- Styling: plain CSS in the base layout.

## Conventions

- Keep components small and focused.
- Prefer semantic HTML and accessible markup.
- Do not close, or add closing keywords for, the exercise walkthrough issue (issue #1) in any pull request. The exercise's GitHub Actions workflows manage that issue. When you open a pull request for app work, link only the specific app work-item issue you are implementing.

## Persistence and hydration rules

- **Persistence mechanism**: Bookmarks and app state are persisted in the browser using `localStorage`. This ensures user data survives across sessions and browser restarts.
- **SSR boundary**: All code that accesses `localStorage` must run behind the `client:load` directive in Astro components. This ensures that server-side rendering (SSR) never attempts to access browser APIs, which would cause build errors or runtime failures.
