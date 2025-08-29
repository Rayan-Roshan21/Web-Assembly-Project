# 🎨 WASM Next.js Style Transfer — Make Your Images Pop! 🚀

Welcome to the magical world of **in-browser AI style transfer**! This project lets you transform your images with ONNX models, all running locally in your browser thanks to WebAssembly and Next.js. No servers, no waiting — just instant, client-side art.

---

## 📝 Quick Checklist
- [x] What is this? (And why is it cool?)
- [x] How do I run it? (Windows/PowerShell friendly)
- [x] What files matter?
- [x] Gotchas, tips, and troubleshooting
- [x] How to contribute and join the fun

---

## 🤔 Why This Project?
Ever wanted to run real AI models in your browser, with zero backend? This repo is your playground! It shows how to:
- Load and preprocess images (resize, normalize, tensor-ify!)
- Run ONNX models with `onnxruntime-web` (WASM backend)
- Post-process and display the results — all in a snappy Next.js UI

Perfect for learning, hacking, or showing off to your friends.

---

## 🛠️ Tech Stack
- **Next.js** (App Router) + TypeScript
- **onnxruntime-web** (WASM) for in-browser AI
- **Canvas** for image wrangling

---

## 🚦 Prerequisites
- Node.js 16+ (LTS is best)
- npm

---

## ⚡ Install & Run (PowerShell/Windows)
```powershell
cd "C:\\Users\\jai ma\\Downloads\\Web-Assembly-Project\\wasm-nextjs"
npm install
npm run dev
# Then open: http://localhost:3003 (or whatever port Next.js picks)
```
> 💡 First run? Next.js might warn about multiple lockfiles. Ignore it for local dev!

---

## 🏗️ Build for Production
```powershell
npm run build
npm run start
```

---

## 🎉 How to Use
1. Fire up the app in your browser.
2. Upload your favorite image (cat pics encouraged 🐱).
3. Pick a style model (or stick with the default).
4. Hit the button and watch your image get a style-makeover — right before your eyes!

---

## 🧙‍♂️ Implementation Magic (a.k.a. Important Notes)
- Models want `[1, 3, 224, 224]` (RGB, CHW). Preprocessing in `src/utils/imagePreprocessing.ts` makes sure your image fits just right.
- See `Got invalid dimensions for input: input1 ... Got: 256 Expected: 224`? Tweak the preprocessing config to match your model (see `PREPROCESSING_CONFIGS`).
- Never use `Math.min(...bigTypedArray)` — it’ll crash with "Maximum call stack size exceeded". We scan arrays the safe way.

---

## 🗂️ Key Files
- `src/utils/imagePreprocessing.ts` — image load, resize, normalization, tensor conversion, and post-process helpers.
- `src/utils/onnxModelHandler.ts` — model loading + inference wrapper using `onnxruntime-web`.
- `src/hooks/useONNX.ts` — React hook for model state and inference flow.
- `src/app/page.tsx` — UI for upload, model selection, and display.

---

## 🛠️ Troubleshooting
- **Model load errors:** Check `public/onnx` for your `.onnx` files and make sure the UI points to the right paths.
- **Dimension mismatch:** Preprocessing width/height must match your model’s input dims.
- **Performance:** WASM runs in the main thread. For big images or lots of inferences, consider a Web Worker.

---

## 🤝 Contributing
Pull requests welcome! Open issues for bugs or feature requests, and send PRs for small, focused improvements (tests, docs, bug fixes). Please add a short description of what you changed and why.

---

## 📜 License
This project is for learning and experimentation. Add a license file if you plan to redistribute.

---

Want more? I can add a `CONTRIBUTING.md` and a template for adding new ONNX models (with input shape and normalization settings). Just ask!
