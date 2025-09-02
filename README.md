# Fiction Lab (GitHub Pages)

A static, zero-cost website to present your research on improving AI fiction using a local, multi-pass pipeline.

## How to use
1. **Download** this folder or the ZIP below.
2. `git init && git add . && git commit -m "init: fiction lab site"`
3. Create a repo on GitHub and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<yourname>/fictionlab.git
   git push -u origin main
   ```
4. On GitHub: **Settings → Pages → Build and deployment → Source = Deploy from a branch**,
   then pick `main` and `/ (root)`. Wait for the green check. Your site will be live at:
   `https://<yourname>.github.io/fictionlab/`

## Add experiments
- Put scene texts in `data/experiments/` e.g. `my_scene_baseline.txt`, `my_scene_pipeline.txt`.
- Add an entry to `data/experiments.json` with file names, metrics, tags, and notes.
- The site auto-reads the JSON and displays everything (no backend required).

## Local Reproduction (optional)
See `reproduce.html` for quick steps with Ollama.

MIT License.
